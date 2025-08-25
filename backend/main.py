import asyncio
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json
import os
from dotenv import load_dotenv

from models.schemas import SearchQuery, Thread, Message, StreamingResponse as StreamingResponseModel
from services.search_service import SearchService
from services.llm_service import LLMService
from services.storage_service import StorageService
from services.supermemory_service import SupermemoryService

# Load environment variables
load_dotenv()

app = FastAPI(title="Perplexity Clone API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://perplexity-clone.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
search_service = SearchService()
llm_service = LLMService()
storage_service = StorageService()
supermemory_service = SupermemoryService()

@app.get("/")
async def root():
    return {"message": "Perplexity Clone API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/search")
async def search_endpoint(query: SearchQuery):
    """Search endpoint that returns results and generates response"""
    try:
        # Create or get thread
        thread_id = query.thread_id
        if not thread_id:
            # Generate a title from the first few words of the query
            title = query.query[:50] + ("..." if len(query.query) > 50 else "")
            thread_id = await storage_service.create_thread(title)
        
        # Add user message to thread
        user_message = Message(
            id=str(uuid.uuid4()),
            content=query.query,
            role="user",
            timestamp=datetime.now(),
            sources=None
        )
        await storage_service.add_message_to_thread(thread_id, user_message)
        
        # Get user ID (for now, using a default user - in production you'd get this from auth)
        user_id = "default_user"
        
        # Perform both web search and personal memory search
        web_results = await search_service.search(query.query)
        personal_memories = await supermemory_service.search_memories(query.query, user_id, limit=3)
        
        # Combine results (personal memories first for more personalized responses)
        all_results = personal_memories + web_results
        
        # Create assistant message
        assistant_message = Message(
            id=str(uuid.uuid4()),
            content="",  # Will be filled by streaming
            role="assistant",
            timestamp=datetime.now(),
            sources=all_results
        )
        
        return {
            "thread_id": thread_id,
            "message_id": assistant_message.id,
            "sources": [result.model_dump() for result in all_results],
            "user_message_id": user_message.id,
            "personal_memories_count": len(personal_memories),
            "web_results_count": len(web_results)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.websocket("/ws/stream/{thread_id}/{message_id}")
async def websocket_stream(websocket: WebSocket, thread_id: str, message_id: str):
    """WebSocket endpoint for streaming responses"""
    await websocket.accept()
    
    try:
        # Get the latest message (user query) from the thread
        thread = await storage_service.get_thread(thread_id)
        if not thread or not thread.messages:
            await websocket.send_text(json.dumps({
                "content": "Error: Thread not found",
                "finished": True
            }))
            return
        
        # Get the user's query (last user message)
        user_query = ""
        search_results = []
        
        # Find the most recent user message and any existing sources
        for msg in reversed(thread.messages):
            if msg.role == "user":
                user_query = msg.content
                break
                
        # Find if there are any sources from previous assistant messages
        for msg in reversed(thread.messages):
            if msg.role == "assistant" and msg.sources:
                search_results = msg.sources
                break
        
        # If no sources found, perform search
        if not search_results:
            search_results = await search_service.search(user_query)
        
        # Generate and stream response
        full_response = ""
        async for chunk in llm_service.generate_response(user_query, search_results):
            full_response += chunk
            
            # Send chunk to client
            response_data = {
                "content": chunk,
                "finished": False,
                "full_content": full_response
            }
            await websocket.send_text(json.dumps(response_data))
        
        # Send final message
        final_response = {
            "content": "",
            "finished": True,
            "full_content": full_response
        }
        await websocket.send_text(json.dumps(final_response))
        
        # Save the complete assistant message to thread
        assistant_message = Message(
            id=message_id,
            content=full_response,
            role="assistant",
            timestamp=datetime.now(),
            sources=search_results
        )
        await storage_service.add_message_to_thread(thread_id, assistant_message)
        
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for thread {thread_id}")
    except Exception as e:
        await websocket.send_text(json.dumps({
            "content": f"Error: {str(e)}",
            "finished": True
        }))

@app.get("/threads")
async def get_threads():
    """Get all threads ordered by most recent activity"""
    try:
        threads = await storage_service.get_all_threads()
        return [thread.model_dump() for thread in threads]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get threads: {str(e)}")

@app.get("/threads/{thread_id}")
async def get_thread(thread_id: str):
    """Get a specific thread by ID"""
    try:
        thread = await storage_service.get_thread(thread_id)
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")
        return thread.model_dump()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get thread: {str(e)}")

@app.delete("/threads/{thread_id}")
async def delete_thread(thread_id: str):
    """Delete a thread"""
    try:
        success = await storage_service.delete_thread(thread_id)
        if not success:
            raise HTTPException(status_code=404, detail="Thread not found")
        return {"message": "Thread deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete thread: {str(e)}")

# Supermemory endpoints
@app.post("/supermemory/connect/notion")
async def connect_notion(user_id: str = "default_user"):
    """Create a Notion connection for the user"""
    try:
        redirect_url = "http://localhost:3000/supermemory/callback"
        connection = await supermemory_service.create_notion_connection(redirect_url, user_id)
        return connection
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create connection: {str(e)}")

@app.get("/supermemory/connections")
async def get_connections(user_id: str = "default_user"):
    """Get user's Supermemory connections"""
    try:
        connections = await supermemory_service.get_connections(user_id)
        return {"connections": connections}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get connections: {str(e)}")

@app.post("/supermemory/connections/{connection_id}/sync")
async def sync_connection(connection_id: str):
    """Trigger sync for a connection"""
    try:
        success = await supermemory_service.sync_connection(connection_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to sync connection")
        return {"message": "Sync initiated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync connection: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

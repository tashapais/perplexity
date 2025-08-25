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
        
        # Perform search
        search_results = await search_service.search(query.query)
        
        # Create assistant message
        assistant_message = Message(
            id=str(uuid.uuid4()),
            content="",  # Will be filled by streaming
            role="assistant",
            timestamp=datetime.now(),
            sources=search_results
        )
        
        return {
            "thread_id": thread_id,
            "message_id": assistant_message.id,
            "sources": [result.dict() for result in search_results],
            "user_message_id": user_message.id
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
        return [thread.dict() for thread in threads]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get threads: {str(e)}")

@app.get("/threads/{thread_id}")
async def get_thread(thread_id: str):
    """Get a specific thread by ID"""
    try:
        thread = await storage_service.get_thread(thread_id)
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")
        return thread.dict()
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

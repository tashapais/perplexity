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

from services.notion_service import NotionService

# Load environment variables
load_dotenv()

app = FastAPI(title="Perplexity Clone API", version="1.0.0")

# Configure CORS origins
allowed_origins = [
    "http://localhost:3000",  # Local development
    "https://localhost:3000",  # Local development with HTTPS
]

# Add production origins from environment
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)
    # Also add common variations
    if frontend_url.startswith("https://"):
        # Add Vercel preview deployments
        domain = frontend_url.replace("https://", "")
        allowed_origins.append(f"https://*.{domain}")
        # Add specific Vercel pattern
        if "vercel.app" in domain:
            base_name = domain.split('.')[0]
            allowed_origins.append(f"https://{base_name}-*.vercel.app")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
search_service = SearchService()
llm_service = LLMService()
storage_service = StorageService()

notion_service = NotionService()

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
        
        # Perform search including personal content (Notion) and web results
        all_results = await search_service.search_with_personal_content(
            query.query, 
            count=10, 
            notion_service=notion_service, 
            storage_service=storage_service, 
            user_id=user_id
        )
        

        
        # Create assistant message
        assistant_message = Message(
            id=str(uuid.uuid4()),
            content="",  # Will be filled by streaming
            role="assistant",
            timestamp=datetime.now(),
            sources=all_results
        )
        
        # Count Notion vs web results
        notion_results = [r for r in all_results if r.source == "notion"]
        web_results = [r for r in all_results if r.source != "notion"]
        
        return {
            "thread_id": thread_id,
            "message_id": assistant_message.id,
            "sources": [result.model_dump() for result in all_results],
            "user_message_id": user_message.id,
            "notion_results_count": len(notion_results),
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

# Direct Notion OAuth endpoints
@app.post("/notion/connect")
async def connect_notion_direct(user_id: str = "default_user"):
    """Start direct Notion OAuth flow"""
    try:
        # Check if credentials are configured
        if not notion_service.client_id or not notion_service.client_secret:
            raise HTTPException(
                status_code=500, 
                detail="Notion credentials not configured. Please set NOTION_CLIENT_ID and NOTION_CLIENT_SECRET"
            )
        
        # Generate state for security
        import uuid
        state = str(uuid.uuid4())
        
        # Store state temporarily (you might want to use Redis for this)
        # For now, we'll include user_id in the state
        state_with_user = f"{state}:{user_id}"
        
        # Create redirect URI
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        redirect_uri = f"{frontend_url}/notion/callback"
        
        # Generate OAuth URL
        auth_url = notion_service.create_oauth_url(redirect_uri, state_with_user)
        
        return {
            "authUrl": auth_url,
            "redirectUri": redirect_uri,
            "state": state_with_user
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start Notion OAuth: {str(e)}")

@app.post("/notion/oauth/callback")
async def notion_oauth_callback(code: str, state: str):
    """Handle Notion OAuth callback"""
    try:
        if not code or not state:
            raise HTTPException(status_code=400, detail="Missing code or state parameter")
        
        # Extract user_id from state
        if ":" not in state:
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        state_parts = state.split(":", 1)
        user_id = state_parts[1]
        
        # Create redirect URI
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        redirect_uri = f"{frontend_url}/notion/callback"
        
        # Exchange code for token
        token_data = await notion_service.exchange_code_for_token(code, redirect_uri)
        
        # Get user info
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token received")
        
        user_info = await notion_service.get_user_info(access_token)
        
        # Store token data
        stored = await storage_service.store_notion_token(user_id, {
            "access_token": access_token,
            "token_type": token_data.get("token_type", "bearer"),
            "workspace_name": token_data.get("workspace_name"),
            "workspace_id": token_data.get("workspace_id"),
            "user_info": user_info
        })
        
        if not stored:
            print("Warning: Could not store token in Redis, but OAuth completed successfully")
        
        return {
            "success": True,
            "workspace_name": token_data.get("workspace_name"),
            "user_name": user_info.get("name", "Unknown"),
            "message": "Notion connected successfully!"
        }
        
    except Exception as e:
        print(f"Notion OAuth callback error: {e}")
        print(f"DEBUG: code={code[:10] if code else 'None'}..., state={state}")
        raise HTTPException(status_code=500, detail=f"Failed to complete Notion OAuth: {str(e)}")

@app.get("/notion/status")
async def get_notion_status(user_id: str = "default_user"):
    """Check if user has connected Notion"""
    try:
        token_data = await storage_service.get_notion_token(user_id)
        if token_data:
            return {
                "connected": True,
                "workspace_name": token_data.get("workspace_name"),
                "user_name": token_data.get("user_info", {}).get("name", "Unknown")
            }
        else:
            return {"connected": False}
    except Exception as e:
        return {"connected": False, "error": str(e)}

@app.delete("/notion/disconnect")
async def disconnect_notion(user_id: str = "default_user"):
    """Disconnect Notion integration"""
    try:
        await storage_service.delete_notion_token(user_id)
        return {"success": True, "message": "Notion disconnected successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to disconnect Notion: {str(e)}")

@app.post("/notion/search")
async def search_notion(query: str, user_id: str = "default_user", limit: int = 5):
    """Search user's Notion content"""
    try:
        token_data = await storage_service.get_notion_token(user_id)
        if not token_data:
            raise HTTPException(status_code=401, detail="Notion not connected")
        
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=401, detail="Invalid Notion token")
        
        results = await notion_service.search_notion_content(access_token, query, limit)
        return {"results": [result.dict() for result in results]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search Notion: {str(e)}")





if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

import os
import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, AsyncGenerator
import httpx
import json
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
from services.search import search_service, SearchResult as SearchResultModel
from services.supermemory import (
    create_supermemory_service, 
    ConnectorProvider, 
    ConnectorAuth, 
    ConnectionStatus, 
    SyncResult
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
class Settings:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    BRAVE_API_KEY = os.getenv("BRAVE_API_KEY", "")
    EXA_API_KEY = os.getenv("EXA_API_KEY", "")
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./researchhub.db")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    MAX_SEARCH_RESULTS = int(os.getenv("MAX_SEARCH_RESULTS", "10"))
    MAX_TOKENS = int(os.getenv("MAX_TOKENS_PER_REQUEST", "4000"))
    
    # Supermemory Configuration
    SUPERMEMORY_API_KEY = os.getenv("SUPERMEMORY_API_KEY", "")
    SUPERMEMORY_BASE_URL = os.getenv("SUPERMEMORY_BASE_URL", "https://api.supermemory.ai")
    SUPERMEMORY_REDIRECT_URL = os.getenv("SUPERMEMORY_REDIRECT_URL", "http://localhost:3000/connectors/callback")

settings = Settings()

# Debug: Print supermemory configuration (without exposing full key)
logger.info(f"Supermemory API key configured: {'Yes' if settings.SUPERMEMORY_API_KEY else 'No'}")
if settings.SUPERMEMORY_API_KEY:
    logger.info(f"API key preview: {settings.SUPERMEMORY_API_KEY[:10]}...")

# Initialize supermemory service
supermemory_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global supermemory_service
    logger.info("Starting ResearchHub API...")
    supermemory_service = create_supermemory_service(
        settings.SUPERMEMORY_API_KEY,
        settings.SUPERMEMORY_BASE_URL,
        settings.SUPERMEMORY_REDIRECT_URL
    )
    yield
    # Shutdown
    logger.info("Shutting down ResearchHub API...")
    await search_service.close()
    if supermemory_service:
        await supermemory_service.close()

# FastAPI app
app = FastAPI(
    title="ResearchHub API",
    description="A collaborative AI research engine with real-time search and expert insights",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class SearchRequest(BaseModel):
    query: str
    expert_mode: Optional[str] = None
    max_results: Optional[int] = 10
    include_images: Optional[bool] = True

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    published_date: Optional[str] = None
    relevance_score: Optional[float] = None

class ResearchResponse(BaseModel):
    query: str
    sources: List[SearchResult]
    answer: str
    expert_insights: Optional[List[str]] = None
    related_queries: Optional[List[str]] = None
    timestamp: datetime

class ThreadMessage(BaseModel):
    id: str
    content: str
    role: str  # 'user' or 'assistant'
    timestamp: datetime
    sources: Optional[List[SearchResult]] = None

class ResearchThread(BaseModel):
    id: str
    title: str
    messages: List[ThreadMessage]
    created_at: datetime
    updated_at: datetime

# Supermemory Connector Models
class ConnectorCreateRequest(BaseModel):
    provider: str  # 'google-drive', 'notion', 'onedrive'
    user_id: str

class ConnectorAuthResponse(BaseModel):
    auth_link: str
    connection_id: str
    provider: str
    redirect_url: str

class ConnectionListResponse(BaseModel):
    connections: List[dict]

class SyncRequest(BaseModel):
    connection_id: str

class SyncResponse(BaseModel):
    success: bool
    documents_synced: int
    errors: List[str]
    sync_time: str

# Mock data for demonstration
MOCK_SEARCH_RESULTS = [
    SearchResult(
        title="Artificial Intelligence Breakthroughs in 2024",
        url="https://example.com/ai-breakthroughs-2024",
        snippet="Recent developments in AI include advanced language models, improved computer vision, and breakthrough applications in scientific research.",
        published_date="2024-01-15",
        relevance_score=0.95
    ),
    SearchResult(
        title="The Future of Machine Learning Research",
        url="https://example.com/ml-research-future",
        snippet="Machine learning continues to evolve with new architectures, training methodologies, and applications across various industries.",
        published_date="2024-01-10",
        relevance_score=0.88
    ),
    SearchResult(
        title="AI Ethics and Responsible Development",
        url="https://example.com/ai-ethics-2024",
        snippet="As AI systems become more powerful, the importance of ethical considerations and responsible development practices increases.",
        published_date="2024-01-08",
        relevance_score=0.82
    )
]

# Helper functions
async def search_web(query: str, max_results: int = 10, expert_mode: Optional[str] = None) -> List[SearchResult]:
    """Search the web using available APIs (Brave, Exa, or mock data)"""
    logger.info(f"Searching for: {query} (expert_mode: {expert_mode})")
    
    try:
        if expert_mode:
            search_results = await search_service.search_with_expert_mode(query, expert_mode, max_results)
        else:
            search_results = await search_service.search_hybrid(query, max_results)
        
        # Convert to Pydantic models
        return [
            SearchResult(
                title=result.title,
                url=result.url,
                snippet=result.snippet,
                published_date=result.published_date,
                relevance_score=result.relevance_score
            )
            for result in search_results
        ]
    except Exception as e:
        logger.error(f"Search failed: {str(e)}")
        return MOCK_SEARCH_RESULTS[:max_results]

async def generate_ai_response(query: str, sources: List[SearchResult]) -> AsyncGenerator[str, None]:
    """Generate streaming AI response based on query and sources"""
    # Mock streaming response - in production, use OpenAI API
    mock_response = f"""Based on my research, here's what I found about "{query}":

This is a fascinating topic that has seen significant developments recently. The search results indicate several key trends:

1. **Current Developments**: The field is experiencing rapid advancement with new breakthroughs emerging regularly.

2. **Key Applications**: There are numerous practical applications being developed across various industries.

3. **Future Implications**: The long-term impact could be substantial, affecting how we approach similar challenges.

The sources I found provide comprehensive coverage of this topic, offering both technical insights and broader context. Each source brings a unique perspective that contributes to our understanding.

Would you like me to dive deeper into any specific aspect of this research?"""
    
    # Simulate streaming by yielding chunks
    words = mock_response.split()
    for i, word in enumerate(words):
        if i > 0 and i % 3 == 0:  # Yield every 3 words
            yield " ".join(words[max(0, i-2):i+1]) + " "
        await asyncio.sleep(0.1)  # Simulate processing time

# API Routes
@app.get("/")
async def root():
    return {"message": "ResearchHub API is running!", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/search", response_model=ResearchResponse)
async def search(request: SearchRequest):
    """Perform a research search and return comprehensive results"""
    try:
        # Search the web
        sources = await search_web(request.query, request.max_results, request.expert_mode)
        
        # Generate AI response (non-streaming for this endpoint)
        response_text = ""
        async for chunk in generate_ai_response(request.query, sources):
            response_text += chunk
        
        # Generate related queries
        related_queries = [
            f"What are the implications of {request.query}?",
            f"Recent developments in {request.query}",
            f"Expert opinions on {request.query}",
            f"Future trends related to {request.query}"
        ]
        
        return ResearchResponse(
            query=request.query,
            sources=sources,
            answer=response_text.strip(),
            related_queries=related_queries,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail="Search failed")

@app.post("/search/stream")
async def search_stream(request: SearchRequest):
    """Perform a streaming research search"""
    try:
        # Search the web first
        sources = await search_web(request.query, request.max_results, request.expert_mode)
        
        async def stream_response():
            # First, send sources
            sources_data = {
                "type": "sources",
                "data": [source.dict() for source in sources]
            }
            yield f"data: {json.dumps(sources_data)}\n\n"
            
            # Then stream the AI response
            async for chunk in generate_ai_response(request.query, sources):
                response_data = {
                    "type": "content",
                    "data": chunk
                }
                yield f"data: {json.dumps(response_data)}\n\n"
            
            # Finally, send completion signal
            completion_data = {
                "type": "complete",
                "data": {
                    "related_queries": [
                        f"What are the implications of {request.query}?",
                        f"Recent developments in {request.query}",
                        f"Expert opinions on {request.query}"
                    ]
                }
            }
            yield f"data: {json.dumps(completion_data)}\n\n"
        
        return StreamingResponse(
            stream_response(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            }
        )
        
    except Exception as e:
        logger.error(f"Streaming search error: {str(e)}")
        raise HTTPException(status_code=500, detail="Streaming search failed")

@app.get("/threads", response_model=List[ResearchThread])
async def get_threads():
    """Get all research threads for the user"""
    # Mock data - implement database storage in production
    mock_threads = [
        ResearchThread(
            id="thread-1",
            title="AI Ethics Research",
            messages=[],
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
        ResearchThread(
            id="thread-2", 
            title="Climate Tech Analysis",
            messages=[],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    ]
    return mock_threads

@app.get("/threads/{thread_id}", response_model=ResearchThread)
async def get_thread(thread_id: str):
    """Get a specific research thread"""
    # Mock implementation
    return ResearchThread(
        id=thread_id,
        title="Sample Research Thread",
        messages=[
            ThreadMessage(
                id="msg-1",
                content="What are the latest developments in quantum computing?",
                role="user",
                timestamp=datetime.now()
            ),
            ThreadMessage(
                id="msg-2",
                content="Quantum computing has seen significant advances...",
                role="assistant",
                timestamp=datetime.now(),
                sources=MOCK_SEARCH_RESULTS[:2]
            )
        ],
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

@app.get("/trending")
async def get_trending_topics():
    """Get trending research topics"""
    return {
        "topics": [
            {
                "title": "GPT-4 Vision Capabilities",
                "category": "AI & Technology",
                "trend_score": 15,
                "researchers": 234
            },
            {
                "title": "Quantum Computing Advances", 
                "category": "Science",
                "trend_score": 23,
                "researchers": 189
            },
            {
                "title": "Climate Tech Innovations",
                "category": "Environment", 
                "trend_score": 8,
                "researchers": 156
            }
        ]
    }

@app.get("/experts")
async def get_experts():
    """Get featured domain experts"""
    return {
        "experts": [
            {
                "name": "Dr. Sarah Chen",
                "expertise": "AI & Machine Learning",
                "institution": "Stanford AI Lab",
                "rating": 4.9,
                "sessions": 234
            },
            {
                "name": "Prof. Michael Torres",
                "expertise": "Climate Science", 
                "institution": "MIT Climate Portal",
                "rating": 4.8,
                "sessions": 189
            }
        ]
    }

# Supermemory Connector Endpoints
@app.post("/connectors/create", response_model=ConnectorAuthResponse)
async def create_connector(request: ConnectorCreateRequest):
    """
    Create a new connector to Google Drive, Notion, or OneDrive
    Returns an auth link for the user to authorize the connection
    """
    try:
        if not supermemory_service:
            raise HTTPException(status_code=503, detail="Supermemory service not available")
        
        # Validate provider
        try:
            provider = ConnectorProvider(request.provider)
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid provider. Must be one of: {[p.value for p in ConnectorProvider]}"
            )
        
        # Create connection
        auth_result = await supermemory_service.create_connection(provider, request.user_id)
        
        return ConnectorAuthResponse(
            auth_link=auth_result.auth_link,
            connection_id=auth_result.connection_id,
            provider=auth_result.provider.value,
            redirect_url=settings.SUPERMEMORY_REDIRECT_URL
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating connector: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create connector")

@app.get("/connectors/{user_id}", response_model=ConnectionListResponse)
async def list_user_connections(user_id: str):
    """List all connections for a user"""
    try:
        if not supermemory_service:
            raise HTTPException(status_code=503, detail="Supermemory service not available")
        
        connections = await supermemory_service.list_connections(user_id)
        
        # Convert to dict format for JSON response
        connections_data = []
        for conn in connections:
            connections_data.append({
                "id": conn.id,
                "provider": conn.provider.value,
                "status": conn.status,
                "last_sync": conn.last_sync,
                "documents_count": conn.documents_count,
                "created_at": conn.created_at
            })
        
        return ConnectionListResponse(connections=connections_data)
        
    except Exception as e:
        logger.error(f"Error listing connections: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list connections")

@app.delete("/connectors/{connection_id}")
async def delete_connector(connection_id: str):
    """Delete a connector connection"""
    try:
        if not supermemory_service:
            raise HTTPException(status_code=503, detail="Supermemory service not available")
        
        success = await supermemory_service.delete_connection(connection_id)
        
        if success:
            return {"message": "Connection deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Connection not found or could not be deleted")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting connection: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete connection")

@app.post("/connectors/{provider}/sync", response_model=SyncResponse)
async def sync_connector(provider: str, request: SyncRequest):
    """Manually sync a connector"""
    try:
        if not supermemory_service:
            raise HTTPException(status_code=503, detail="Supermemory service not available")
        
        # Validate provider
        try:
            provider_enum = ConnectorProvider(provider)
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid provider. Must be one of: {[p.value for p in ConnectorProvider]}"
            )
        
        # Sync connection
        sync_result = await supermemory_service.sync_connection(provider_enum, request.connection_id)
        
        return SyncResponse(
            success=sync_result.success,
            documents_synced=sync_result.documents_synced,
            errors=sync_result.errors,
            sync_time=sync_result.sync_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing connector: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to sync connector")

@app.get("/connectors/{user_id}/documents")
async def get_synced_documents(user_id: str, provider: Optional[str] = None):
    """Get documents synced from connectors"""
    try:
        if not supermemory_service:
            raise HTTPException(status_code=503, detail="Supermemory service not available")
        
        provider_enum = None
        if provider:
            try:
                provider_enum = ConnectorProvider(provider)
            except ValueError:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid provider. Must be one of: {[p.value for p in ConnectorProvider]}"
                )
        
        documents = await supermemory_service.get_synced_documents(user_id, provider_enum)
        
        return {
            "documents": documents,
            "count": len(documents),
            "provider_filter": provider
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting synced documents: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get synced documents")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

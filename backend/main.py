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
from services.search import search_service, SearchResult as SearchResultModel

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

settings = Settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting ResearchHub API...")
    yield
    # Shutdown
    logger.info("Shutting down ResearchHub API...")
    await search_service.close()

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

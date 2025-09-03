from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class SearchQuery(BaseModel):
    query: str
    thread_id: Optional[str] = None

class SearchResult(BaseModel):
    title: str
    url: str
    content: str
    snippet: str
    source: str = "web"  # Default to "web", can be "notion" for personal content

class Message(BaseModel):
    id: str
    content: str
    role: str  # 'user' or 'assistant'
    timestamp: datetime
    sources: Optional[List[SearchResult]] = None

class Thread(BaseModel):
    id: str
    title: str
    messages: List[Message]
    created_at: datetime
    updated_at: datetime

class StreamingResponse(BaseModel):
    content: str
    finished: bool
    sources: Optional[List[SearchResult]] = None
    thread_id: Optional[str] = None
    message_id: Optional[str] = None

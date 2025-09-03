import redis
import json
import uuid
import os
from typing import List, Optional
from datetime import datetime
from models.schemas import Thread, Message, SearchResult

class StorageService:
    def __init__(self):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            # Test connection
            self.redis_client.ping()
            self.redis_available = True
            print("✅ Redis connected successfully")
        except Exception as e:
            print(f"⚠️  Redis not available: {e}")
            self.redis_client = None
            self.redis_available = False
        
    def _serialize_thread(self, thread: Thread) -> str:
        """Serialize thread to JSON string"""
        return json.dumps({
            "id": thread.id,
            "title": thread.title,
            "messages": [
                {
                    "id": msg.id,
                    "content": msg.content,
                    "role": msg.role,
                    "timestamp": msg.timestamp.isoformat(),
                    "sources": [
                        {
                            "title": src.title,
                            "url": src.url,
                            "content": src.content,
                            "snippet": src.snippet
                        } for src in (msg.sources or [])
                    ]
                } for msg in thread.messages
            ],
            "created_at": thread.created_at.isoformat(),
            "updated_at": thread.updated_at.isoformat()
        })
    
    def _deserialize_thread(self, data: str) -> Thread:
        """Deserialize JSON string to Thread"""
        thread_data = json.loads(data)
        messages = []
        
        for msg_data in thread_data["messages"]:
            sources = None
            if msg_data.get("sources"):
                sources = [
                    SearchResult(**src) for src in msg_data["sources"]
                ]
            
            messages.append(Message(
                id=msg_data["id"],
                content=msg_data["content"],
                role=msg_data["role"],
                timestamp=datetime.fromisoformat(msg_data["timestamp"]),
                sources=sources
            ))
        
        return Thread(
            id=thread_data["id"],
            title=thread_data["title"],
            messages=messages,
            created_at=datetime.fromisoformat(thread_data["created_at"]),
            updated_at=datetime.fromisoformat(thread_data["updated_at"])
        )
    
    async def create_thread(self, title: str) -> str:
        """Create a new thread and return its ID"""
        thread_id = str(uuid.uuid4())
        now = datetime.now()
        
        thread = Thread(
            id=thread_id,
            title=title,
            messages=[],
            created_at=now,
            updated_at=now
        )
        
        if self.redis_available:
            try:
                self.redis_client.hset("threads", thread_id, self._serialize_thread(thread))
                self.redis_client.zadd("thread_timestamps", {thread_id: now.timestamp()})
            except Exception as e:
                print(f"Redis error in create_thread: {e}")
        
        return thread_id
    
    async def get_thread(self, thread_id: str) -> Optional[Thread]:
        """Get a thread by ID"""
        if not self.redis_available:
            return None
            
        try:
            thread_data = self.redis_client.hget("threads", thread_id)
            if thread_data:
                return self._deserialize_thread(thread_data)
            return None
        except Exception as e:
            print(f"Error getting thread {thread_id}: {e}")
            return None
    
    async def add_message_to_thread(self, thread_id: str, message: Message) -> bool:
        """Add a message to a thread"""
        if not self.redis_available:
            return True  # Return True to not break the flow when Redis is unavailable
            
        try:
            thread = await self.get_thread(thread_id)
            if not thread:
                return False
                
            thread.messages.append(message)
            thread.updated_at = datetime.now()
            
            self.redis_client.hset("threads", thread_id, self._serialize_thread(thread))
            self.redis_client.zadd("thread_timestamps", {thread_id: thread.updated_at.timestamp()})
            
            return True
        except Exception as e:
            print(f"Error adding message to thread {thread_id}: {e}")
            return False
    
    async def get_all_threads(self, limit: int = 50) -> List[Thread]:
        """Get all threads ordered by most recent activity"""
        if not self.redis_available:
            return []
            
        try:
            # Get thread IDs ordered by timestamp (most recent first)
            thread_ids = self.redis_client.zrevrange("thread_timestamps", 0, limit - 1)
            
            threads = []
            for thread_id in thread_ids:
                thread = await self.get_thread(thread_id)
                if thread:
                    threads.append(thread)
            
            return threads
        except Exception as e:
            print(f"Error getting all threads: {e}")
            return []
    
    async def delete_thread(self, thread_id: str) -> bool:
        """Delete a thread"""
        if not self.redis_available:
            return True
            
        try:
            self.redis_client.hdel("threads", thread_id)
            self.redis_client.zrem("thread_timestamps", thread_id)
            return True
        except Exception as e:
            print(f"Error deleting thread {thread_id}: {e}")
            return False
    
    # Notion token management
    async def store_notion_token(self, user_id: str, token_data: dict) -> bool:
        """Store Notion OAuth token for a user"""
        if not self.redis_available:
            return False
            
        try:
            key = f"notion_token:{user_id}"
            self.redis_client.setex(key, 86400, json.dumps(token_data))  # 24 hours expiry
            return True
        except Exception as e:
            print(f"Error storing Notion token for user {user_id}: {e}")
            return False
    
    async def get_notion_token(self, user_id: str) -> Optional[dict]:
        """Get Notion OAuth token for a user"""
        if not self.redis_available:
            return None
            
        try:
            key = f"notion_token:{user_id}"
            token_data = self.redis_client.get(key)
            if token_data:
                return json.loads(token_data)
            return None
        except Exception as e:
            print(f"Error getting Notion token for user {user_id}: {e}")
            return None
    
    async def delete_notion_token(self, user_id: str) -> bool:
        """Delete Notion OAuth token for a user"""
        if not self.redis_available:
            return True
            
        try:
            key = f"notion_token:{user_id}"
            self.redis_client.delete(key)
            return True
        except Exception as e:
            print(f"Error deleting Notion token for user {user_id}: {e}")
            return False
import httpx
import os
from typing import List, Dict, Any, Optional
from models.schemas import SearchResult

class SupermemoryService:
    def __init__(self):
        self.api_key = os.getenv("SUPERMEMORY_API_KEY")
        self.base_url = "https://api.supermemory.ai/v3"
        
    async def _make_request(self, method: str, url: str, headers: Dict[str, str], 
                          json_data: Dict[str, Any] = None) -> httpx.Response:
        """Make a single HTTP request without retries"""
        async with httpx.AsyncClient() as client:
            if method.upper() == "POST":
                response = await client.post(url, headers=headers, json=json_data, timeout=10.0)
            else:
                response = await client.get(url, headers=headers, timeout=10.0)
            
            return response
        
    async def create_notion_connection(self, redirect_url: str, user_id: str) -> Dict[str, Any]:
        """Create a Notion connection for a user"""
        if not self.api_key:
            raise Exception("SUPERMEMORY_API_KEY not configured")
            
        url = f"{self.base_url}/connections/notion"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "redirectUrl": redirect_url,
            "containerTags": [f"user_{user_id}"],
            "metadata": {
                "user_id": user_id,
                "source": "coolperplexity"
            },
            "documentLimit": 1000
        }
        
        try:
            print(f"DEBUG: Creating Notion connection to {url}")
            print(f"DEBUG: Payload: {payload}")
            response = await self._make_request("POST", url, headers, payload)
            print(f"DEBUG: Create connection response status: {response.status_code}")
            
            if response.status_code == 429:
                raise Exception("Rate limit exceeded. Please wait a few minutes before trying again.")
            
            response.raise_for_status()
            result = response.json()
            print(f"DEBUG: Create connection result: {result}")
            return result
        except Exception as e:
            print(f"Supermemory connection error: {e}")
            raise e
    
    async def search_memories(self, query: str, user_id: str, limit: int = 5) -> List[SearchResult]:
        """Search user's personal memories"""
        if not self.api_key:
            return []
            
        url = f"{self.base_url}/search"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "query": query,
            "limit": limit,
            "containerTags": [f"user_{user_id}"]
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=headers, json=payload, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                results = []
                for item in data.get("memories", []):
                    results.append(SearchResult(
                        title=item.get("title", "Personal Note"),
                        url=item.get("url", "#"),
                        content=item.get("content", "")[:500] + "..." if len(item.get("content", "")) > 500 else item.get("content", ""),
                        snippet=item.get("content", "")[:200] + "..." if len(item.get("content", "")) > 200 else item.get("content", "")
                    ))
                
                return results
            except Exception as e:
                print(f"Supermemory search error: {e}")
                return []
    
    async def get_connections(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's connections"""
        if not self.api_key:
            return []
            
        url = f"{self.base_url}/connections/list"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            print(f"DEBUG: Making request to {url}")
            response = await self._make_request("POST", url, headers, {})
            print(f"DEBUG: Response status: {response.status_code}")
            
            if response.status_code == 429:
                print("DEBUG: Rate limit exceeded when fetching connections")
                return []
            
            response.raise_for_status()
            data = response.json()
            print(f"DEBUG: Response data: {data}")
            
            # The response is an array of connections
            all_connections = data if isinstance(data, list) else []
            user_connections = []
            for conn in all_connections:
                # Check if this connection belongs to the user
                metadata = conn.get("metadata", {})
                print(f"DEBUG: Connection metadata: {metadata}")
                if metadata.get("user_id") == user_id:
                    user_connections.append(conn)
            
            print(f"DEBUG: Found {len(user_connections)} user connections")
            return user_connections
        except Exception as e:
            print(f"Get connections error: {e}")
            print(f"DEBUG: URL was: {url}")
            return []
    

    async def sync_connection(self, connection_id: str) -> bool:
        """Trigger sync for a connection"""
        if not self.api_key:
            return False
            
        url = f"{self.base_url}/connections/{connection_id}/sync"
        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=headers, timeout=30.0)
                response.raise_for_status()
                return True
            except Exception as e:
                print(f"Sync connection error: {e}")
                return False

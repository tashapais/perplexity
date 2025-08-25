import httpx
import os
from typing import List, Dict, Any
from models.schemas import SearchResult

class SearchService:
    def __init__(self):
        self.brave_api_key = os.getenv("BRAVE_API_KEY")
        self.exa_api_key = os.getenv("EXA_API_KEY")
        
    async def search_brave(self, query: str, count: int = 10) -> List[SearchResult]:
        """Search using Brave Search API"""
        if not self.brave_api_key:
            return []
            
        url = "https://api.search.brave.com/res/v1/web/search"
        headers = {
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": self.brave_api_key
        }
        params = {
            "q": query,
            "count": count,
            "text_decorations": False,
            "search_lang": "en",
            "country": "US",
            "safesearch": "moderate"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                results = []
                for item in data.get("web", {}).get("results", []):
                    results.append(SearchResult(
                        title=item.get("title", ""),
                        url=item.get("url", ""),
                        content=item.get("description", ""),
                        snippet=item.get("description", "")
                    ))
                return results
            except Exception as e:
                print(f"Brave search error: {e}")
                return []
    
    async def search_exa(self, query: str, count: int = 10) -> List[SearchResult]:
        """Search using Exa API"""
        if not self.exa_api_key:
            return []
            
        url = "https://api.exa.ai/search"
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "x-api-key": self.exa_api_key
        }
        payload = {
            "query": query,
            "numResults": min(count, 10),
            "contents": {
                "text": True
            },
            "type": "neural"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=headers, json=payload, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                results = []
                for item in data.get("results", []):
                    text_content = item.get("text", "") or item.get("snippet", "") or ""
                    results.append(SearchResult(
                        title=item.get("title", ""),
                        url=item.get("url", ""),
                        content=text_content[:500] + "..." if len(text_content) > 500 else text_content,
                        snippet=text_content[:200] + "..." if len(text_content) > 200 else text_content
                    ))
                return results
            except Exception as e:
                print(f"Exa search error: {e}")
                return []
    
    async def search(self, query: str, count: int = 10) -> List[SearchResult]:
        """Search using available search APIs (fallback to Exa if Brave fails)"""
        # Try Brave first
        results = await self.search_brave(query, count)
        
        # If Brave fails or returns no results, try Exa
        if not results:
            results = await self.search_exa(query, count)
            
        return results[:count]

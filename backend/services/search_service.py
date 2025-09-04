import httpx
import os
from typing import List, Dict, Any, Optional
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
                        snippet=item.get("description", ""),
                        source="web"
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
                        snippet=text_content[:200] + "..." if len(text_content) > 200 else text_content,
                        source="web"
                    ))
                return results
            except Exception as e:
                print(f"Exa search error: {e}")
                return []
    
    async def search_with_personal_content(self, query: str, count: int = 10, 
                                          notion_service=None, storage_service=None, 
                                          user_id: str = "default_user") -> List[SearchResult]:
        """Search including personal content from Notion and other sources"""
        all_results = []
        
        # Search personal Notion content first with detailed debugging
        if notion_service and storage_service:
            try:
                token_data = await storage_service.get_notion_token(user_id)
                if token_data and token_data.get("access_token"):
                    print(f"DEBUG: Searching Notion with token for query: '{query}'")
                    notion_results = await notion_service.search_notion_content(
                        token_data["access_token"], query, min(5, count // 2)
                    )
                    print(f"DEBUG: Found {len(notion_results)} Notion results")
                    for result in notion_results:
                        result.source = "notion"  # Ensure source is set
                        print(f"DEBUG: Notion result - Title: {result.title}, Content: {result.content[:100]}...")
                    all_results.extend(notion_results)
                else:
                    print("DEBUG: No valid Notion token found")
            except Exception as e:
                print(f"Error searching Notion content: {e}")
        
        # Prioritize Notion results - limit web results if we have Notion content
        web_limit = max(3, count - len(all_results)) if all_results else count
        web_results = await self.search(query, web_limit)
        all_results.extend(web_results)
        
        # Always prioritize Notion results at the top
        notion_results = [r for r in all_results if r.source == "notion"]
        web_results = [r for r in all_results if r.source != "notion"]
        
        # Return Notion results first, then web results
        prioritized_results = notion_results + web_results
        return prioritized_results[:count]
    
    async def search(self, query: str, count: int = 10) -> List[SearchResult]:
        """Search using available search APIs (fallback to Exa if Brave fails)"""
        # Try Brave first
        results = await self.search_brave(query, count)
        
        # If Brave fails or returns no results, try Exa
        if not results:
            results = await self.search_exa(query, count)
            
        return results[:count]

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
                    # Extract image URL if available
                    image_url = None
                    if "thumbnail" in item and item["thumbnail"] and "src" in item["thumbnail"]:
                        image_url = item["thumbnail"]["src"]
                    
                    # Extract favicon
                    favicon_url = item.get("profile", {}).get("img") if "profile" in item else None
                    
                    results.append(SearchResult(
                        title=item.get("title", ""),
                        url=item.get("url", ""),
                        content=item.get("description", ""),
                        snippet=item.get("description", ""),
                        source="web",
                        image_url=image_url,
                        favicon_url=favicon_url
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
                    
                    # Extract favicon from URL domain
                    url = item.get("url", "")
                    favicon_url = None
                    if url:
                        from urllib.parse import urlparse
                        domain = urlparse(url).netloc
                        favicon_url = f"https://{domain}/favicon.ico"
                    
                    results.append(SearchResult(
                        title=item.get("title", ""),
                        url=url,
                        content=text_content[:500] + "..." if len(text_content) > 500 else text_content,
                        snippet=text_content[:200] + "..." if len(text_content) > 200 else text_content,
                        source="web",
                        image_url=None,  # Exa doesn't typically return images
                        favicon_url=favicon_url
                    ))
                return results
            except Exception as e:
                print(f"Exa search error: {e}")
                return []
    
    async def search_with_personal_content(self, query: str, count: int = 10, 
                                          notion_service=None, storage_service=None, 
                                          user_id: str = "default_user") -> Dict[str, Any]:
        """Proactive personalized search: analyze Notion content first, then search strategically"""
        
        # Step 1: Get user's personal knowledge from Notion
        notion_results = []
        if notion_service and storage_service:
            try:
                token_data = await storage_service.get_notion_token(user_id)
                if token_data and token_data.get("access_token"):
                    print(f"DEBUG: Getting ALL user's Notion content for analysis")
                    # Get ALL accessible pages for analysis, not just query matches
                    all_pages = await notion_service.get_all_accessible_pages(token_data["access_token"], limit=20)
                    
                    # Convert pages to SearchResult format for analysis
                    for page in all_pages:
                        try:
                            page_id = page["id"]
                            page_title = notion_service.get_page_title(page)
                            content_data = await notion_service.get_page_content(token_data["access_token"], page_id)
                            content_text = notion_service.extract_text_from_blocks(content_data.get("results", []))
                            
                            result = SearchResult(
                                title=f"📄 {page_title.strip()}",
                                url=page.get("url", f"https://notion.so/{page_id}"),
                                content=content_text if content_text.strip() else f"Content from Notion page: {page_title}",
                                snippet=content_text[:200] if content_text.strip() else f"Your personal Notion page: {page_title}",
                                source="notion"
                            )
                            notion_results.append(result)
                        except Exception as e:
                            print(f"Error processing page {page.get('id')}: {e}")
                            continue
                    
                    print(f"DEBUG: Loaded {len(notion_results)} Notion pages for personalization")
            except Exception as e:
                print(f"Error getting Notion content: {e}")
        
        # Step 2: Use personalization service to create search strategy
        from .personalization_service import PersonalizationService
        personalization_service = PersonalizationService()
        
        search_strategy = await personalization_service.create_personalized_search_strategy(
            query, notion_results
        )
        
        # Step 3: Execute personalized searches
        all_web_results = []
        personalized_queries = search_strategy.get("personalized_queries", [query])
        
        print(f"DEBUG: Executing {len(personalized_queries)} personalized searches")
        for pq in personalized_queries:
            print(f"DEBUG: Searching for: '{pq}'")
            results = await self.search(pq, max(2, count // len(personalized_queries)))
            all_web_results.extend(results)
        
        # Step 4: Filter Notion results based on relevance to the original query
        relevant_notion_results = []
        query_lower = query.lower()
        for notion_result in notion_results:
            full_text = f"{notion_result.title} {notion_result.content}".lower()
            if any(word in full_text for word in query_lower.split()) or len(query_lower) > 20:
                relevant_notion_results.append(notion_result)
        
        print(f"DEBUG: Found {len(relevant_notion_results)} relevant Notion results")
        
        # Step 5: Combine and prioritize results
        final_results = relevant_notion_results + all_web_results[:count-len(relevant_notion_results)]
        
        return {
            "results": final_results[:count],
            "search_strategy": search_strategy,
            "notion_results_count": len(relevant_notion_results),
            "web_results_count": len(all_web_results)
        }
    
    async def search(self, query: str, count: int = 10) -> List[SearchResult]:
        """Search using available search APIs (fallback to Exa if Brave fails)"""
        # Try Brave first
        results = await self.search_brave(query, count)
        
        # If Brave fails or returns no results, try Exa
        if not results:
            results = await self.search_exa(query, count)
            
        return results[:count]

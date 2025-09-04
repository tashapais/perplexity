import httpx
import os
import base64
from typing import List, Dict, Any, Optional
from models.schemas import SearchResult

class NotionService:
    def __init__(self):
        self.client_id = os.getenv("NOTION_CLIENT_ID")
        self.client_secret = os.getenv("NOTION_CLIENT_SECRET")
        self.base_url = "https://api.notion.com/v1"
        self.oauth_url = "https://api.notion.com/v1/oauth"
        
    def create_oauth_url(self, redirect_uri: str, state: str) -> str:
        """Create Notion OAuth authorization URL"""
        return (
            f"{self.oauth_url}/authorize?"
            f"client_id={self.client_id}&"
            f"response_type=code&"
            f"redirect_uri={redirect_uri}&"
            f"state={state}"
        )
    
    async def exchange_code_for_token(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        if not self.client_id or not self.client_secret:
            raise Exception("NOTION_CLIENT_ID and NOTION_CLIENT_SECRET must be configured")
        
        url = f"{self.oauth_url}/token"
        
        # Encode client credentials for Basic auth
        import base64
        credentials = f"{self.client_id}:{self.client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        # Prepare form data (without client credentials - they go in header)
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        }
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": f"Basic {encoded_credentials}"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                print(f"DEBUG: Exchanging code for token at {url}")
                print(f"DEBUG: Using Basic auth with client_id: {self.client_id[:8]}...")
                response = await client.post(
                    url,
                    headers=headers,
                    data=data,
                    timeout=10.0
                )
                print(f"DEBUG: Token exchange response status: {response.status_code}")
                
                if response.status_code != 200:
                    error_text = await response.aread()
                    print(f"DEBUG: Token exchange error: {error_text}")
                    raise Exception(f"Token exchange failed: {response.status_code} - {error_text}")
                
                result = response.json()
                print(f"DEBUG: Token exchange successful")
                return result
                
            except Exception as e:
                print(f"Notion token exchange error: {e}")
                raise e
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information using access token"""
        url = f"{self.base_url}/users/me"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Notion-Version": "2022-06-28"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers, timeout=10.0)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                print(f"Failed to get user info: {e}")
                raise e
    
    async def get_all_accessible_pages(self, access_token: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get all pages accessible to the integration (no query filter)"""
        url = f"{self.base_url}/search"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
        }
        
        payload = {
            "filter": {
                "value": "page",
                "property": "object"
            },
            "page_size": limit
        }
        
        async with httpx.AsyncClient() as client:
            try:
                print(f"DEBUG: Getting all accessible pages")
                response = await client.post(url, headers=headers, json=payload, timeout=10.0)
                print(f"DEBUG: All pages response status: {response.status_code}")
                
                if response.status_code != 200:
                    error_text = await response.aread()
                    print(f"DEBUG: Error getting pages: {error_text}")
                
                response.raise_for_status()
                data = response.json()
                return data.get("results", [])
            except Exception as e:
                print(f"Failed to get accessible pages: {e}")
                return []

    def get_page_title(self, page: Dict[str, Any]) -> str:
        """Extract title from a Notion page object"""
        try:
            properties = page.get("properties", {})
            
            # Look for title in different possible locations
            for prop_name, prop_data in properties.items():
                if prop_data.get("type") == "title":
                    title_list = prop_data.get("title", [])
                    if title_list:
                        return "".join([t.get("plain_text", "") for t in title_list])
            
            # Fallback: check if it's in the page object directly
            if "title" in page:
                return page["title"]
                
            # Last resort: use page ID
            return f"Untitled Page ({page.get('id', 'Unknown')})"
            
        except Exception as e:
            print(f"Error extracting title: {e}")
            return "Unknown Title"

    async def search_pages(self, access_token: str, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search pages in user's Notion workspace"""
        url = f"{self.base_url}/search"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
        }
        
        payload = {
            "query": query,
            "filter": {
                "value": "page",
                "property": "object"
            },
            "page_size": limit
        }
        
        async with httpx.AsyncClient() as client:
            try:
                print(f"DEBUG: Notion search URL: {url}")
                print(f"DEBUG: Notion search payload: {payload}")
                response = await client.post(url, headers=headers, json=payload, timeout=10.0)
                print(f"DEBUG: Notion search response status: {response.status_code}")
                
                if response.status_code != 200:
                    error_text = await response.aread()
                    print(f"DEBUG: Notion search error response: {error_text}")
                
                response.raise_for_status()
                data = response.json()
                print(f"DEBUG: Notion search returned {len(data.get('results', []))} results")
                if data.get("results"):
                    for i, result in enumerate(data["results"][:2]):  # Log first 2 results
                        print(f"DEBUG: Result {i+1} - ID: {result.get('id')}, Object: {result.get('object')}")
                return data.get("results", [])
            except Exception as e:
                print(f"Failed to search pages: {e}")
                return []
    
    async def get_page_content(self, access_token: str, page_id: str) -> Dict[str, Any]:
        """Get content of a specific page"""
        url = f"{self.base_url}/blocks/{page_id}/children"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Notion-Version": "2022-06-28"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers, timeout=10.0)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                print(f"Failed to get page content: {e}")
                return {"results": []}
    
    def extract_text_from_blocks(self, blocks: List[Dict[str, Any]]) -> str:
        """Extract plain text from Notion blocks"""
        text_parts = []
        
        for block in blocks:
            block_type = block.get("type", "")
            block_data = block.get(block_type, {})
            
            if "rich_text" in block_data:
                for text_obj in block_data["rich_text"]:
                    if "text" in text_obj:
                        text_parts.append(text_obj["text"]["content"])
            elif block_type == "child_page":
                text_parts.append(block_data.get("title", ""))
        
        return " ".join(text_parts)
    
    async def search_notion_content(self, access_token: str, query: str, limit: int = 5) -> List[SearchResult]:
        """Search Notion content and return SearchResult objects"""
        try:
            print(f"DEBUG: Starting real Notion search for query: '{query}'")
            
            # First, let's see ALL pages the integration has access to (no query filter)
            all_pages = await self.get_all_accessible_pages(access_token)
            print(f"DEBUG: Integration has access to {len(all_pages)} total pages")
            for i, page in enumerate(all_pages[:3]):  # Show first 3 pages
                title = self.get_page_title(page)
                print(f"DEBUG: Page {i+1}: '{title}' (ID: {page.get('id', 'Unknown')})")
            
            # Notion's search API is limited, so let's do our own filtering
            # Get page content for each accessible page and search within it
            results = []
            query_lower = query.lower()
            
            for page in all_pages[:limit]:  # Limit to avoid too many API calls
                try:
                    page_id = page["id"]
                    page_title = self.get_page_title(page)
                    
                    # Get page content
                    content_data = await self.get_page_content(access_token, page_id)
                    content_text = self.extract_text_from_blocks(content_data.get("results", []))
                    
                    # Check if query matches title or content
                    full_text = f"{page_title} {content_text}".lower()
                    if query_lower in full_text:
                        print(f"DEBUG: Found match in page '{page_title}' - query '{query}' found in content")
                        print(f"DEBUG: Content preview: {content_text[:100]}...")
                        
                        # Ensure content is not empty
                        final_content = content_text if content_text.strip() else f"Content from Notion page: {page_title}"
                        final_snippet = content_text[:200] if content_text.strip() else f"Your personal Notion page: {page_title}"
                        
                        # Create search result
                        result = SearchResult(
                            title=f"📄 {page_title.strip()}",
                            url=page.get("url", f"https://notion.so/{page_id}"),
                            content=final_content[:500] + "..." if len(final_content) > 500 else final_content,
                            snippet=f"From your personal Notion page: {final_snippet}",
                            source="notion"
                        )
                        results.append(result)
                        print(f"DEBUG: Added Notion result: {result.title}")
                    else:
                        print(f"DEBUG: No match in page '{page_title}' for query '{query}'")
                        
                except Exception as e:
                    print(f"DEBUG: Error processing page {page.get('id')}: {e}")
                    continue
            
            print(f"DEBUG: Returning {len(results)} Notion results for query '{query}'")
            return results
            
        except Exception as e:
            print(f"Error searching Notion content: {e}")
            return []

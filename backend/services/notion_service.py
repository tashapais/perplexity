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
                response = await client.post(url, headers=headers, json=payload, timeout=10.0)
                response.raise_for_status()
                data = response.json()
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
            pages = await self.search_pages(access_token, query, limit)
            results = []
            
            for page in pages:
                # Get page content
                page_id = page["id"]
                content_data = await self.get_page_content(access_token, page_id)
                content_text = self.extract_text_from_blocks(content_data.get("results", []))
                
                # Extract page title
                title = "Untitled"
                if "properties" in page and "title" in page["properties"]:
                    title_prop = page["properties"]["title"]
                    if "title" in title_prop and title_prop["title"]:
                        title = title_prop["title"][0]["text"]["content"]
                elif "properties" in page:
                    # Look for any property that might contain the title
                    for prop_name, prop_data in page["properties"].items():
                        if prop_data.get("type") == "title" and prop_data.get("title"):
                            title = prop_data["title"][0]["text"]["content"]
                            break
                
                # Create SearchResult
                result = SearchResult(
                    title=title,
                    url=page.get("url", f"https://notion.so/{page_id}"),
                    snippet=content_text[:200] + "..." if len(content_text) > 200 else content_text,
                    source="notion"
                )
                results.append(result)
            
            return results
            
        except Exception as e:
            print(f"Error searching Notion content: {e}")
            return []

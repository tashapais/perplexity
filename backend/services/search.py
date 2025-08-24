import os
import httpx
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class SearchResult:
    title: str
    url: str
    snippet: str
    published_date: Optional[str] = None
    relevance_score: Optional[float] = None
    domain: Optional[str] = None
    favicon: Optional[str] = None

class SearchService:
    def __init__(self):
        self.brave_api_key = os.getenv("BRAVE_API_KEY")
        self.exa_api_key = os.getenv("EXA_API_KEY")
        self.client = httpx.AsyncClient(timeout=30.0)

    async def search_brave(self, query: str, count: int = 10) -> List[SearchResult]:
        """Search using Brave Search API"""
        if not self.brave_api_key:
            logger.warning("Brave API key not configured, using mock data")
            return self._get_mock_results(query, count)

        try:
            headers = {
                "Accept": "application/json",
                "Accept-Encoding": "gzip",
                "X-Subscription-Token": self.brave_api_key
            }
            
            params = {
                "q": query,
                "count": count,
                "search_lang": "en",
                "country": "US",
                "safesearch": "moderate",
                "text_decorations": False,
                "spellcheck": True
            }

            response = await self.client.get(
                "https://api.search.brave.com/res/v1/web/search",
                headers=headers,
                params=params
            )
            
            if response.status_code != 200:
                logger.error(f"Brave API error: {response.status_code} - {response.text}")
                return self._get_mock_results(query, count)

            data = response.json()
            results = []

            for result in data.get("web", {}).get("results", []):
                search_result = SearchResult(
                    title=result.get("title", ""),
                    url=result.get("url", ""),
                    snippet=result.get("description", ""),
                    published_date=result.get("age"),
                    domain=result.get("profile", {}).get("name")
                )
                results.append(search_result)

            logger.info(f"Brave search returned {len(results)} results for query: {query}")
            return results

        except Exception as e:
            logger.error(f"Brave search failed: {str(e)}")
            return self._get_mock_results(query, count)

    async def search_exa(self, query: str, count: int = 10) -> List[SearchResult]:
        """Search using Exa API"""
        if not self.exa_api_key:
            logger.warning("Exa API key not configured, using mock data")
            return self._get_mock_results(query, count)

        try:
            headers = {
                "Content-Type": "application/json",
                "x-api-key": self.exa_api_key
            }

            payload = {
                "query": query,
                "numResults": count,
                "type": "auto",
                "contents": {
                    "text": True,
                    "highlights": True
                },
                "useAutoprompt": True
            }

            response = await self.client.post(
                "https://api.exa.ai/search",
                headers=headers,
                json=payload
            )

            if response.status_code != 200:
                logger.error(f"Exa API error: {response.status_code} - {response.text}")
                return self._get_mock_results(query, count)

            data = response.json()
            results = []

            for result in data.get("results", []):
                search_result = SearchResult(
                    title=result.get("title", ""),
                    url=result.get("url", ""),
                    snippet=result.get("text", "")[:300] + "..." if result.get("text") else "",
                    published_date=result.get("publishedDate"),
                    relevance_score=result.get("score")
                )
                results.append(search_result)

            logger.info(f"Exa search returned {len(results)} results for query: {query}")
            return results

        except Exception as e:
            logger.error(f"Exa search failed: {str(e)}")
            return self._get_mock_results(query, count)

    async def search_hybrid(self, query: str, count: int = 10) -> List[SearchResult]:
        """Perform hybrid search using multiple APIs"""
        try:
            # Try Brave first, then fallback to Exa
            results = await self.search_brave(query, count)
            
            if not results or len(results) < count // 2:
                logger.info("Brave search returned few results, trying Exa as supplement")
                exa_results = await self.search_exa(query, count - len(results))
                results.extend(exa_results)

            # Remove duplicates based on URL
            seen_urls = set()
            unique_results = []
            for result in results:
                if result.url not in seen_urls:
                    seen_urls.add(result.url)
                    unique_results.append(result)

            return unique_results[:count]

        except Exception as e:
            logger.error(f"Hybrid search failed: {str(e)}")
            return self._get_mock_results(query, count)

    def _get_mock_results(self, query: str, count: int) -> List[SearchResult]:
        """Return mock search results for demonstration"""
        mock_results = [
            SearchResult(
                title=f"Comprehensive Research on {query.title()}",
                url="https://example.com/research-1",
                snippet=f"This comprehensive study explores {query} from multiple perspectives, providing detailed analysis and expert insights into the latest developments and trends.",
                published_date="2024-01-15",
                relevance_score=0.95,
                domain="Research Institute"
            ),
            SearchResult(
                title=f"Expert Analysis: {query.title()} Trends and Implications",
                url="https://example.com/analysis-2",
                snippet=f"Leading experts discuss the current state of {query}, examining key trends, challenges, and future implications for the industry and society.",
                published_date="2024-01-12",
                relevance_score=0.88,
                domain="Expert Analysis"
            ),
            SearchResult(
                title=f"Latest Developments in {query.title()}",
                url="https://example.com/news-3",
                snippet=f"Breaking news and recent developments related to {query}, including breakthrough discoveries, policy changes, and market impacts.",
                published_date="2024-01-10",
                relevance_score=0.82,
                domain="News Source"
            ),
            SearchResult(
                title=f"Technical Guide: Understanding {query.title()}",
                url="https://example.com/guide-4",
                snippet=f"A detailed technical guide explaining the fundamentals of {query}, including methodologies, best practices, and practical applications.",
                published_date="2024-01-08",
                relevance_score=0.78,
                domain="Technical Documentation"
            ),
            SearchResult(
                title=f"Case Studies: {query.title()} in Practice",
                url="https://example.com/cases-5",
                snippet=f"Real-world case studies demonstrating successful implementations and applications of {query} across various industries and contexts.",
                published_date="2024-01-05",
                relevance_score=0.75,
                domain="Case Studies"
            )
        ]
        
        return mock_results[:count]

    async def search_with_expert_mode(self, query: str, expert_mode: str, count: int = 10) -> List[SearchResult]:
        """Enhanced search with domain-specific filtering"""
        
        # Modify query based on expert mode
        enhanced_query = self._enhance_query_for_expert_mode(query, expert_mode)
        
        # Perform search
        results = await self.search_hybrid(enhanced_query, count * 2)  # Get more results for filtering
        
        # Filter and rank results based on expert mode
        filtered_results = self._filter_for_expert_mode(results, expert_mode)
        
        return filtered_results[:count]

    def _enhance_query_for_expert_mode(self, query: str, expert_mode: str) -> str:
        """Enhance search query based on expert mode"""
        enhancements = {
            "technology": f"{query} tech innovation research development",
            "finance": f"{query} financial analysis market trends investment",
            "science": f"{query} scientific research peer-reviewed academic",
            "health": f"{query} medical health clinical research evidence-based",
            "business": f"{query} business strategy market analysis industry",
            "policy": f"{query} policy government regulation governance",
            "academic": f"{query} academic research literature review scholarly",
            "environment": f"{query} environmental sustainability climate impact"
        }
        
        return enhancements.get(expert_mode.lower(), query)

    def _filter_for_expert_mode(self, results: List[SearchResult], expert_mode: str) -> List[SearchResult]:
        """Filter and prioritize results based on expert mode"""
        
        # Domain preferences for each expert mode
        preferred_domains = {
            "technology": ["arxiv.org", "ieee.org", "acm.org", "techcrunch.com", "mit.edu"],
            "finance": ["bloomberg.com", "reuters.com", "wsj.com", "sec.gov", "federalreserve.gov"],
            "science": ["nature.com", "science.org", "plos.org", "pubmed.ncbi.nlm.nih.gov"],
            "health": ["who.int", "cdc.gov", "nih.gov", "nejm.org", "bmj.com"],
            "business": ["hbr.org", "mckinsey.com", "bain.com", "bcg.com", "fortune.com"],
            "policy": ["gov", ".org", "brookings.edu", "cfr.org", "rand.org"],
            "academic": ["edu", "ac.uk", "jstor.org", "springer.com", "elsevier.com"],
            "environment": ["ipcc.ch", "epa.gov", "unep.org", "worldbank.org", "iea.org"]
        }
        
        preferred = preferred_domains.get(expert_mode.lower(), [])
        
        # Score results based on domain preference
        for result in results:
            domain_score = 0
            if result.domain:
                for pref_domain in preferred:
                    if pref_domain in result.domain.lower() or pref_domain in result.url.lower():
                        domain_score = 1.0
                        break
            
            # Adjust relevance score
            if result.relevance_score:
                result.relevance_score = (result.relevance_score * 0.7) + (domain_score * 0.3)
            else:
                result.relevance_score = domain_score
        
        # Sort by relevance score
        return sorted(results, key=lambda x: x.relevance_score or 0, reverse=True)

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

# Global search service instance
search_service = SearchService()

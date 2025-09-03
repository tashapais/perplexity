import openai
import os
from typing import List, AsyncGenerator
from models.schemas import SearchResult

class LLMService:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.client = openai.AsyncOpenAI(api_key=self.openai_api_key)
        
    def create_context_prompt(self, query: str, search_results: List[SearchResult]) -> str:
        """Create a context-aware prompt with search results"""
        context = "You are answering a user's question using both their personal knowledge base and web search results.\n\n"
        
        # Separate Notion content from web results
        notion_results = []
        web_results = []
        
        for result in search_results:
            if result.source == "notion":
                notion_results.append(result)
            else:
                web_results.append(result)
        
        # Add Notion content first (personal knowledge)
        if notion_results:
            context += "YOUR PERSONAL NOTION CONTENT:\n"
            for i, result in enumerate(notion_results, 1):
                context += f"Notion Page {i}: {result.title}\nContent: {result.content or result.snippet}\n\n"
        
        # Add web results
        if web_results:
            context += "WEB SEARCH RESULTS:\n"
            start_num = len(notion_results) + 1
            for i, result in enumerate(web_results, start_num):
                context += f"Source {i}: {result.title}\nURL: {result.url}\nContent: {result.content or result.snippet}\n\n"
        
        context += f"User Question: {query}\n\n"
        context += """Please provide a personalized, comprehensive answer based on the information above. 
        Prioritize information from the user's personal knowledge base when relevant.
        Include relevant citations using [1], [2], etc. format referencing the source numbers.
        If you're drawing from personal notes, mention that you're referencing their personal knowledge.
        If combining personal and web information, clearly distinguish between them."""
        
        return context
    
    async def generate_response(self, query: str, search_results: List[SearchResult]) -> AsyncGenerator[str, None]:
        """Generate streaming response using OpenAI GPT"""
        try:
            prompt = self.create_context_prompt(query, search_results)
            
            stream = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a helpful research assistant that provides accurate, well-sourced answers based on search results."},
                    {"role": "user", "content": prompt}
                ],
                stream=True,
                temperature=0.1,
                max_tokens=1000
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            print(f"LLM generation error: {e}")
            yield f"Sorry, I encountered an error while generating the response: {str(e)}"

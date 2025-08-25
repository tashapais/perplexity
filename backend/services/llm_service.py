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
        context = "Based on the following search results, provide a comprehensive answer to the user's question:\n\n"
        
        for i, result in enumerate(search_results[:5], 1):
            context += f"Source {i}: {result.title}\nURL: {result.url}\nContent: {result.content}\n\n"
        
        context += f"User Question: {query}\n\n"
        context += """Please provide a detailed, accurate answer based on the search results above. 
        Include relevant citations using [1], [2], etc. format referencing the source numbers.
        If the search results don't contain enough information to answer the question, 
        say so and provide what information is available."""
        
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

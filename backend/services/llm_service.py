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
        # Separate Notion content from web results
        notion_results = []
        web_results = []
        
        for result in search_results:
            if result.source == "notion":
                notion_results.append(result)
            else:
                web_results.append(result)
        
        context = "You are a personalized research assistant with access to the user's personal knowledge base.\n\n"
        
        # Create detailed source mapping for hyperlinks
        source_mapping = {}
        source_counter = 1
        
        # Add user's personal context first
        if notion_results:
            context += "🧠 PERSONAL NOTION PAGES:\n"
            for result in notion_results:
                source_mapping[source_counter] = {
                    "url": result.url,
                    "title": result.title,
                    "type": "notion",
                    "image_url": result.image_url
                }
                context += f"[{source_counter}] {result.title}\n{result.content or result.snippet}\nURL: {result.url}\n"
                if result.image_url:
                    context += f"Image: {result.image_url}\n"
                context += "\n"
                source_counter += 1
        
        # Add web results with context
        if web_results:
            context += "🌐 WEB SEARCH RESULTS:\n"
            for result in web_results:
                source_mapping[source_counter] = {
                    "url": result.url,
                    "title": result.title,
                    "type": "web",
                    "image_url": result.image_url,
                    "favicon_url": result.favicon_url
                }
                context += f"[{source_counter}] {result.title}\n{result.content or result.snippet}\nURL: {result.url}\n"
                if result.image_url:
                    context += f"Image: {result.image_url}\n"
                context += "\n"
                source_counter += 1
        
        context += f"💭 USER'S QUESTION: {query}\n\n"
        
        if notion_results:
            # Extract user's main interests for personalized opening
            user_topics = []
            for result in notion_results:
                topic = result.title.replace('📄 ', '').strip()
                user_topics.append(topic)
            
            context += f"""📝 PERSONALIZED RESPONSE INSTRUCTIONS:
**MANDATORY OPENING**: Start your response with this exact format:
"Based on your Notion page about {', '.join(user_topics)}, I searched specifically for [relevant keywords/areas] and [related terms]. Here are the latest developments in your area of interest..."

**FORMATTING REQUIREMENTS**:
1. **Hyperlinked Citations**: Use this format: [[1]](URL) where URL is the actual source URL
2. **Inline Images**: When relevant, include images using: ![alt text](image_url)
3. **Section Organization**: Organize content clearly with headers

**CONTENT REQUIREMENTS**:
1. **Connect search results** to their personal knowledge and interests
2. **Reference their Notion content** when making connections  
3. **Provide personalized insights** based on their documented interests
4. **Include relevant images** inline when they enhance understanding
5. **Make all citations clickable links** to source URLs

**EXAMPLE CITATION**: Instead of [1], use [[1]](https://example.com) 
**EXAMPLE IMAGE**: ![Research findings](https://example.com/image.jpg)
"""
        else:
            context += """📝 RESPONSE INSTRUCTIONS:
Provide a comprehensive answer based on the search results above. Use citations [1], [2], etc."""
        
        return context, source_mapping
    
    async def generate_response(self, query: str, search_results: List[SearchResult]) -> AsyncGenerator[str, None]:
        """Generate streaming response using OpenAI GPT"""
        try:
            prompt, source_mapping = self.create_context_prompt(query, search_results)
            
            stream = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a personalized AI research assistant. You have access to the user's personal knowledge base (Notion pages) and can provide contextual, personalized responses that connect their interests with current information. Always acknowledge their existing knowledge and interests when relevant."},
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

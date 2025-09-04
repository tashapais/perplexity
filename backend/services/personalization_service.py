import openai
import os
from typing import List, Dict, Any
from models.schemas import SearchResult

class PersonalizationService:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.client = openai.AsyncOpenAI(api_key=self.openai_api_key)
    
    async def analyze_personal_knowledge(self, notion_pages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze user's Notion content to extract interests, expertise, and focus areas"""
        if not notion_pages:
            return {"interests": [], "expertise_areas": [], "research_focus": []}
        
        # Combine all Notion content for analysis
        combined_content = ""
        for page in notion_pages:
            title = page.get("title", "")
            content = page.get("content", "")
            combined_content += f"Page: {title}\nContent: {content}\n\n"
        
        analysis_prompt = f"""
        Analyze the following personal knowledge base content and extract key information:

        PERSONAL CONTENT:
        {combined_content}

        Please provide a JSON response with:
        1. "interests": List of main topics/subjects the user is interested in
        2. "expertise_areas": Specific domains where they have knowledge/experience
        3. "research_focus": Current research interests or learning goals
        4. "keywords": Important technical terms and concepts they use
        5. "context_summary": Brief summary of their knowledge focus

        Format as valid JSON only, no other text.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert at analyzing personal knowledge bases and extracting user interests. Return only valid JSON."},
                    {"role": "user", "content": analysis_prompt}
                ],
                temperature=0.1,
                max_tokens=800
            )
            
            import json
            analysis = json.loads(response.choices[0].message.content)
            return analysis
            
        except Exception as e:
            print(f"Error analyzing personal knowledge: {e}")
            return {"interests": [], "expertise_areas": [], "research_focus": [], "keywords": [], "context_summary": ""}
    
    async def generate_personalized_search_queries(self, user_query: str, personal_analysis: Dict[str, Any]) -> List[str]:
        """Generate multiple targeted search queries based on user's interests and the original query"""
        
        if not personal_analysis.get("interests"):
            return [user_query]  # Fallback to original query
        
        query_generation_prompt = f"""
        USER'S PERSONAL KNOWLEDGE PROFILE:
        - Interests: {personal_analysis.get('interests', [])}
        - Expertise Areas: {personal_analysis.get('expertise_areas', [])}
        - Research Focus: {personal_analysis.get('research_focus', [])}
        - Key Terms: {personal_analysis.get('keywords', [])}
        - Context: {personal_analysis.get('context_summary', '')}

        ORIGINAL QUERY: "{user_query}"

        Generate 3-4 personalized search queries that:
        1. Connect the original query to their specific interests
        2. Use their technical terminology and focus areas
        3. Target their expertise level and research domains
        4. Provide more relevant, personalized results

        Example: If they're interested in "multi-agent reinforcement learning" and ask about "AI updates", 
        generate queries like "multi-agent reinforcement learning recent advances 2025", "MARL algorithm breakthroughs", etc.

        Return as a JSON list of strings: ["query1", "query2", "query3"]
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert at generating personalized search queries. Return only valid JSON."},
                    {"role": "user", "content": query_generation_prompt}
                ],
                temperature=0.2,
                max_tokens=400
            )
            
            import json
            queries = json.loads(response.choices[0].message.content)
            return queries if isinstance(queries, list) else [user_query]
            
        except Exception as e:
            print(f"Error generating personalized queries: {e}")
            return [user_query]
    
    async def create_personalized_search_strategy(self, user_query: str, notion_results: List[SearchResult]) -> Dict[str, Any]:
        """Create a complete personalized search strategy"""
        
        # Convert SearchResult objects to dict format for analysis
        notion_pages = []
        for result in notion_results:
            notion_pages.append({
                "title": result.title,
                "content": result.content,
                "snippet": result.snippet
            })
        
        # Step 1: Analyze personal knowledge
        personal_analysis = await self.analyze_personal_knowledge(notion_pages)
        print(f"DEBUG: Personal analysis: {personal_analysis}")
        
        # Step 2: Generate personalized search queries
        personalized_queries = await self.generate_personalized_search_queries(user_query, personal_analysis)
        print(f"DEBUG: Generated personalized queries: {personalized_queries}")
        
        return {
            "original_query": user_query,
            "personal_analysis": personal_analysis,
            "personalized_queries": personalized_queries,
            "search_strategy": "personalized"
        }

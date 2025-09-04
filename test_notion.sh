#!/bin/bash
echo "Testing Notion integration..."
echo "1. Checking connection status:"
curl -s "http://localhost:8000/notion/status" | jq .

echo -e "\n2. Testing search for 'project':"
curl -s "http://localhost:8000/notion/search?query=project&limit=3" | jq .

echo -e "\n3. Testing integrated search (should include both Notion + web):"
curl -s -X POST "http://localhost:8000/search" -H "Content-Type: application/json" -d '{"query": "project ideas"}' | jq '{notion_results_count, web_results_count, sources: [.sources[] | {title, source}]}'

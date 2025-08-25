#!/bin/bash

echo "🌲 Forest Search - System Status Check"
echo "=================================="

# Check Redis
echo "🔴 Redis Status:"
if redis-cli ping &>/dev/null; then
    echo "   ✅ Redis is running"
else
    echo "   ❌ Redis is not running. Start with: brew services start redis"
fi

# Check if API keys are configured
echo ""
echo "🔑 API Configuration:"
if [ -f "backend/.env" ]; then
    echo "   ✅ Environment file exists"
    
    if grep -q "BRAVE_API_KEY=your_brave_api_key_here" backend/.env; then
        echo "   ⚠️  Brave API key not configured (demo mode)"
    else
        echo "   ✅ Brave API key configured"
    fi
    
    if grep -q "EXA_API_KEY=your_exa_api_key_here" backend/.env; then
        echo "   ⚠️  Exa API key not configured (demo mode)"
    else
        echo "   ✅ Exa API key configured"
    fi
    
    if grep -q "OPENAI_API_KEY=your_openai_api_key_here" backend/.env; then
        echo "   ⚠️  OpenAI API key not configured (demo mode)"
    else
        echo "   ✅ OpenAI API key configured"
    fi
else
    echo "   ❌ Environment file missing"
fi

# Check if dependencies are installed
echo ""
echo "📦 Dependencies:"
if [ -d "node_modules" ]; then
    echo "   ✅ Frontend dependencies installed"
else
    echo "   ❌ Frontend dependencies missing. Run: npm install"
fi

if [ -d "backend/venv" ]; then
    echo "   ✅ Backend virtual environment exists"
else
    echo "   ❌ Backend virtual environment missing. Run: ./setup.sh"
fi

# Check running processes
echo ""
echo "🚀 Running Services:"
if pgrep -f "python main.py" &>/dev/null; then
    echo "   ✅ Backend server is running"
else
    echo "   ❌ Backend server not running"
fi

if pgrep -f "next dev" &>/dev/null; then
    echo "   ✅ Frontend server is running"
else
    echo "   ❌ Frontend server not running"
fi

echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"

echo ""
if redis-cli ping &>/dev/null && [ -f "backend/.env" ] && [ -d "node_modules" ] && [ -d "backend/venv" ]; then
    echo "✅ System ready! Run './dev.sh' to start all services"
else
    echo "⚠️  Some components need configuration. Run './setup.sh' first"
fi

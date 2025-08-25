#!/bin/bash

echo "🌲 Starting Forest Search Development Environment"
echo "==============================================="

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 &>/dev/null
}

# Kill existing processes on the ports we'll use
if check_port 3000; then
    echo "🔄 Stopping existing frontend process on port 3000..."
    kill -9 $(lsof -ti:3000) 2>/dev/null || true
fi

if check_port 8000; then
    echo "🔄 Stopping existing backend process on port 8000..."
    kill -9 $(lsof -ti:8000) 2>/dev/null || true
fi

# Start Redis if not running
if ! pgrep redis-server > /dev/null; then
    echo "🔴 Starting Redis server..."
    redis-server --daemonize yes --port 6379
    sleep 2
else
    echo "✅ Redis is already running"
fi

echo "🚀 Starting backend server..."
cd backend
source venv/bin/activate 2>/dev/null || echo "⚠️  Virtual environment not found. Run ./setup.sh first."
python main.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

echo "🚀 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started!"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - Backend Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup when script is terminated
cleanup() {
    echo ""
    echo "🛑 Stopping development servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ Development servers stopped"
    exit 0
}

# Set trap to cleanup on script termination
trap cleanup SIGINT SIGTERM

# Wait for processes
wait

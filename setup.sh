#!/bin/bash

echo "🌲 Setting up Forest Search - AI-Powered Research Assistant"
echo "============================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Redis is available
if ! command -v redis-server &> /dev/null; then
    echo "⚠️  Redis is not installed. Please install Redis for conversation storage."
    echo "   On macOS: brew install redis"
    echo "   On Ubuntu: sudo apt-get install redis-server"
    echo "   Or use a cloud Redis service and update the REDIS_URL in .env"
fi

echo "📦 Installing frontend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo "📦 Installing backend dependencies..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "🔧 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

cd ..

# Copy environment files
if [ ! -f ".env" ]; then
    echo "📝 Creating frontend environment file..."
    cp env.example .env
fi

if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend environment file..."
    cp backend/env.example backend/.env
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the application:"
echo "   1. Start Redis: redis-server"
echo "   2. Start backend: cd backend && source venv/bin/activate && python main.py"
echo "   3. Start frontend: npm run dev"
echo "   4. Open http://localhost:3000"
echo ""
echo "🔑 Don't forget to add your API keys to backend/.env:"
echo "   - BRAVE_API_KEY or EXA_API_KEY for search"
echo "   - OPENAI_API_KEY for AI responses"
echo ""
echo "🌲 Happy researching with Forest Search!"

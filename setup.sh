#!/bin/bash

# ResearchHub Setup Script
echo "🧠 Setting up ResearchHub..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.9+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Set up backend
echo "🐍 Setting up Python backend..."
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cat > .env << EOL
# Database
DATABASE_URL=sqlite:///./researchhub.db
REDIS_URL=redis://localhost:6379

# API Keys (Add your keys here)
OPENAI_API_KEY=your_openai_api_key_here
BRAVE_API_KEY=your_brave_search_api_key_here
EXA_API_KEY=your_exa_api_key_here

# JWT
JWT_SECRET_KEY=your_jwt_secret_key_here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# App Settings
DEBUG=True
LOG_LEVEL=INFO
MAX_SEARCH_RESULTS=10
MAX_TOKENS_PER_REQUEST=4000
EOL
fi

cd ..

echo "✅ Setup completed successfully!"
echo ""
echo "🚀 To start the application:"
echo "   Frontend: npm run dev"
echo "   Backend:  cd backend && source venv/bin/activate && python main.py"
echo ""
echo "📝 Don't forget to:"
echo "   1. Add your API keys to backend/.env"
echo "   2. Set up PostgreSQL and Redis if needed"
echo "   3. Visit http://localhost:3000 to use ResearchHub"
echo ""
echo "📚 For more information, see README.md"

#!/bin/bash

# Deployment preparation script for Perplexity Clone
# This script helps prepare your application for deployment

set -e

echo "🚀 Preparing Perplexity Clone for deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Project structure validated"

# Check if git is initialized and clean
if ! git status &>/dev/null; then
    print_warning "Git repository not found. Initializing..."
    git init
    git add .
    git commit -m "Initial commit for deployment"
fi

# Check for uncommitted changes
if ! git diff --quiet; then
    print_warning "You have uncommitted changes. Commit them before deploying:"
    git status --short
    echo ""
    read -p "Do you want to commit all changes now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Prepare for deployment"
        print_status "Changes committed"
    else
        print_warning "Please commit your changes manually before deploying"
    fi
fi

# Check environment variables
print_info "Checking environment configuration..."

if [ ! -f "backend/.env" ]; then
    print_warning "Backend .env file not found"
    if [ -f "backend/env.production.example" ]; then
        print_info "Copy backend/env.production.example to backend/.env and fill in your values"
    fi
fi

if [ ! -f ".env.local" ]; then
    print_warning "Frontend .env.local file not found"
    if [ -f "env.production.example" ]; then
        print_info "Copy env.production.example to .env.local and fill in your values"
    fi
fi

# Validate backend dependencies
print_info "Validating backend dependencies..."
cd backend
if python -c "import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)" 2>/dev/null; then
    print_status "Python version OK"
else
    print_error "Python 3.8+ required for backend"
    exit 1
fi

if [ -f "requirements.txt" ]; then
    print_status "Backend requirements.txt found"
else
    print_error "Backend requirements.txt missing"
    exit 1
fi
cd ..

# Validate frontend dependencies
print_info "Validating frontend dependencies..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js version: $NODE_VERSION"
else
    print_error "Node.js not found"
    exit 1
fi

if [ -f "package.json" ]; then
    print_status "Frontend package.json found"
else
    print_error "Frontend package.json missing"
    exit 1
fi

# Test frontend build
print_info "Testing frontend build..."
if npm run build > /dev/null 2>&1; then
    print_status "Frontend builds successfully"
    rm -rf .next  # Clean up
else
    print_error "Frontend build failed. Please fix build errors before deploying"
    exit 1
fi

# Check deployment configurations
print_info "Checking deployment configurations..."

deployment_files=(
    "backend/Dockerfile"
    "backend/railway.toml"
    "render.yaml"
    "vercel.json"
)

for file in "${deployment_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "$file found"
    else
        print_warning "$file not found"
    fi
done

# Display deployment options
echo ""
print_info "🎯 Deployment Options:"
echo ""
echo "1. 🚂 Railway + Vercel (Recommended)"
echo "   - Backend: https://railway.app"
echo "   - Frontend: https://vercel.com"
echo ""
echo "2. 🎨 Render (All-in-one)"
echo "   - Both services: https://render.com"
echo ""
echo "3. 🔧 Manual/VPS"
echo "   - Use Docker or direct deployment"
echo ""

print_info "📖 Next Steps:"
echo "1. Choose a deployment platform above"
echo "2. Follow the detailed guide in DEPLOYMENT.md"
echo "3. Set up your environment variables"
echo "4. Deploy and test your application"
echo ""

print_info "📋 Required Environment Variables:"
echo ""
echo "Backend (.env):"
echo "  OPENAI_API_KEY=your_key"
echo "  BRAVE_API_KEY=your_key"
echo "  EXA_API_KEY=your_key"
echo "  FRONTEND_URL=https://your-frontend-url"
echo ""
echo "Frontend (.env.local):"
echo "  NEXT_PUBLIC_API_URL=https://your-backend-url"
echo ""

print_status "Deployment preparation complete!"
print_info "See DEPLOYMENT.md for detailed deployment instructions"

# Forest Search - AI-Powered Research Assistant

A beautiful, modern Perplexity clone built with Next.js 15 and FastAPI, featuring a calming forest green theme.

## ✨ Features

- **AI-Powered Search**: Get comprehensive answers with reliable sources
- **Real-time Streaming**: Watch responses generate in real-time
- **Thread History**: Easily revisit and manage previous conversations
- **Multiple Search APIs**: Integrated with Brave Search and Exa APIs
- **Beautiful UI**: Modern forest green theme with smooth animations
- **Responsive Design**: Works perfectly on desktop and mobile

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Redis (optional, for conversation storage)

### One-Command Setup

```bash
# Clone and setup everything
git clone <repository-url>
cd perplexity-clone
./setup.sh
```

### Manual Installation

1. **Install dependencies:**
```bash
npm install
cd backend && pip install -r requirements.txt && cd ..
```

2. **Install Redis (recommended):**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis
```

3. **Configure API keys** (optional for demo):
```bash
# Edit backend/.env and add your keys:
BRAVE_API_KEY=your_brave_api_key_here        # Get from https://api.search.brave.com/
EXA_API_KEY=your_exa_api_key_here            # Get from https://exa.ai/
OPENAI_API_KEY=your_openai_api_key_here      # Get from https://platform.openai.com/
```

### Start Development

```bash
# Start all services at once
./dev.sh

# Or start manually:
# Terminal 1: redis-server (if not using brew services)
# Terminal 2: cd backend && python main.py  
# Terminal 3: npm run dev
```

**🌐 Open [http://localhost:3000](http://localhost:3000)**

### Demo Mode
Forest Search works without API keys in demo mode! It will show:
- Mock search results with setup instructions
- Fallback responses explaining how to configure real AI
- Full UI functionality for testing

Just run `./dev.sh` and start exploring!

## 🔧 Configuration

### Search APIs

The application supports multiple search providers:

- **Brave Search API**: Primary search provider
- **Exa API**: Fallback search provider with neural search capabilities

Get your API keys from:
- Brave Search: [https://api.search.brave.com/](https://api.search.brave.com/)
- Exa: [https://exa.ai/](https://exa.ai/)

### LLM Provider

Currently configured to use OpenAI's GPT-4 for generating responses. Get your API key from [OpenAI](https://platform.openai.com/).

## 🎨 Unique Differentiating Features

This implementation includes several innovative features that set it apart from other answer engines:

### 🧠 Smart Research Insights
- **Research Quality Assessment**: Automatically evaluates source quality, recency, and consensus
- **Confidence Indicators**: Visual indicators for answer reliability
- **Key Point Extraction**: Automatic summarization of main findings

### 💡 Intelligent Follow-up Questions
- **Context-Aware Suggestions**: Generates relevant follow-up questions based on your query and response
- **Research Templates**: Pre-built query templates for different research types (scientific, market analysis, educational)
- **Trending Topics**: Time and season-aware trending research topics

### 🎨 Thoughtful Design
1. **Forest Theme**: Calming green color palette designed for focused research sessions
2. **Smooth Animations**: Subtle transitions and micro-interactions for delightful UX
3. **Real-time Streaming**: Live response generation with WebSockets
4. **Smart Source Display**: Beautiful source cards with hover effects and quality indicators
5. **Conversation Management**: Easy thread creation, deletion, and navigation
6. **Responsive Layout**: Collapsible sidebar and mobile-friendly design

### 🔍 Enhanced Search Experience
- **Multi-Provider Search**: Integrated with both Brave Search and Exa APIs for comprehensive results
- **Source Quality Analysis**: Automatic evaluation of source credibility and authority
- **Research Tips**: Daily research tips and interesting facts to inspire curiosity

## 🏗️ Architecture

### Frontend (Next.js 15 + TypeScript)
- **App Router**: Latest Next.js routing system
- **Tailwind CSS**: Utility-first styling with custom forest theme
- **WebSocket Client**: Real-time communication for streaming
- **Component-based**: Modular, reusable React components

### Backend (FastAPI + Python)
- **REST API**: Standard endpoints for search and thread management
- **WebSocket**: Real-time streaming responses
- **Redis Storage**: Fast conversation persistence
- **Multiple Search APIs**: Brave and Exa integration
- **OpenAI Integration**: GPT-4 powered responses

## 📝 API Documentation

The backend provides the following endpoints:

- `POST /search`: Initiate a new search query
- `GET /threads`: Get all conversation threads
- `GET /threads/{id}`: Get a specific thread
- `DELETE /threads/{id}`: Delete a thread
- `WS /ws/stream/{thread_id}/{message_id}`: WebSocket for streaming responses

## 🚀 Deployment

### Backend Deployment
1. Deploy to your preferred platform (Render, Railway, Heroku)
2. Set environment variables
3. Ensure Redis is available

### Frontend Deployment
1. Deploy to Vercel or Netlify
2. Set `NEXT_PUBLIC_API_URL` to your backend URL
3. Build and deploy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🌟 Acknowledgments

- Inspired by Perplexity AI's excellent search interface
- Built with modern web technologies for optimal performance
- Forest theme designed for calm, focused research sessions

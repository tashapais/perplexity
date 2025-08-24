# ResearchHub 🧠

A next-generation collaborative AI research engine that transforms how you discover, analyze, and share knowledge. Built with real-time collaboration, expert-curated sources, and interactive knowledge graphs.

![ResearchHub Demo](https://via.placeholder.com/800x400/f8fafc/64748b?text=ResearchHub+Demo)

## 🚀 Key Differentiators

**ResearchHub** stands out from other Perplexity clones with these unique features:

### 🤝 Real-time Collaborative Research
- Multiple researchers can work together simultaneously
- Live cursor tracking and real-time updates
- Shared research threads with version history
- Team insights and collective knowledge building

### 🎯 Expert Mode with Domain Specialization
- **Finance**: Curated financial news, market data, and economic analysis
- **Technology**: Latest tech trends, research papers, and industry insights
- **Science**: Peer-reviewed sources, academic papers, and expert commentary
- **Health**: Medical research, clinical studies, and health guidelines

### 📊 Interactive Knowledge Graphs
- Visual representation of research connections
- Explore related concepts and source relationships
- Interactive node exploration with detailed insights
- Export and share knowledge maps

### 📋 Research Templates
- Pre-built frameworks for common research patterns
- Market analysis, scientific research, policy analysis templates
- Customizable prompts for different domains
- Expert-designed research methodologies

## 🛠 Technology Stack

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for modern, responsive design
- **Framer Motion** for smooth animations
- **Socket.io** for real-time collaboration
- **D3.js** for knowledge graph visualizations

### Backend
- **FastAPI** (Python) for high-performance API
- **PostgreSQL** for reliable data storage
- **Redis** for real-time features and caching
- **Socket.io** for WebSocket connections
- **OpenAI GPT-4** for AI-powered responses
- **Brave Search API** for web search capabilities

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL
- Redis

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/researchhub.git
cd researchhub
```

2. **Frontend Setup**
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

3. **Backend Setup**
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and database URLs

# Start the server
uvicorn main:app --reload
```

4. **Database Setup**
```bash
# Create PostgreSQL database
createdb researchhub

# Run migrations (when implemented)
alembic upgrade head
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/researchhub
REDIS_URL=redis://localhost:6379

# API Keys
OPENAI_API_KEY=your_openai_api_key_here
BRAVE_API_KEY=your_brave_search_api_key_here

# JWT
JWT_SECRET_KEY=your_jwt_secret_key_here

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

## 📖 API Documentation

Once the backend is running, visit:
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

- `POST /search` - Perform research search
- `POST /search/stream` - Streaming search with real-time results
- `GET /threads` - Get user's research threads
- `GET /trending` - Get trending research topics
- `GET /experts` - Get featured domain experts

## 🎨 Design Philosophy

ResearchHub embraces a **fresh, white design** with:

- Clean, minimalist interface focusing on content
- Subtle shadows and gentle gradients
- Consistent spacing and typography
- Responsive design for all devices
- Accessible color contrast and navigation

## 🔮 Unique Features

### 1. Collaborative Research Rooms
Join live research sessions with other users:
```typescript
// Real-time collaboration
const room = await joinResearchRoom('quantum-computing-discussion')
room.on('new_insight', (insight) => {
  updateKnowledgeGraph(insight)
})
```

### 2. Expert Mode Integration
Access curated sources by domain:
```typescript
const searchConfig = {
  query: "latest AI developments",
  expertMode: "technology",
  sources: "curated" // academic, news, expert-blogs
}
```

### 3. Knowledge Graph Visualization
Interactive exploration of research connections:
```typescript
const knowledgeGraph = new KnowledgeGraph({
  nodes: research.concepts,
  links: research.relationships,
  interactive: true
})
```

## 🔄 Development Workflow

### Frontend Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Backend Development
```bash
uvicorn main:app --reload    # Start with auto-reload
pytest                       # Run tests
black .                      # Format code
isort .                      # Sort imports
```

## 🧪 Testing

### Frontend Tests
```bash
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run Playwright E2E tests
```

### Backend Tests
```bash
pytest                    # Run all tests
pytest -v tests/test_api  # Verbose API tests
pytest --cov=src         # Coverage report
```

## 📊 Performance Features

- **Streaming Responses**: Real-time answer generation
- **Efficient Caching**: Redis for frequently accessed data
- **Optimized Queries**: PostgreSQL query optimization
- **CDN Integration**: Fast static asset delivery
- **Progressive Loading**: Incremental content loading

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Guidelines
1. Follow TypeScript/Python best practices
2. Write comprehensive tests
3. Update documentation
4. Follow conventional commit messages
5. Ensure accessibility compliance

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- **Perplexity** for inspiration
- **Brave Search** for web search capabilities
- **OpenAI** for AI-powered insights
- **Vercel** for deployment platform

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Documentation**: [API Docs](http://localhost:8000/docs)
- **Issues**: [GitHub Issues](https://github.com/yourusername/researchhub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/researchhub/discussions)

---

Built with ❤️ by the ResearchHub team

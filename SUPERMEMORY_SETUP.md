# Supermemory Integration Setup

ResearchHub now includes supermemory connectors to sync documents from Google Drive, Notion, and OneDrive!

## 🚀 Quick Start (Demo Mode)

The integration works out of the box in demo mode:

1. **Visit Connectors Page**: http://localhost:3000/connectors
2. **Click "Connect"** on any provider (Google Drive, Notion, OneDrive)
3. **See Demo Connection** - A mock connection will be created
4. **Test Sync Features** - All functionality works with simulated data

## 🔑 Enable Real Connections

To connect to actual Google Drive, Notion, and OneDrive accounts:

### 1. Get Supermemory API Key

- Visit [supermemory.ai](https://supermemory.ai)
- Sign up for an account
- Get your API key from the dashboard

### 2. Configure Environment

Edit `backend/.env`:

```env
# Add your actual supermemory API key
SUPERMEMORY_API_KEY=your_actual_supermemory_api_key_here
```

### 3. Restart Backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

## 📋 Features Available

### ✅ **OAuth Integration**
- Secure authentication with Google, Notion, Microsoft
- Popup-based auth flow
- Automatic callback handling

### ✅ **Real-time Sync**
- Automatic sync every 4 hours via webhooks
- Manual sync on demand
- Live status updates in UI

### ✅ **Document Management**
- View synced document counts
- Track last sync times  
- Monitor connection status

### ✅ **Connection Management**
- Add/remove connections easily
- Multiple accounts per provider
- Bulk operations support

## 🔧 API Endpoints

The integration adds these endpoints to your FastAPI backend:

- `POST /connectors/create` - Create new connection
- `GET /connectors/{user_id}` - List user connections
- `DELETE /connectors/{connection_id}` - Remove connection
- `POST /connectors/{provider}/sync` - Manual sync
- `GET /connectors/{user_id}/documents` - Get synced documents

## 🎯 Usage in ResearchHub

Once connected, your documents will be:

1. **Automatically Indexed** - All documents become searchable
2. **Available in Search** - Shows up in research results
3. **Cited in Answers** - AI can reference your documents
4. **Organized by Source** - Filter by provider (Google Drive, Notion, etc.)

## 🔄 Sync Process

Based on [supermemory documentation](https://supermemory.ai/docs/memory-api/connectors/overview):

1. **OAuth Connection** - Secure authorization with provider
2. **Initial Sync** - All accessible documents are indexed
3. **Webhook Updates** - Real-time updates when documents change
4. **Scheduled Sync** - Every 4 hours for consistency
5. **Manual Trigger** - On-demand sync via UI

## 🛠 Troubleshooting

### Connection Issues
- Ensure API key is correct in `.env`
- Check network connectivity to supermemory.ai
- Verify OAuth callback URL is correct

### Sync Problems
- Check provider permissions
- Look for rate limiting
- Review backend logs for errors

### Demo Mode
- Yellow banner indicates demo mode
- Mock connections work for testing
- Add real API key to enable production features

## 📊 Architecture

```
ResearchHub Frontend
       ↓
FastAPI Backend
       ↓  
Supermemory API
       ↓
Provider APIs (Google/Notion/Microsoft)
```

The integration follows the official supermemory connector flow and provides a seamless experience for users to enhance their research with their existing knowledge base.

## 🎉 Next Steps

With supermemory connectors working, you can:

1. **Enhance Search** - Include personal documents in research
2. **Build Knowledge Graphs** - Connect concepts across sources  
3. **Team Collaboration** - Share organization knowledge
4. **Advanced Analytics** - Track research patterns and insights

Your ResearchHub now has persistent memory and can grow smarter with every document you add! 🧠✨

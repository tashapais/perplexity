# Deployment Guide

This guide will help you deploy your Perplexity clone to production environments, moving away from localhost.

## Overview

The application consists of two parts:
- **Frontend**: Next.js app (recommended: Vercel)
- **Backend**: FastAPI app (recommended: Railway or Render)

## Prerequisites

1. GitHub repository with your code
2. API keys for OpenAI, Brave Search, and Exa (optional)
3. Accounts on deployment platforms

## Option 1: Railway + Vercel (Recommended)

### Step 1: Deploy Backend to Railway

1. **Sign up for Railway**: Visit [railway.app](https://railway.app) and sign up
2. **Create new project**: Click "New Project" → "Deploy from GitHub repo"
3. **Select your repository** and choose the backend folder
4. **Set environment variables** in Railway dashboard:
   ```
   OPENAI_API_KEY=your_openai_key
   BRAVE_API_KEY=your_brave_key  
   EXA_API_KEY=your_exa_key
   FRONTEND_URL=https://your-app.vercel.app
   PYTHONUNBUFFERED=1
   ```
5. **Add Redis**: In your Railway project, click "New" → "Database" → "Redis"
6. **Deploy**: Railway will automatically deploy using the `railway.toml` configuration

### Step 2: Deploy Frontend to Vercel

1. **Sign up for Vercel**: Visit [vercel.com](https://vercel.com) and sign up
2. **Import project**: Click "New Project" → Import from GitHub
3. **Select your repository**: Choose the root directory (not a subfolder)
4. **Set environment variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```
5. **Deploy**: Click "Deploy"

### Step 3: Update CORS Configuration

1. **Get your Vercel URL**: After deployment, note your Vercel app URL
2. **Update Railway environment**: Set `FRONTEND_URL` to your Vercel URL
3. **Redeploy backend**: Railway will automatically redeploy

## Option 2: Render (Alternative)

### Deploy Both Services to Render

1. **Sign up for Render**: Visit [render.com](https://render.com)
2. **Create from repository**: Click "New" → "Blueprint"
3. **Connect GitHub**: Select your repository
4. **Configure services**: Render will use the `render.yaml` configuration
5. **Set environment variables** in Render dashboard (same as Railway)

## Option 3: Manual Deployment

### Backend Deployment (Any VPS/Cloud)

1. **Clone repository** on your server:
   ```bash
   git clone your-repo-url
   cd perplexity/backend
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables**:
   ```bash
   export OPENAI_API_KEY="your_key"
   export BRAVE_API_KEY="your_key" 
   export EXA_API_KEY="your_key"
   export FRONTEND_URL="https://your-frontend-domain.com"
   export PORT=8000
   ```

4. **Run with Gunicorn**:
   ```bash
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

### Frontend Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set environment variable**:
   ```bash
   export NEXT_PUBLIC_API_URL="https://your-backend-domain.com"
   ```

3. **Start production server**:
   ```bash
   npm start
   ```

## Environment Variables Reference

### Backend (.env)
```bash
# Required
OPENAI_API_KEY=sk-...
BRAVE_API_KEY=BSA...
EXA_API_KEY=...

# Production URLs
FRONTEND_URL=https://your-frontend.vercel.app

# Optional
REDIS_URL=redis://localhost:6379
PORT=8000
PYTHONUNBUFFERED=1
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

## SSL/HTTPS Configuration

Both Railway and Vercel automatically provide SSL certificates. For manual deployments:

1. **Use a reverse proxy** (Nginx/Apache) with Let's Encrypt
2. **Configure CORS** to use HTTPS URLs only
3. **Update environment variables** to use `https://` URLs

## Redis Configuration

### Railway/Render
- Use the built-in Redis addon/service
- Connection string is automatically provided via environment variables

### Manual Setup
```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Set REDIS_URL if needed
export REDIS_URL=redis://localhost:6379
```

## Domain Configuration

### Custom Domain on Vercel
1. Go to your project dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update `FRONTEND_URL` in backend environment variables

### Custom Domain on Railway
1. Go to your service settings
2. Click "Settings" → "Networking"
3. Add custom domain
4. Update DNS records
5. Update `NEXT_PUBLIC_API_URL` in frontend environment variables

## Monitoring and Logs

### Railway
- View logs in the deployment tab
- Set up monitoring in the metrics section

### Vercel
- View function logs in the project dashboard
- Monitor performance in the analytics section

### Manual Deployment
```bash
# View backend logs
journalctl -u your-app-service -f

# Monitor with PM2 (recommended)
npm install -g pm2
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name perplexity-backend
pm2 logs perplexity-backend
```

## Troubleshooting

### CORS Issues
- Ensure `FRONTEND_URL` is set correctly in backend
- Check that URLs use HTTPS in production
- Verify domain spelling and case sensitivity

### WebSocket Issues
- Ensure your hosting platform supports WebSockets
- Railway and Render support WebSockets by default
- For manual deployment, check nginx/apache configuration

### Environment Variables Not Loading
- Restart your deployment after setting variables
- Check variable names match exactly (case-sensitive)
- Verify .env files are not committed to Git

### Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Cost Optimization

### Free Tier Limits
- **Railway**: $5/month credit (covers small apps)
- **Vercel**: Generous free tier for personal projects
- **Render**: 750 hours/month free

### Resource Optimization
- Use Redis only if needed (for conversation history)
- Implement caching for search results
- Use environment variables to disable features if needed

## Security Checklist

- [ ] API keys are set as environment variables (not in code)
- [ ] CORS is configured for production domains only
- [ ] HTTPS is enabled for all endpoints
- [ ] Redis is password-protected (if using external Redis)
- [ ] Environment files are in .gitignore
- [ ] Rate limiting is implemented (recommended)

## Updating Your Deployment

### Railway/Render
1. Push changes to your GitHub repository
2. Deployments trigger automatically

### Manual Updates
```bash
git pull origin main
# Restart your services
```

## Getting Help

- **Railway**: [Railway Discord](https://discord.gg/railway)
- **Vercel**: [Vercel Community](https://github.com/vercel/vercel/discussions)
- **Render**: [Render Community](https://community.render.com/)

This guide should get your application running in production. Choose the deployment option that best fits your needs and technical comfort level.

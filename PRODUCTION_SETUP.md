# Kurser Production Setup Guide

Complete production setup for deploying frontend separately and backend with workers.

## Architecture

```
Frontend (GitHub Pages/Vercel)
    ↓ API calls
Backend (Azure/Railway) ← Redis Queue → Worker(s)
    ↓
MongoDB Atlas (Cloud)
```

## 1. Prerequisites

### Required Services:
- **MongoDB Atlas** (Free tier): https://cloud.mongodb.com
- **GitHub OAuth App**: https://github.com/settings/developers
- **Deployment Platform**: Azure/Railway/Render (for backend)
- **Frontend Hosting**: GitHub Pages/Vercel/Netlify

## 2. MongoDB Atlas Setup

1. Create account at https://cloud.mongodb.com
2. Create a new cluster (Free M0)
3. Setup database access:
   - Create database user with password
   - Note: `username` and `password`
4. Setup network access:
   - Allow access from anywhere: `0.0.0.0/0`
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/kurser?retryWrites=true&w=majority
   ```

## 3. GitHub OAuth App Setup

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill details:
   - **Application name**: Kurser
   - **Homepage URL**: Your frontend URL (e.g., https://yourusername.github.io/kurser-frontend)
   - **Authorization callback URL**: Your backend URL + `/auth/github/callback`
     (e.g., https://your-backend.azurewebsites.net/auth/github/callback)
4. Note down:
   - **Client ID**
   - **Client Secret**

## 4. Backend Setup (Docker Compose)

### Create `.env` file in `main/` directory:

```bash
# Server
PORT=3000
NODE_ENV=production

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=https://your-backend-url.com/auth/github/callback

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kurser?retryWrites=true&w=majority

# Redis (Auto-configured in Docker)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=kurser_redis_pass_2024

# JWT Secret (Generate a strong secret)
JWT_SECRET=your_super_secret_jwt_key_12345

# Frontend URL (Your deployed frontend URL)
FRONTEND_URL=https://yourusername.github.io/kurser-frontend

# Public URL (Your backend URL for webhooks)
PUBLIC_URL=https://your-backend-url.com
```

### Create `.env` file in `worker/` directory:

```bash
# Redis (Auto-configured in Docker)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=kurser_redis_pass_2024

# MongoDB Atlas (Same as main)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kurser?retryWrites=true&w=majority

# Worker Config
WORKER_CONCURRENCY=5
CLONE_DIR=/tmp/kurser-repos

# GitHub Token (Optional - for private repos)
GITHUB_TOKEN=

# Main API
MAIN_API_URL=http://main:3000
LOG_LEVEL=info
```

### Start Backend Services:

```bash
# Build and start all services
docker compose up -d --build

# Check logs
docker compose logs -f

# Check individual service logs
docker compose logs -f main
docker compose logs -f worker
docker compose logs -f redis

# Scale workers (if needed)
docker compose up -d --scale worker=3

# Stop services
docker compose down
```

## 5. Frontend Setup (Separate Deployment)

### Option A: GitHub Pages

1. Update `frontend/.env.production`:
```bash
VITE_API_URL=https://your-backend-url.com
```

2. Build frontend:
```bash
cd frontend
npm install
npm run build
```

3. Deploy to GitHub Pages:
```bash
# Install gh-pages
npm install -D gh-pages

# Add to package.json scripts:
"deploy": "vite build && gh-pages -d dist"

# Deploy
npm run deploy
```

4. Enable GitHub Pages in repo settings → Pages → Source: gh-pages branch

### Option B: Vercel

1. Create `vercel.json` in frontend directory:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://your-backend-url.com"
  }
}
```

2. Deploy:
```bash
npm install -g vercel
cd frontend
vercel --prod
```

### Option C: Netlify

1. Create `netlify.toml` in frontend directory:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  VITE_API_URL = "https://your-backend-url.com"
```

2. Deploy via Netlify CLI or connect GitHub repo

## 6. Testing the Setup

### 1. Check Backend Health:
```bash
curl https://your-backend-url.com/health
```

### 2. Check Redis Connection:
```bash
docker compose exec redis redis-cli -a kurser_redis_pass_2024 ping
```

### 3. Check Worker Logs:
```bash
docker compose logs -f worker
```

### 4. Test GitHub Login:
- Open frontend URL
- Click "Login with GitHub"
- Should redirect to GitHub OAuth
- After authorization, should redirect back with user data

### 5. Test Repository Setup:
- Login to frontend
- Add a repository
- Check worker logs for clone job
- Check MongoDB for repository data

## 7. Webhook Setup (After Deployment)

1. Make sure `PUBLIC_URL` is set in backend `.env`
2. Add repository via frontend
3. System will automatically create webhook
4. Test webhook:
   - Make a commit to the repo
   - Check worker logs for processing
   - Check MongoDB for webhook events

## 8. Monitoring & Logs

### Live Logs:
```bash
# All services
docker compose logs -f

# Main backend only
docker compose logs -f main

# Worker only
docker compose logs -f worker

# Last 100 lines
docker compose logs --tail=100
```

### Queue Monitoring:
```bash
# Check queue stats
docker compose exec redis redis-cli -a kurser_redis_pass_2024
> KEYS *
> LLEN bull:webhook-events:*
```

## 9. Scaling Workers

```bash
# Scale to 3 workers
docker compose up -d --scale worker=3

# Check running workers
docker compose ps

# Each worker will process jobs independently
```

## 10. Azure Deployment (Backend)

### Using Azure Container Instances:

```bash
# Login to Azure
az login

# Create resource group
az group create --name kurser-rg --location eastus

# Create container group
az container create \
  --resource-group kurser-rg \
  --name kurser-backend \
  --image your-registry/kurser-main:latest \
  --dns-name-label kurser-api \
  --ports 3000

# Get public IP
az container show \
  --resource-group kurser-rg \
  --name kurser-backend \
  --query ipAddress.fqdn
```

### Using Azure App Service:

```bash
# Create App Service plan
az appservice plan create \
  --name kurser-plan \
  --resource-group kurser-rg \
  --is-linux

# Create web app with docker compose
az webapp create \
  --resource-group kurser-rg \
  --plan kurser-plan \
  --name kurser-api \
  --multicontainer-config-type compose \
  --multicontainer-config-file docker compose.yml
```

## 11. Environment Variables Checklist

### Backend (.env in main/):
- [x] `GITHUB_CLIENT_ID`
- [x] `GITHUB_CLIENT_SECRET`
- [x] `GITHUB_CALLBACK_URL`
- [x] `MONGODB_URI`
- [x] `JWT_SECRET`
- [x] `FRONTEND_URL`
- [x] `PUBLIC_URL`

### Worker (.env in worker/):
- [x] `MONGODB_URI`
- [x] `REDIS_PASSWORD`

### Frontend (.env.production):
- [x] `VITE_API_URL`

## 12. Troubleshooting

### Backend not starting:
```bash
docker compose logs main
# Check MongoDB connection
# Check Redis connection
```

### Worker not processing jobs:
```bash
docker compose logs worker
# Check Redis password
# Check queue connection
```

### Frontend can't connect:
- Check CORS settings in backend
- Verify `FRONTEND_URL` in backend .env
- Check `VITE_API_URL` in frontend

### Webhooks not working:
- Verify `PUBLIC_URL` is set and accessible
- Check GitHub webhook delivery page
- Check backend webhook endpoint logs

## 13. Production Tips

1. **Use strong passwords** for Redis and MongoDB
2. **Enable SSL/TLS** for production domains
3. **Set up monitoring** (Azure Monitor, Datadog, etc.)
4. **Configure log aggregation**
5. **Set up backup** for MongoDB data
6. **Use environment secrets** (Azure Key Vault, etc.)
7. **Enable rate limiting** on API endpoints
8. **Set up CI/CD** for automated deployments

## 14. Quick Commands

```bash
# Start everything
docker compose up -d --build

# Stop everything
docker compose down

# Restart a service
docker compose restart main

# View logs
docker compose logs -f

# Scale workers
docker compose up -d --scale worker=5

# Clean up everything
docker compose down -v
```

## Success Checklist

- [ ] MongoDB Atlas cluster created and accessible
- [ ] GitHub OAuth app created
- [ ] Backend .env configured
- [ ] Worker .env configured
- [ ] Docker compose running (redis + main + worker)
- [ ] Frontend built and deployed
- [ ] GitHub login working
- [ ] Repository can be added
- [ ] Worker clones repository
- [ ] Webhooks created successfully
- [ ] Commits trigger worker jobs
- [ ] Logs visible and clean

---

**Ready to deploy!** 🚀

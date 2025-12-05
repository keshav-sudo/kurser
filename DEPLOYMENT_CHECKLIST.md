# ✅ Kurser Deployment Checklist

## Pre-Deployment Setup

### 1. MongoDB Atlas
- [ ] Account created at https://cloud.mongodb.com
- [ ] Free cluster created (M0)
- [ ] Database user created with password
- [ ] Network access: `0.0.0.0/0` allowed
- [ ] Connection string copied: `mongodb+srv://user:pass@cluster.mongodb.net/kurser`

### 2. GitHub OAuth App
- [ ] Created at https://github.com/settings/developers
- [ ] Application name: Kurser
- [ ] Homepage URL set (your frontend URL)
- [ ] Callback URL set: `https://your-backend.com/auth/github/callback`
- [ ] Client ID copied
- [ ] Client Secret copied

### 3. Environment Configuration

#### main/.env
- [ ] `GITHUB_CLIENT_ID` set
- [ ] `GITHUB_CLIENT_SECRET` set
- [ ] `GITHUB_CALLBACK_URL` set (backend URL + /auth/github/callback)
- [ ] `MONGODB_URI` set (from MongoDB Atlas)
- [ ] `JWT_SECRET` generated (use: `openssl rand -hex 32`)
- [ ] `FRONTEND_URL` set (your deployed frontend URL or `*` for any)
- [ ] `PUBLIC_URL` set (your deployed backend URL for webhooks)

#### worker/.env
- [ ] `MONGODB_URI` set (same as main/.env)

#### frontend/.env (development)
- [ ] `VITE_API_URL=http://localhost:3000`

#### frontend/.env.production
- [ ] `VITE_API_URL` set to deployed backend URL

## Docker Compose Configuration

- [x] Redis with password configured
- [x] Main API service configured
- [x] Worker service configured
- [x] MongoDB removed (using Atlas)
- [x] Health checks enabled
- [x] Networks configured
- [x] Volumes configured

## Testing Locally

### Backend Test
```bash
# Start services
docker compose up -d --build

# Check all services running
docker compose ps

# Should see:
# - kurser-redis (healthy)
# - kurser-main (running)
# - kurser-worker-* (running)

# Check logs
docker compose logs -f

# Test health endpoint
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}

# Test Redis
docker compose exec redis redis-cli -a kurser_redis_pass_2024 ping
# Should return: PONG
```

### Frontend Test
```bash
# Install and run
cd frontend
npm install
npm run dev

# Visit http://localhost:5173
# Should see: "🚀 Kurser - GitHub Repository Manager"
# Click "Check API Health" - should show "API Status: ok ✅"
```

### Full Integration Test
1. [ ] Login with GitHub works
2. [ ] Can load repositories list
3. [ ] Can setup webhook on a repo
4. [ ] Worker logs show clone job processing
5. [ ] Repository appears in tracked list
6. [ ] Can view webhook events
7. [ ] Can remove webhook

## Backend Deployment

### Option 1: Azure (Recommended for production)
```bash
# Login
az login

# Create resource group
az group create --name kurser-rg --location eastus

# Deploy using App Service with Docker Compose
az webapp create \
  --resource-group kurser-rg \
  --plan kurser-plan \
  --name kurser-api \
  --multicontainer-config-type compose \
  --multicontainer-config-file docker-compose.yml

# Set environment variables
az webapp config appsettings set \
  --resource-group kurser-rg \
  --name kurser-api \
  --settings @env-settings.json
```

### Option 2: Railway.app (Easiest)
- [ ] Sign up at https://railway.app
- [ ] New Project → Deploy from GitHub
- [ ] Connect kurser repository
- [ ] Add environment variables from main/.env
- [ ] Deploy automatically
- [ ] Get deployment URL

### Option 3: DigitalOcean/Linode (VPS)
```bash
# SSH into droplet
ssh root@your-droplet-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone repo
git clone https://github.com/yourusername/kurser.git
cd kurser

# Configure .env files
nano main/.env
nano worker/.env

# Start services
docker compose up -d --build

# Enable firewall
ufw allow 3000/tcp
ufw allow 22/tcp
ufw enable
```

### Post-Backend Deployment
- [ ] Note backend URL (e.g., https://kurser-api.azurewebsites.net)
- [ ] Update GitHub OAuth callback URL
- [ ] Update `GITHUB_CALLBACK_URL` in main/.env
- [ ] Test health: `curl https://your-backend.com/health`

## Frontend Deployment

### Option 1: Vercel (Recommended)
```bash
cd frontend

# Install Vercel CLI
npm install -g vercel

# Set production env
echo "VITE_API_URL=https://your-backend-url.com" > .env.production

# Deploy
vercel --prod

# Note the deployment URL
```

### Option 2: GitHub Pages
```bash
cd frontend

# Update package.json
npm install -D gh-pages

# Add script to package.json:
# "deploy": "vite build && gh-pages -d dist"

# Set production env
echo "VITE_API_URL=https://your-backend-url.com" > .env.production

# Deploy
npm run build
npm run deploy

# Enable Pages in repo settings
# URL: https://yourusername.github.io/kurser-frontend
```

### Option 3: Netlify
```bash
cd frontend

# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod

# Set environment variable in Netlify dashboard:
# VITE_API_URL = https://your-backend-url.com
```

### Post-Frontend Deployment
- [ ] Note frontend URL
- [ ] Update `FRONTEND_URL` in main/.env
- [ ] Update GitHub OAuth homepage URL
- [ ] Redeploy backend if needed

## Final Configuration

### Update OAuth URLs
- [ ] GitHub OAuth App homepage URL = frontend URL
- [ ] GitHub OAuth App callback URL = backend URL + /auth/github/callback
- [ ] `GITHUB_CALLBACK_URL` in main/.env matches callback URL
- [ ] `FRONTEND_URL` in main/.env matches frontend URL

### Update Backend URLs
- [ ] `PUBLIC_URL` in main/.env = backend URL (for webhooks)
- [ ] `VITE_API_URL` in frontend = backend URL

### Restart Services
```bash
# Backend
docker compose down
docker compose up -d --build

# Frontend (redeploy)
cd frontend && npm run build && vercel --prod
```

## Production Testing

### 1. Health Check
```bash
curl https://your-backend.com/health
# Should return: {"status":"ok",...}
```

### 2. GitHub Login Flow
- [ ] Visit frontend URL
- [ ] Click "Login with GitHub"
- [ ] Redirected to GitHub OAuth
- [ ] Authorize application
- [ ] Redirected back to frontend with token
- [ ] Profile loads automatically

### 3. Repository Setup
- [ ] Click "Load Repositories"
- [ ] See list of your repos
- [ ] Select a repository
- [ ] Click "Setup Webhook & Deploy"
- [ ] Success message appears
- [ ] Check worker logs: `docker compose logs worker`
- [ ] Should see clone job processing

### 4. Webhook Test
- [ ] Go to GitHub repo → Settings → Webhooks
- [ ] Should see webhook with your PUBLIC_URL
- [ ] Make a commit to the repo
- [ ] Check worker logs for processing
- [ ] Check frontend "Webhook Events" - should see the event

## Monitoring

### Backend Logs
```bash
# All logs
docker compose logs -f

# Main API
docker compose logs -f main

# Worker
docker compose logs -f worker

# Redis
docker compose exec redis redis-cli -a kurser_redis_pass_2024
> INFO
> KEYS bull:*
```

### Queue Monitoring
```bash
# Check queue lengths
docker compose exec redis redis-cli -a kurser_redis_pass_2024
> LLEN bull:webhook-events:waiting
> LLEN bull:webhook-events:active
> LLEN bull:repo-clone:waiting
```

### Frontend Monitoring
- [ ] Check browser console for errors
- [ ] Check Network tab for API calls
- [ ] Check "Check API Health" button works

## Scaling

### Scale Workers
```bash
# Run 3 workers
docker compose up -d --scale worker=3

# Check
docker compose ps
# Should see: kurser-worker-1, kurser-worker-2, kurser-worker-3
```

### Monitor Performance
```bash
# Container stats
docker stats

# Individual service
docker stats kurser-main
docker stats kurser-worker-1
```

## Troubleshooting

### Backend Issues
```bash
# Check logs
docker compose logs main

# Common fixes:
# - Restart: docker compose restart main
# - Rebuild: docker compose up -d --build main
# - Check env: docker compose exec main env | grep MONGODB
```

### Worker Issues
```bash
# Check logs
docker compose logs worker

# Check Redis connection
docker compose exec worker sh
# Inside container:
env | grep REDIS
```

### Frontend Issues
- Clear browser cache and localStorage
- Check browser console for CORS errors
- Verify API_URL is correct
- Test API directly with curl

### Webhook Issues
- Check PUBLIC_URL is accessible from internet
- Check GitHub webhook deliveries
- Check webhook secret (if set)
- Test with: `docker compose logs -f main | grep webhook`

## Success Criteria

✅ All boxes checked above
✅ Backend health returns OK
✅ Frontend loads without errors
✅ GitHub login works
✅ Can add repository
✅ Worker clones repository
✅ Webhook created on GitHub
✅ Commits trigger processing
✅ Events visible in frontend
✅ Logs are clean and informative

## Quick Commands Reference

```bash
# Backend
docker compose up -d --build    # Start
docker compose down             # Stop
docker compose logs -f          # Logs
docker compose ps               # Status
docker compose restart main     # Restart service
docker compose up -d --scale worker=3  # Scale workers

# Frontend
npm run dev                     # Development
npm run build                   # Build
vercel --prod                   # Deploy (Vercel)
npm run deploy                  # Deploy (GitHub Pages)

# Testing
curl http://localhost:3000/health              # Local health
curl https://your-backend.com/health          # Production health
docker compose exec redis redis-cli -a kurser_redis_pass_2024 ping  # Redis test
```

---

## 🎉 Deployment Complete!

Once all checkboxes are checked, your Kurser application is fully deployed and operational!

**Note**: Keep your `.env` files secure and never commit them to git.

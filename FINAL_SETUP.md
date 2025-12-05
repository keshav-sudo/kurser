# 🚀 Kurser - Complete Production Setup

## ✅ What Has Been Configured

Your Kurser application is now fully configured with:

### Architecture
```
┌─────────────────────────────────────────────────────────┐
│  Frontend (GitHub Pages/Vercel/Netlify)                │
│  - React + Vite                                          │
│  - GitHub OAuth login                                    │
│  - Live logs & webhook events                           │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTPS API calls
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Backend (Docker Compose - Azure/Any VPS)              │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │ Redis Queue │◄─┤ Main API     │  │ Worker(s)     │ │
│  │ (Password)  │  │ - Auth       │◄─┤ - Clone repos │ │
│  │             │─►│ - Webhooks   │  │ - Process jobs│ │
│  └─────────────┘  └──────────────┘  └───────────────┘ │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  MongoDB Atlas (Cloud Database)                         │
│  - Users                                                 │
│  - Repositories                                          │
│  - Webhook Events                                        │
└─────────────────────────────────────────────────────────┘
```

### Key Features Implemented

✅ **Frontend Separate Deployment**
- Ready to deploy on GitHub Pages, Vercel, or Netlify
- Environment-based API URL configuration
- Professional UI with live status indicators

✅ **Backend Services**
- Redis with password (kurser_redis_pass_2024)
- Main API with GitHub OAuth
- Worker service for queue processing
- Scalable architecture (can run multiple workers)

✅ **No Local MongoDB**
- Uses your MongoDB Atlas cluster
- Minimal container footprint
- Easy to scale on any cloud platform

✅ **Queue-Based Processing**
- Repository clone jobs queued automatically
- Webhook events processed by workers
- Retry logic and error handling

✅ **Professional Workflow**
1. User logs in via GitHub
2. User selects repository
3. Webhook created automatically
4. Repository queued for cloning
5. Worker clones and processes
6. Commits trigger automatic processing
7. Live logs visible in frontend

## 📁 File Structure

```
kurser/
├── docker-compose.yml          # Updated: Redis + Main + Worker (no MongoDB)
├── setup.sh                    # Interactive setup script
├── PRODUCTION_SETUP.md         # Complete deployment guide
├── QUICK_START.md              # 5-minute quick start
├── FINAL_SETUP.md              # This file
│
├── main/                       # Backend API
│   ├── .env.example           # Updated template
│   ├── .env                   # Your configuration (git-ignored)
│   ├── src/
│   │   ├── index.ts           # Updated: Removed RabbitMQ
│   │   ├── config/
│   │   │   ├── env.ts         # Updated: Redis config
│   │   │   ├── bullmq.ts      # Queue configuration
│   │   │   └── mongodb.ts     # MongoDB Atlas connection
│   │   ├── controller/
│   │   │   ├── authController.ts
│   │   │   ├── repoController.ts    # Auto-queue clone jobs
│   │   │   └── webhookController.ts # Queue webhook events
│   │   └── routes/
│   └── Dockerfile
│
├── worker/                     # Worker Service
│   ├── .env.example           # Updated template
│   ├── .env                   # Your configuration (git-ignored)
│   ├── src/
│   │   ├── index.ts           # Worker entry point
│   │   ├── workers/
│   │   │   ├── webhookWorker.ts     # Process webhooks
│   │   │   ├── repoCloneWorker.ts   # Clone repositories
│   │   │   └── repoAnalysisWorker.ts
│   │   └── services/
│   │       └── gitService.ts        # Git operations
│   └── Dockerfile
│
└── frontend/                   # React Frontend
    ├── .env.example           # Template
    ├── .env                   # Local development (git-ignored)
    ├── .env.production        # Production config
    ├── vercel.json            # Vercel deployment config
    ├── netlify.toml           # Netlify deployment config
    ├── src/
    │   └── App.jsx            # Updated: Environment-based API URL
    └── package.json
```

## 🔧 Configuration Files Created

### 1. docker-compose.yml
- **Services**: Redis (with password), Main API, Worker
- **Networks**: Internal bridge network
- **Volumes**: Redis data, Worker repos
- **Health checks**: All services monitored
- **Scalable**: Workers can be scaled up

### 2. Environment Files

**main/.env** (You need to configure):
```bash
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_secret_here
GITHUB_CALLBACK_URL=https://your-backend.com/auth/github/callback
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kurser
JWT_SECRET=your_strong_secret_here
FRONTEND_URL=https://your-frontend.com
PUBLIC_URL=https://your-backend.com
```

**worker/.env** (Auto-configured + MongoDB):
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kurser
# Redis password auto-set in docker-compose
```

**frontend/.env** (Development):
```bash
VITE_API_URL=http://localhost:3000
```

**frontend/.env.production** (Production):
```bash
VITE_API_URL=https://your-backend.com
```

## 🎯 Next Steps

### Step 1: Configure Environment Variables

1. **Get MongoDB Atlas URL**:
   - Go to https://cloud.mongodb.com
   - Create cluster (Free M0)
   - Get connection string
   - Update `main/.env` and `worker/.env`

2. **Create GitHub OAuth App**:
   - Go to https://github.com/settings/developers
   - New OAuth App
   - Set callback URL
   - Update `main/.env` with Client ID and Secret

3. **Generate JWT Secret**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   - Update `main/.env`

### Step 2: Test Locally

```bash
# Start backend services
docker compose up -d --build

# Check logs
docker compose logs -f

# In another terminal, start frontend
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173 and test:
- Login with GitHub
- Add a repository
- Check worker logs for clone job
- Make a commit (if PUBLIC_URL set, webhook will work)

### Step 3: Deploy Backend

**Option A: Azure Container Instances**
```bash
az container create \
  --resource-group kurser-rg \
  --name kurser-backend \
  --image your-registry/kurser:latest \
  --dns-name-label kurser-api \
  --ports 3000
```

**Option B: Railway**
- Connect GitHub repo
- Set environment variables
- Deploy with docker-compose

**Option C: DigitalOcean/Linode**
- Create droplet
- Install Docker
- Clone repo
- Run `docker compose up -d`

### Step 4: Deploy Frontend

**Option A: Vercel** (Easiest)
```bash
cd frontend
npm install -g vercel
vercel --prod
```

**Option B: GitHub Pages**
```bash
cd frontend
npm install
npm install -D gh-pages
# Add to package.json:
# "deploy": "vite build && gh-pages -d dist"
npm run deploy
```

**Option C: Netlify**
```bash
cd frontend
npm install -g netlify-cli
netlify deploy --prod
```

### Step 5: Update OAuth Callback

After deployment, update:
1. GitHub OAuth App callback URL
2. `GITHUB_CALLBACK_URL` in `main/.env`
3. `FRONTEND_URL` in `main/.env`
4. Redeploy backend

## 🔄 How to Use

### For Users:

1. **Login**: Click "Login with GitHub"
2. **Add Repository**: Select from your repos → Click "Setup Webhook & Deploy"
3. **Automatic Process**:
   - Webhook created on GitHub
   - Repository queued for cloning
   - Worker clones repository
   - Future commits automatically processed
4. **Monitor**: View webhook events and logs in real-time

### For Developers:

```bash
# View logs
docker compose logs -f

# Scale workers
docker compose up -d --scale worker=3

# Restart a service
docker compose restart main

# Stop all
docker compose down

# Clean everything
docker compose down -v
```

## 📊 Monitoring

### Check Service Health
```bash
# Main API
curl http://localhost:3000/health

# Redis connection
docker compose exec redis redis-cli -a kurser_redis_pass_2024 ping

# Worker logs
docker compose logs -f worker

# All services
docker compose ps
```

### Check Queue Status
```bash
docker compose exec redis redis-cli -a kurser_redis_pass_2024
> KEYS bull:*
> LLEN bull:webhook-events:waiting
> LLEN bull:repo-clone:waiting
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
docker compose logs main

# Common issues:
# - MongoDB URI incorrect
# - GitHub OAuth credentials missing
# - Port 3000 already in use
```

### Worker not processing
```bash
# Check logs
docker compose logs worker

# Common issues:
# - Redis password mismatch
# - MongoDB URI incorrect
# - Main API not reachable
```

### Frontend can't connect
```bash
# Check CORS settings
# - Verify FRONTEND_URL in main/.env
# - Verify VITE_API_URL in frontend/.env

# Test API directly
curl http://localhost:3000/health
```

### Webhooks not working
```bash
# Ensure PUBLIC_URL is set in main/.env
# Check GitHub webhook delivery page
# For local testing, use ngrok:
ngrok http 3000
# Then set PUBLIC_URL=https://your-ngrok-url.ngrok.io
```

## 📈 Scaling

### Scale Workers Horizontally
```bash
# Run 5 workers
docker compose up -d --scale worker=5

# Each worker processes jobs independently
# Automatic load balancing via Redis queue
```

### Vertical Scaling
```yaml
# In docker-compose.yml, adjust resources:
worker:
  deploy:
    resources:
      limits:
        cpus: '4'
        memory: 4G
```

## 🔐 Security Checklist

- [ ] Change Redis password in docker-compose.yml
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS for production
- [ ] Restrict CORS to your frontend domain
- [ ] Use environment secrets (Azure Key Vault, etc.)
- [ ] Rotate GitHub OAuth credentials periodically
- [ ] Enable MongoDB Atlas IP whitelist (if needed)
- [ ] Use private container registry for images

## 🎉 Success Checklist

- [ ] MongoDB Atlas cluster created
- [ ] GitHub OAuth app configured
- [ ] Environment files configured
- [ ] Docker services running
- [ ] Frontend deployed separately
- [ ] Can login with GitHub
- [ ] Can add repository
- [ ] Worker clones repository successfully
- [ ] Webhook created on GitHub
- [ ] Commits trigger worker jobs
- [ ] Logs visible and clean

## 📚 Commands Cheat Sheet

```bash
# Start everything
docker compose up -d --build

# Stop everything
docker compose down

# View logs
docker compose logs -f
docker compose logs -f main
docker compose logs -f worker

# Check status
docker compose ps

# Restart service
docker compose restart main

# Scale workers
docker compose up -d --scale worker=3

# Clean everything
docker compose down -v

# Frontend dev
cd frontend && npm run dev

# Frontend build
cd frontend && npm run build

# Frontend deploy (Vercel)
cd frontend && vercel --prod
```

---

## 🚀 Ready to Deploy!

Everything is configured and ready. Follow the steps above to deploy your Kurser application.

**Need help?** Check logs first: `docker compose logs -f`

**Questions?** Review:
- [QUICK_START.md](./QUICK_START.md) - 5-minute setup
- [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) - Complete guide

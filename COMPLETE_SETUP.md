# Kurser Complete Setup Guide ✅

## Project Overview 🎯

Kurser is a production-ready, scalable GitHub repository management system with:

- ✅ **Main API** - Express.js with GitHub OAuth, MongoDB, BullMQ
- ✅ **Worker Service** - Scalable BullMQ workers for processing jobs
- ✅ **Frontend** - React + TypeScript + Vite  
- ✅ **Queue System** - Redis + BullMQ for reliable job processing
- ✅ **Azure Support** - Optional Azure Storage Queues for enterprise scale
- ✅ **Docker Ready** - Complete Docker Compose configuration
- ✅ **Nixpacks Support** - Deploy to Railway/Render with zero config

## What Was Built 🏗️

### 1. Worker Service (`/worker`)
- **Queue-based processing** with BullMQ and Redis
- **Three queue types**:
  - `webhook-events` - Processes GitHub webhooks  
  - `repo-clone` - Handles repository cloning/pulling
  - `repo-analysis` - Analyzes repository structure and code
- **Scalable architecture** - Run multiple worker instances
- **Azure Queue integration** - For enterprise-level throughput
- **Git operations** - Automatic cloning and analysis
- **Error handling** - Retry logic with exponential backoff

### 2. Main API Updates
- **BullMQ integration** - Queue jobs instead of direct processing
- **Redis connection** - For queue management
- **Job queuing**:
  - Webhook events → Queue → Workers
  - New repos → Clone job queued automatically
  - Commits → Analysis jobs queued

### 3. Infrastructure
- **Redis** - Queue storage and pub/sub
- **Docker Compose** - All services configured
- **Scaling support** - `docker-compose up -d --scale worker=5`
- **Nixpacks configs** - Deploy to Railway/Render instantly

## Quick Start 🚀

### 1. Install Dependencies

```bash
# Worker
cd worker
npm install

# Main (if needed)
cd ../main
npm install bullmq ioredis
```

### 2. Setup Environment

**worker/.env**:
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
WORKER_CONCURRENCY=5
MONGODB_URI=your_mongodb_uri
MAIN_API_URL=http://localhost:3000
CLONE_DIR=/tmp/kurser-repos
```

**main/.env** (add these):
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Start Services

**Option A: Docker Compose (Recommended)**
```bash
# Start all services
docker-compose up -d

# Scale workers to 3
docker-compose up -d --scale worker=3

# View logs
docker-compose logs -f worker
```

**Option B: Local Development**
```bash
# Terminal 1 - Redis
docker run -d -p 6379:6379 redis:7-alpine

# Terminal 2 - Main API
cd main
npm run dev

# Terminal 3 - Worker
cd worker
npm run dev

# Terminal 4 - Frontend
cd frontend
npm run dev
```

## Usage Flow 🔄

### When User Adds Repository:

1. User clicks "Add Repository" in frontend
2. Main API creates webhook on GitHub
3. Main API saves repo to MongoDB
4. **Main API queues clone job** → Redis Queue
5. **Worker picks up job** → Clones repository
6. **Worker queues analysis job** → Analyzes code
7. Results saved to database

### When GitHub Sends Webhook:

1. GitHub sends push/PR/issue webhook
2. Main API receives webhook
3. Main API saves event to MongoDB
4. **Main API queues event** → Redis Queue
5. **Worker processes event** → Handles push/PR/issues
6. **Worker may queue clone job** → For code changes
7. Status updated in database

## Scaling 📈

### Small Scale (0-100 repos)
```bash
docker-compose up -d
# 1 worker, concurrency 5
```

###  Medium Scale (100-500 repos)
```bash
docker-compose up -d --scale worker=3
# 3 workers, concurrency 5 each = 15 concurrent jobs
```

### Large Scale (500+ repos)
```bash
docker-compose up -d --scale worker=10
# 10 workers, concurrency 5 each = 50 concurrent jobs
```

### Enterprise Scale (2000+ repos)
```bash
# Add to worker/.env
AZURE_STORAGE_CONNECTION_STRING=your_azure_connection

# Deploy with Kubernetes
kubectl apply -f k8s/
# Auto-scaling from 2-20 workers based on CPU/queue depth
```

## Deployment 🚀

### Railway (Easiest)

1. **Push to GitHub**
2. **Connect Railway** to your repo
3. **Create Services**:
   - Redis (Database → Redis)
   - Main API (from `/main` folder)
   - Worker (from `/worker` folder)
   - Frontend (from `/frontend` folder)
4. **Set Environment Variables** (see DEPLOYMENT.md)
5. **Scale Workers**: Settings → Replicas → 3

### Render

1. Create `render.yaml` (included in project)
2. Connect GitHub repo
3. Services auto-deploy

### Docker/VPS

```bash
# On server
git clone your-repo
cd kurser

# Configure
cp main/.env.example main/.env
cp worker/.env.example worker/.env
# Edit .env files

# Deploy
docker-compose up -d --build
docker-compose up -d --scale worker=5
```

## Monitoring 📊

### Check Queue Status
```bash
docker exec -it kurser-redis redis-cli

# Check queues
LLEN bull:webhook-events:wait
LLEN bull:repo-clone:wait  
LLEN bull:repo-analysis:wait

# View all queue keys
KEYS bull:*
```

### Worker Logs
```bash
# All workers
docker-compose logs -f worker

# Specific worker
docker logs -f kurser-worker-1
```

### Queue Dashboard (Optional)

Install Bull Board:
```bash
npm install --save @bull-board/api @bull-board/express @bull-board/ui
```

Access at: `http://localhost:3000/admin/queues`

## Configuration ⚙️

### Worker Concurrency

```bash
# Process 3 jobs simultaneously per worker
WORKER_CONCURRENCY=3

# Process 10 jobs simultaneously per worker (high load)
WORKER_CONCURRENCY=10
```

### Queue Settings

Edit `worker/src/config/queue.ts`:

```typescript
defaultJobOptions: {
  attempts: 3,              // Retry 3 times
  backoff: {
    type: 'exponential',
    delay: 2000,            // Start with 2s delay
  },
  removeOnComplete: {
    count: 100,             // Keep last 100 completed
    age: 3600 * 24,         // Remove after 24h
  },
}
```

## Project Structure 📁

```
kurser/
├── main/                      # Main API
│   ├── src/
│   │   ├── config/
│   │   │   └── bullmq.ts     # ✅ NEW: BullMQ queue setup
│   │   ├── controller/
│   │   │   ├── repoController.ts   # ✅ UPDATED: Queue clone jobs
│   │   │   └── webhookController.ts # ✅ UPDATED: Queue webhook events
│   └── package.json          # ✅ UPDATED: Added bullmq, ioredis
│
├── worker/                    # ✅ NEW: Worker Service
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts        # Environment configuration
│   │   │   └── queue.ts      # Queue definitions
│   │   ├── processors/
│   │   │   ├── webhookProcessor.ts    # Process webhook events
│   │   │   ├── repoCloneProcessor.ts   # Clone repositories  
│   │   │   └── repoAnalysisProcessor.ts # Analyze code
│   │   ├── workers/
│   │   │   ├── webhookWorker.ts
│   │   │   ├── repoCloneWorker.ts
│   │   │   └── repoAnalysisWorker.ts
│   │   ├── services/
│   │   │   ├── gitService.ts          # Git operations
│   │   │   └── azureQueueService.ts   # Azure integration
│   │   └── index.ts          # Main entry point
│   ├── Dockerfile            # ✅ NEW
│   ├── nixpacks.toml         # ✅ NEW: Railway/Render support
│   ├── package.json          # ✅ NEW
│   ├── tsconfig.json         # ✅ NEW
│   └── README.md             # ✅ NEW: Worker documentation
│
├── frontend/
│   └── nixpacks.toml         # ✅ NEW: Deploy support
│
├── docker-compose.yml         # ✅ UPDATED: Added Redis & Worker
├── README.md                  # ✅ NEW: Main project README
├── DEPLOYMENT.md              # ✅ NEW: Deployment guide
├── WORKER_SETUP.md            # ✅ NEW: Worker setup guide
└── COMPLETE_SETUP.md          # ✅ This file
```

## Key Features ✨

### 1. Scalable Architecture
- Run 1-20+ worker instances
- Independent scaling of API and workers
- Queue-based for reliability

### 2. Robust Job Processing
- Automatic retries with backoff
- Job status tracking
- Error logging
- Dead letter queue for failed jobs

### 3. Repository Operations
- Automatic cloning on repo add
- Pull latest changes on commits
- Analyze file structure
- Detect project type
- Count lines of code

### 4. Multiple Queue Types
- **Webhook Events**: High priority, fast processing
- **Repository Clone**: I/O intensive, lower concurrency
- **Code Analysis**: CPU intensive, controlled rate

### 5. Enterprise Ready
- Azure Storage Queue support
- Kubernetes auto-scaling
- Monitoring and metrics
- Health checks
- Graceful shutdown

## Testing 🧪

### 1. Start Services
```bash
docker-compose up -d
```

### 2. Add a Repository
- Go to http://localhost:3001
- Login with GitHub
- Click "Add Repository"
- Select a repo

### 3. Watch Worker Process
```bash
docker-compose logs -f worker

# Should see:
# 📦 Cloning repository...
# ✅ Repository ready
# 🔍 Analyzing repository...
# ✅ Analysis complete
```

### 4. Trigger Webhook
```bash
# Push to the tracked repository
git push

# Worker processes:
# 🔄 Processing webhook: push
# 📝 Push to main: 1 commits
# ✅ Webhook processed
```

### 5. Check Queue
```bash
docker exec -it kurser-redis redis-cli KEYS bull:*
```

## Troubleshooting 🔧

### Worker Not Starting
```bash
# Check Redis
docker-compose ps redis
docker exec -it kurser-redis redis-cli ping

# Check logs
docker-compose logs worker

# Restart
docker-compose restart worker
```

### Jobs Not Processing
```bash
# Check queue has jobs
docker exec -it kurser-redis redis-cli
LLEN bull:webhook-events:wait

# Verify worker is running
docker-compose ps worker

# Check for errors
docker-compose logs worker | grep ERROR
```

### High Memory Usage
```bash
# Reduce concurrency
WORKER_CONCURRENCY=3 docker-compose up -d

# Or add more workers with lower concurrency
docker-compose up -d --scale worker=5
```

## Performance Tips ⚡

1. **Start Small**: 1 worker with concurrency 5
2. **Monitor Queue Depth**: If > 100, add workers
3. **Scale Horizontally**: More workers > higher concurrency
4. **Use SSD**: For CLONE_DIR directory
5. **Clean Old Repos**: Periodic cleanup of cloned repos
6. **Use Azure**: For 2000+ repositories

## Next Steps 🎯

1. ✅ Worker service implemented
2. ✅ Queue system configured
3. ✅ Scaling support added
4. ✅ Documentation complete
5. ✅ Deployment configs ready

**You're ready to deploy!** 🚀

Choose your platform:
- **Railway**: Easiest, see DEPLOYMENT.md
- **Render**: Auto-deploy with render.yaml
- **Docker**: `docker-compose up -d`
- **Kubernetes**: `kubectl apply -f k8s/`

## Support 💬

- **Worker Documentation**: `worker/README.md`
- **Deployment Guide**: `DEPLOYMENT.md`
- **Setup Guide**: `WORKER_SETUP.md`
- **Main README**: `README.md`

---

**Kurser is now production-ready with scalable worker architecture!** ✅

Made with ❤️ for handling thousands of repositories effortlessly.

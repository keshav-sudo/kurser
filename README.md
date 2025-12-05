# Kurser - Scalable GitHub Repository Management System 🚀

A production-ready, horizontally scalable system for tracking GitHub repositories, processing webhooks, and analyzing code with distributed workers powered by BullMQ and Redis.

## Features ✨

- 🔐 **GitHub OAuth Authentication**
- 🪝 **Webhook Processing** - Automatic handling of push, PR, issues, and comments
- 📦 **Repository Cloning** - Automatic git clone/pull on repository addition
- 🔍 **Code Analysis** - Analyze repository structure, file types, and metrics
- ⚡ **Queue-based Architecture** - BullMQ with Redis for reliable job processing
- 📈 **Horizontal Scaling** - Scale workers independently to handle load
- ☁️ **Azure Queue Support** - Enterprise-level queue integration
- 🐳 **Docker Ready** - Complete Docker Compose setup
- 🚂 **Nixpacks Support** - Deploy to Railway/Render with zero config
- 🎯 **Production Ready** - Error handling, retries, monitoring

## Architecture 🏗️

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │────────▶│   Main API   │────────▶│    Redis    │
│  (React)    │         │  (Express)   │         │   (Queue)   │
└─────────────┘         └──────────────┘         └─────────────┘
                               │                        │
                               │                        │
                               ▼                        ▼
                        ┌──────────────┐         ┌─────────────┐
                        │   MongoDB    │         │  Worker(s)  │
                        │  (Database)  │◀────────│  (BullMQ)   │
                        └──────────────┘         └─────────────┘
                                                        │
                                                        ▼
                                                  ┌─────────────┐
                                                  │ Git Clones  │
                                                  │  Analysis   │
                                                  └─────────────┘
```

## Tech Stack 💻

### Backend (Main API)
- Node.js + TypeScript
- Express.js
- MongoDB (Mongoose)
- BullMQ (Redis)
- GitHub OAuth
- JWT Authentication

### Worker Service
- Node.js + TypeScript
- BullMQ (Job processing)
- Redis (Queue storage)
- simple-git (Repository operations)
- Azure Storage Queue (Optional)

### Frontend
- React + TypeScript
- Vite
- TailwindCSS
- Axios

### Infrastructure
- Docker & Docker Compose
- Redis 7
- RabbitMQ (Legacy support)
- Nixpacks (Railway/Render)

## Quick Start 🚀

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- MongoDB (Atlas or local)
- GitHub OAuth App

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/kurser.git
cd kurser
```

### 2. Setup Environment Variables

**Main API** (`main/.env`):
```bash
cp main/.env.example main/.env
nano main/.env
```

Required variables:
```bash
MONGODB_URI=your_mongodb_uri
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
JWT_SECRET=your_secret_key
REDIS_HOST=redis
REDIS_PORT=6379
```

**Worker** (`worker/.env`):
```bash
cp worker/.env.example worker/.env
nano worker/.env
```

Required variables:
```bash
REDIS_HOST=redis
REDIS_PORT=6379
WORKER_CONCURRENCY=5
MONGODB_URI=your_mongodb_uri
```

### 3. Start Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Access Application

- **Frontend**: http://localhost:3001
- **API**: http://localhost:3000
- **Redis**: localhost:6379
- **RabbitMQ Dashboard**: http://localhost:15672 (guest/guest)

## Development Setup 💻

### Local Development (Without Docker)

**Terminal 1 - Redis:**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

**Terminal 2 - Main API:**
```bash
cd main
npm install
npm run dev
```

**Terminal 3 - Worker:**
```bash
cd worker
npm install
npm run dev
```

**Terminal 4 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Scaling Workers 📈

### Docker Compose

Scale to 5 workers:
```bash
docker-compose up -d --scale worker=5
```

### Kubernetes

Deploy with auto-scaling:
```bash
kubectl apply -f k8s/
```

### Railway/Render

Configure replicas in dashboard or via config file.

## Configuration ⚙️

### Worker Concurrency

Adjust jobs processed simultaneously per worker:

```bash
# Light load (< 100 repos)
WORKER_CONCURRENCY=3

# Medium load (100-500 repos)
WORKER_CONCURRENCY=5

# Heavy load (500+ repos)
WORKER_CONCURRENCY=10
```

### Queue Configuration

Edit `worker/src/config/queue.ts`:

```typescript
defaultJobOptions: {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
}
```

## Deployment 🚀

### Railway (Recommended)

1. Connect GitHub repository
2. Create services: Redis, Main, Worker, Frontend
3. Configure environment variables
4. Deploy automatically with Nixpacks

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Render

1. Create `render.yaml` (included)
2. Connect repository
3. Services auto-deploy

### Docker/VPS

```bash
# Clone on server
git clone https://github.com/yourusername/kurser.git
cd kurser

# Configure environment
cp main/.env.example main/.env
cp worker/.env.example worker/.env
# Edit .env files

# Deploy
docker-compose up -d --build

# Scale workers
docker-compose up -d --scale worker=5
```

## Monitoring 📊

### Queue Status

```bash
# Connect to Redis
docker exec -it kurser-redis redis-cli

# Check queue depth
LLEN bull:webhook-events:wait
LLEN bull:repo-clone:wait
LLEN bull:repo-analysis:wait

# View all keys
KEYS bull:*
```

### Worker Logs

```bash
# All workers
docker-compose logs -f worker

# Specific worker
docker logs -f kurser-worker-1
```

### Health Check

```bash
curl http://localhost:3000/health
```

## API Endpoints 🔌

### Authentication
- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/github/callback` - OAuth callback
- `GET /auth/user` - Get current user

### Repositories
- `GET /api/repos` - Get user's GitHub repositories
- `GET /api/repos/tracked` - Get tracked repositories
- `POST /api/repos/webhook` - Setup webhook for repository
- `DELETE /api/repos/:repoId/webhook` - Remove webhook

### Webhooks
- `POST /webhook` - GitHub webhook endpoint
- `GET /api/webhook/events/:repoId` - Get webhook events

## Project Structure 📁

```
kurser/
├── main/                   # Main API service
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controller/    # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   └── index.ts       # Entry point
│   ├── Dockerfile
│   └── package.json
│
├── worker/                # Worker service
│   ├── src/
│   │   ├── config/        # Queue & env config
│   │   ├── processors/    # Job processors
│   │   ├── workers/       # Worker definitions
│   │   ├── services/      # Git & Azure services
│   │   └── index.ts       # Entry point
│   ├── Dockerfile
│   └── package.json
│
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── App.tsx        # Main app
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml     # Docker Compose config
├── DEPLOYMENT.md          # Deployment guide
├── WORKER_SETUP.md        # Worker setup guide
└── README.md              # This file
```

## Features in Detail 🔍

### 1. Webhook Processing

When GitHub sends a webhook:
1. Main API receives and validates webhook
2. Saves event to MongoDB
3. Adds job to Redis queue
4. Worker picks up and processes
5. Updates event status

### 2. Repository Cloning

When repository is added:
1. Job added to clone queue
2. Worker clones repository to local storage
3. Can checkout specific branches
4. Triggers analysis job

### 3. Code Analysis

Worker analyzes:
- Total file count
- File type distribution
- Lines of code
- Project type detection
- Latest commit information

## Scaling Guidelines 📏

| Repositories | Workers | Concurrency | Redis Memory |
|-------------|---------|-------------|--------------|
| 0-100       | 1       | 5           | 256MB        |
| 100-500     | 2-3     | 5           | 512MB        |
| 500-2000    | 5-10    | 5-10        | 1-2GB        |
| 2000+       | 10-20+  | 10          | 4GB+         |

## Azure Queue Integration ☁️

For enterprise scale (2000+ repos):

```bash
# Add to worker/.env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
```

Benefits:
- 20,000 messages/sec throughput
- 7-day message retention
- 99.9% SLA
- Geo-redundancy

## Troubleshooting 🔧

### Workers Not Processing

```bash
# Check Redis
docker-compose ps redis
docker exec -it kurser-redis redis-cli ping

# Check queue has jobs
docker exec -it kurser-redis redis-cli KEYS bull:*

# Restart worker
docker-compose restart worker
```

### GitHub Webhooks Not Working

1. Verify `PUBLIC_URL` is set
2. Check GitHub webhook settings
3. Ensure URL is publicly accessible
4. Check webhook delivery in GitHub

### High Memory Usage

```bash
# Reduce concurrency
WORKER_CONCURRENCY=3 docker-compose up -d

# Or add more workers
docker-compose up -d --scale worker=5
```

## Contributing 🤝

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## Performance Tips ⚡

1. **Use Redis persistence** for job recovery
2. **Scale workers horizontally** instead of increasing concurrency too high
3. **Monitor queue depth** and scale proactively
4. **Clean up old cloned repos** regularly
5. **Use Azure Queues** for very high throughput

## Security 🔒

- JWT tokens for authentication
- GitHub OAuth for secure login
- Environment variables for secrets
- CORS configured for frontend
- Rate limiting (recommended to add)

## License 📄

ISC

## Support 💬

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

## Roadmap 🗺️

- [ ] Bull Board dashboard integration
- [ ] Prometheus metrics
- [ ] Advanced code analysis (complexity, dependencies)
- [ ] Slack/Discord notifications
- [ ] Multi-tenant support
- [ ] GraphQL API
- [ ] Real-time updates via WebSocket

## Acknowledgments 🙏

- BullMQ for reliable queue processing
- simple-git for Git operations
- GitHub API for repository data
- Railway/Nixpacks for easy deployment

---

Made with ❤️ for scalable GitHub repository management
# kurser

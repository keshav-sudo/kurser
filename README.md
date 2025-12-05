# Kurser - GitHub Repository Manager 🚀

Ek modern system jo GitHub repositories ko track, analyze aur manage karta hai. Automatic webhooks, code analysis aur distributed processing ke sath.

## Kya Kar Sakta Hai? ✨

- GitHub se login karo aur apni repositories dekho
- Automatic webhook setup
- Repository clone aur analysis
- Real-time updates jab bhi code change ho
- Queue-based processing (no overload)
- Azure Blob me files store
- Scalable architecture (jitne chahiye utne workers)

## Kaise Kaam Karta Hai? 🏗️

```
User → Frontend → API → MongoDB (data save)
                    ↓
                  Redis Queue
                    ↓
                  Worker → Git Clone → Azure Storage
                    ↓
                  Analysis Complete!
```

## Technology Stack 💻

**Backend:**
- Node.js + TypeScript
- Express (API)
- MongoDB (Database)
- BullMQ + Redis (Queue)
- GitHub OAuth

**Worker:**
- Background job processing
- Git operations
- Azure Blob Storage

**Frontend:**
- React + Vite
- Clean UI

## Local Setup (Testing) 🚀

### 1. Clone karo
```bash
git clone <your-repo-url>
cd kurser
```

### 2. Docker se start karo
```bash
docker-compose up -d
```

### 3. Environment variables set karo

**main/.env** file:
```bash
MONGODB_URI=your_mongodb_atlas_url
GITHUB_CLIENT_ID=your_github_app_id
GITHUB_CLIENT_SECRET=your_github_app_secret
JWT_SECRET=random_secret_key
REDIS_HOST=redis
REDIS_PORT=6379
```

**worker/.env** file:
```bash
REDIS_HOST=redis
REDIS_PORT=6379
MONGODB_URI=same_as_main
WORKER_CONCURRENCY=5
```

### 4. Access karo
- Frontend: http://localhost:3001
- API: http://localhost:3000

## Production Deployment 🌐

**Sabse easy:** Railway.app (free tier available)
**Best for Azure:** App Service + Blob Storage

Complete guide: [DEPLOYMENT.md](./DEPLOYMENT.md)

### Quick Deploy to Railway:
1. Railway.app pe account banao
2. GitHub repo connect karo
3. 4 services add karo: Redis, Main, Worker, Frontend
4. Environment variables set karo
5. Deploy! ✨

**URLs automatically mil jayengi:**
- Example: `kurser-api.railway.app`

## Azure Storage Setup (Optional but Recommended)

Agar aap large repositories clone kar rahe ho, to Azure Blob Storage use karo:

```bash
# Storage account banao
az storage account create --name kurserdata --resource-group kurser-rg

# Connection string lo
az storage account show-connection-string --name kurserdata
```

Worker .env me add karo:
```bash
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
```

## Important URLs

**Website kahan milegi:**
- Railway: Dashboard me automatic URL milti hai
- Azure: `https://your-app-name.azurewebsites.net`
- Vercel: Deploy karne pe URL milti hai

**GitHub Webhook URL:**
- Format: `https://your-api-url.com/webhook`
- Yeh URL GitHub repository settings me dalna hoga

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

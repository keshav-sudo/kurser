# 🚀 Kurser - GitHub Repository Manager

> Like Vercel, but for any GitHub repository with automated deployment workflows

## ✨ What is Kurser?

Kurser is a production-ready GitHub repository management system that:
- ✅ **Separates frontend and backend** (deploy independently)
- ✅ **Uses queues for scalability** (Redis + BullMQ)
- ✅ **Processes webhooks with workers** (auto-clone, auto-deploy)
- ✅ **Uses cloud MongoDB** (no local database needed)
- ✅ **Scales horizontally** (add more workers easily)

## 🏗️ Architecture

```
Frontend (Vercel/GitHub Pages)
       ↓ HTTPS API
Backend (Docker: Redis + API + Workers) ← MongoDB Atlas
```

**Flow:**
1. User logs in via GitHub OAuth
2. User selects repository → Webhook created
3. Repository queued for cloning
4. Worker picks job from Redis queue → Clones repo
5. Future commits → Webhook → Queue → Worker processes

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Docker & Docker Compose installed
- MongoDB Atlas account (free tier)
- GitHub account

### Step 1: Clone & Configure
```bash
git clone <your-repo-url>
cd kurser

# Run setup script
./setup.sh
```

### Step 2: Get MongoDB Atlas
1. Create account: https://cloud.mongodb.com
2. Create free cluster (M0)
3. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/kurser`

### Step 3: Get GitHub OAuth
1. Go to: https://github.com/settings/developers
2. New OAuth App
3. Callback URL: `http://localhost:3000/auth/github/callback`
4. Get Client ID and Secret

### Step 4: Configure Environment

Edit `main/.env`:
```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_secret
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kurser
JWT_SECRET=$(openssl rand -hex 32)
FRONTEND_URL=http://localhost:5173
```

Edit `worker/.env`:
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kurser
```

### Step 5: Start Services

```bash
# Start backend (Redis + API + Worker)
docker compose up -d --build

# Check logs
docker compose logs -f

# In another terminal, start frontend
cd frontend
npm install
npm run dev
```

Visit: http://localhost:5173

## 📦 What's Included

### Backend Services (Docker Compose)
- **Redis** (with password) - Job queue
- **Main API** - GitHub OAuth, webhooks, REST API
- **Worker(s)** - Process queue jobs, clone repos

### Frontend (Separate Deployment)
- **React + Vite** - Modern, fast UI
- **GitHub OAuth** - Secure authentication
- **Live logs** - Real-time webhook events

### Database
- **MongoDB Atlas** - Cloud database (no local container needed)

## 📊 Features

✅ **GitHub OAuth Login**
✅ **Repository Management** - Add/Remove repositories
✅ **Automatic Webhooks** - Created when repo added
✅ **Queue-Based Processing** - Scalable architecture
✅ **Repository Cloning** - Auto-clone on setup
✅ **Webhook Processing** - Handle push, PR, issues
✅ **Live Event Logs** - See webhook activity
✅ **Worker Scaling** - Run multiple workers
✅ **Production Ready** - Docker, health checks, monitoring

## 🔧 Key Technologies

- **Backend**: Node.js, TypeScript, Express, BullMQ
- **Frontend**: React, Vite, Axios
- **Queue**: Redis (with password)
- **Database**: MongoDB Atlas
- **Deployment**: Docker Compose
- **Auth**: GitHub OAuth

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get started in 5 minutes
- **[PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)** - Complete deployment guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist
- **[FINAL_SETUP.md](./FINAL_SETUP.md)** - Architecture overview

## 🎯 Usage

1. **Login** - Click "Login with GitHub"
2. **Add Repository** - Select from your repos
3. **Automatic Setup** - Webhook created, repo queued for cloning
4. **Monitor** - View logs and webhook events
5. **Automatic Processing** - Commits trigger worker jobs

## 🔄 Scaling

Scale workers horizontally:
```bash
docker compose up -d --scale worker=3
```

Each worker processes jobs independently from the Redis queue.

## 📊 Monitoring

```bash
# View all logs
docker compose logs -f

# View specific service
docker compose logs -f worker

# Check queue status
docker compose exec redis redis-cli -a kurser_redis_pass_2024
> KEYS bull:*
> LLEN bull:webhook-events:waiting
```

## 🚀 Production Deployment

### Backend (Choose one):
- **Azure Container Instances** - Recommended for production
- **Railway.app** - Easiest deployment
- **DigitalOcean/Linode** - VPS with Docker

### Frontend (Choose one):
- **Vercel** - Recommended (instant deployment)
- **GitHub Pages** - Free hosting
- **Netlify** - Alternative to Vercel

See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) for detailed instructions.

## 🛠️ Development

```bash
# Backend development
cd main
npm install
npm run dev

# Worker development
cd worker
npm install
npm run dev

# Frontend development
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
kurser/
├── docker-compose.yml          # Services: Redis, Main, Worker
├── main/                       # Backend API
│   ├── src/
│   │   ├── config/            # MongoDB, Redis, BullMQ
│   │   ├── controller/        # Auth, Repos, Webhooks
│   │   ├── models/            # User, Repository, WebhookEvent
│   │   └── routes/            # API routes
│   └── Dockerfile
├── worker/                     # Worker service
│   ├── src/
│   │   ├── workers/           # Webhook, Clone, Analysis workers
│   │   └── services/          # Git operations
│   └── Dockerfile
└── frontend/                   # React app
    ├── src/
    │   └── App.jsx            # Main UI
    └── vite.config.js
```

## 🔐 Security

- Redis protected with password
- JWT for API authentication
- GitHub OAuth for user login
- MongoDB Atlas with authentication
- CORS configured for frontend
- Environment variables for secrets

## 🐛 Troubleshooting

**Backend won't start:**
```bash
docker compose logs main
# Check MongoDB URI and GitHub OAuth credentials
```

**Worker not processing:**
```bash
docker compose logs worker
# Check Redis connection and MongoDB URI
```

**Frontend can't connect:**
- Check `VITE_API_URL` in frontend/.env
- Check `FRONTEND_URL` in main/.env (CORS)

## 📝 Environment Variables

### Required:
- `GITHUB_CLIENT_ID` - GitHub OAuth app
- `GITHUB_CLIENT_SECRET` - GitHub OAuth secret
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Random secret for tokens

### Optional:
- `PUBLIC_URL` - For GitHub webhooks (set after deployment)
- `FRONTEND_URL` - Frontend URL for CORS

## 🤝 Contributing

This is a production-ready template. Feel free to:
- Fork and modify
- Add new features
- Improve workers
- Enhance frontend

## 📄 License

MIT License - Use freely!

## 🎉 Ready to Deploy?

Follow the [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for step-by-step deployment.

## 💡 Tips

1. **Local Development**: Use ngrok for webhook testing
2. **Production**: Deploy backend first, then frontend
3. **Scaling**: Add more workers with `--scale worker=N`
4. **Monitoring**: Use `docker compose logs -f` to watch activity
5. **Security**: Change Redis password in docker-compose.yml

---

**Need help?** Check the documentation files or view logs: `docker compose logs -f`

**Questions?** Review [QUICK_START.md](./QUICK_START.md) for common issues.

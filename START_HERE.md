# 🚀 START HERE - Kurser Setup Guide

> **New to this project? Start here!**

## What is Kurser?

Kurser is a GitHub repository manager like Vercel:
- Login with GitHub
- Select repository → Automatic webhook creation
- Worker clones and processes repositories
- Commits trigger automatic processing

## 🏗️ Architecture (Simple)

```
You (Frontend) → Backend API → Redis Queue → Worker → Clone Repo
                     ↓
              MongoDB Atlas (Cloud)
```

**Frontend**: Deployed separately (Vercel/GitHub Pages)
**Backend**: Docker (Redis + API + Worker)
**Database**: MongoDB Atlas (online, no local DB needed)

## ⚡ Quick Setup (3 Commands)

### 1. Configure Environment
```bash
# Copy example files
cp main/.env.example main/.env
cp worker/.env.example worker/.env
cp frontend/.env.example frontend/.env

# Edit main/.env with your credentials:
# - GITHUB_CLIENT_ID
# - GITHUB_CLIENT_SECRET  
# - MONGODB_URI (from MongoDB Atlas)
# - JWT_SECRET (generate with: openssl rand -hex 32)

# Edit worker/.env with same MONGODB_URI
```

### 2. Start Backend
```bash
docker compose up -d --build
docker compose logs -f
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:5173
```

## ✅ What You Need

### Before Starting:
1. **MongoDB Atlas Account** (free)
   - Sign up: https://cloud.mongodb.com
   - Create M0 cluster (free tier)
   - Get connection string

2. **GitHub OAuth App**
   - Create: https://github.com/settings/developers
   - Callback URL: `http://localhost:3000/auth/github/callback`
   - Get Client ID and Secret

3. **Docker Installed**
   - Docker Desktop (Mac/Windows)
   - Docker Engine (Linux)

## 📚 Documentation (Read in Order)

1. **This file (START_HERE.md)** ← You are here
2. **[QUICK_START.md](./QUICK_START.md)** - Detailed 5-minute setup
3. **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist
4. **[PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)** - Full production guide
5. **[FINAL_SETUP.md](./FINAL_SETUP.md)** - Architecture details

## 🔧 Configuration Summary

### main/.env (Backend API)
```bash
GITHUB_CLIENT_ID=your_id_here
GITHUB_CLIENT_SECRET=your_secret_here
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kurser
JWT_SECRET=your_random_secret_here
FRONTEND_URL=http://localhost:5173
```

### worker/.env (Worker Service)
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kurser
# Redis credentials auto-configured in docker-compose
```

### frontend/.env (Frontend Dev)
```bash
VITE_API_URL=http://localhost:3000
```

## 🎯 Test It Works

### 1. Check Backend Health
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 2. Check Services Running
```bash
docker compose ps
# Should see: redis (healthy), main (running), worker (running)
```

### 3. Check Logs
```bash
docker compose logs -f
# Should see startup messages, no errors
```

### 4. Test Frontend
- Visit http://localhost:5173
- Click "Check API Health" → Should show "✅"
- Click "Login with GitHub" → Should redirect to GitHub

## 🚀 How to Use

1. **Login**: Click "Login with GitHub"
2. **Load Repos**: Click "Load Repositories"
3. **Add Repo**: Select repo → Click "Setup Webhook & Deploy"
4. **Monitor**: Check logs `docker compose logs -f worker`
5. **Success**: Repository cloned, webhook active

## 📊 What Happens When You Add a Repo?

1. Frontend sends request to backend API
2. Backend creates webhook on GitHub
3. Backend adds clone job to Redis queue
4. Worker picks job from queue
5. Worker clones repository
6. Future commits → Webhook → Queue → Worker processes

## 🔄 Common Commands

```bash
# Start all services
docker compose up -d --build

# View logs
docker compose logs -f
docker compose logs -f main    # API only
docker compose logs -f worker  # Worker only

# Stop services
docker compose down

# Restart a service
docker compose restart main

# Scale workers (run 3 workers)
docker compose up -d --scale worker=3

# Clean everything
docker compose down -v
```

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check logs
docker compose logs main

# Common issues:
# - MongoDB URI incorrect → Check main/.env
# - GitHub OAuth missing → Check GITHUB_CLIENT_ID/SECRET
# - Port 3000 in use → Stop other services
```

### Worker Not Processing
```bash
# Check logs
docker compose logs worker

# Common issues:
# - Redis password mismatch (should be auto-configured)
# - MongoDB URI incorrect → Check worker/.env
```

### Frontend Can't Connect
```bash
# Check API URL
cat frontend/.env
# Should be: VITE_API_URL=http://localhost:3000

# Check CORS
# In main/.env: FRONTEND_URL=http://localhost:5173
```

## 🎉 Ready for Production?

Once everything works locally:

1. **Deploy Backend** → Azure/Railway/DigitalOcean
2. **Deploy Frontend** → Vercel/GitHub Pages/Netlify
3. **Update URLs** → GitHub OAuth callback, FRONTEND_URL, PUBLIC_URL
4. **Test Live** → Login, add repo, check webhooks

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for step-by-step instructions.

## 💡 Key Features

✅ **Minimal Setup** - Only Redis + API + Worker (no local MongoDB)
✅ **Scalable** - Add more workers with `--scale worker=N`
✅ **Production Ready** - Health checks, monitoring, error handling
✅ **Queue Based** - All async work goes through Redis
✅ **Auto Webhooks** - Created automatically when repo added
✅ **Live Logs** - See everything in real-time

## 📁 Project Structure (Simple View)

```
kurser/
├── docker-compose.yml     # Redis + Main + Worker
├── main/                  # Backend API
│   ├── src/              # Express, Auth, Webhooks
│   └── .env              # Your config
├── worker/                # Queue processor
│   ├── src/              # Git clone, webhook processing
│   └── .env              # Your config
├── frontend/              # React UI
│   ├── src/App.jsx       # Main interface
│   └── .env              # API URL
└── START_HERE.md          # This file
```

## 🆘 Need Help?

1. **Check logs first**: `docker compose logs -f`
2. **Read docs**: [QUICK_START.md](./QUICK_START.md)
3. **Verify config**: Check .env files
4. **Test health**: `curl http://localhost:3000/health`

## ✅ Checklist

Before running:
- [ ] MongoDB Atlas cluster created
- [ ] GitHub OAuth app created
- [ ] main/.env configured
- [ ] worker/.env configured
- [ ] Docker is running

After running:
- [ ] Services start successfully
- [ ] Health check returns OK
- [ ] Frontend loads
- [ ] Can login with GitHub
- [ ] Can add repository
- [ ] Worker processes clone job

---

**Next Step**: Follow [QUICK_START.md](./QUICK_START.md) for detailed setup.

**Questions?** Check logs: `docker compose logs -f`

🚀 **Happy Deploying!**

# Kurser - Quick Start Guide

## 🎯 Overview

Kurser is a GitHub repository management system similar to Vercel's workflow:
- **Frontend**: Deploy separately (GitHub Pages/Vercel/Netlify)
- **Backend**: Redis queue + Main API + Worker(s)
- **Database**: MongoDB Atlas (online cluster)

## 🚀 Quick Setup (5 minutes)

### Step 1: Get MongoDB Atlas
1. Create free account: https://cloud.mongodb.com
2. Create cluster (Free M0)
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/kurser`

### Step 2: Get GitHub OAuth
1. Go to: https://github.com/settings/developers
2. New OAuth App
3. Note Client ID and Secret

### Step 3: Configure Environment

Run the setup script:
```bash
./setup.sh
```

Or manually create `.env` files:

**main/.env**:
```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kurser
JWT_SECRET=change_this_secret
FRONTEND_URL=http://localhost:5173
PUBLIC_URL=
```

**worker/.env**:
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kurser
```

### Step 4: Start Backend

```bash
# Start all services
docker compose up -d --build

# Check logs
docker compose logs -f
```

### Step 5: Start Frontend (Development)

```bash
cd frontend
npm install
npm run dev
```

Visit: http://localhost:5173

## 📦 Deploy Frontend

### Option 1: Vercel (Easiest)
```bash
cd frontend
npm install -g vercel
vercel --prod
```

### Option 2: GitHub Pages
```bash
cd frontend
npm install
npm run build
npm install -D gh-pages
npm run deploy
```

### Option 3: Netlify
```bash
cd frontend
netlify deploy --prod
```

## 🔧 How It Works

1. **User logs in** via GitHub OAuth
2. **User adds repository** → Creates webhook + Queues clone job
3. **Worker picks job** from Redis queue → Clones repo
4. **User makes commit** → GitHub webhook → Queue job → Worker processes
5. **Logs visible** in real-time via Docker logs

## 📊 Monitoring

```bash
# All logs
docker compose logs -f

# Main backend only
docker compose logs -f main

# Worker only
docker compose logs -f worker

# Check Redis queue
docker compose exec redis redis-cli -a kurser_redis_pass_2024
> KEYS *
```

## 🔄 Scale Workers

```bash
# Run 3 workers
docker compose up -d --scale worker=3

# Check running workers
docker compose ps
```

## 🛑 Stop Services

```bash
# Stop all
docker compose down

# Stop and remove volumes
docker compose down -v
```

## ✅ Test Checklist

- [ ] Backend health: `curl http://localhost:3000/health`
- [ ] Frontend loads and shows login
- [ ] GitHub login works
- [ ] Can add repository
- [ ] Worker logs show repo clone
- [ ] Webhook created on GitHub
- [ ] Commit triggers worker

## 🆘 Troubleshooting

**Backend won't start:**
- Check MongoDB URI is correct
- Check Docker is running
- Check ports 3000, 6379 are free

**Frontend can't connect:**
- Check `VITE_API_URL` in frontend/.env
- Check `FRONTEND_URL` in main/.env (CORS)

**Worker not processing:**
- Check Redis password in worker/.env
- Check worker logs: `docker compose logs worker`

**Webhooks not working:**
- Set `PUBLIC_URL` in main/.env (use ngrok for local testing)
- Check GitHub webhook delivery page

## 📚 Full Documentation

See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) for complete deployment guide.

---

**Need help?** Check the logs first: `docker compose logs -f`

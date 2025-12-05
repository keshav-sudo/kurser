# Kurser - Quick Start Guide

Vercel-ready GitHub webhook system with OAuth, RabbitMQ event streaming, and MongoDB storage.

## 🚀 Quick Start (5 minutes)

### 1. Start All Services with Docker

```bash
# Clone and navigate
cd kurser

# Create .env file
cp main/.env.example main/.env

# Start MongoDB, RabbitMQ, Redis, and Main API
docker-compose up -d

# View logs
docker-compose logs -f main
```

That's it! All services are now running:
- **Main API**: http://localhost:3000
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **MongoDB**: mongodb://localhost:27017
- **Redis**: redis://localhost:6379

### 2. Setup GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Kurser Local
   - **Homepage URL**: http://localhost:3000
   - **Authorization callback URL**: http://localhost:3000/auth/github/callback
4. Click "Register application"
5. Copy **Client ID** and generate **Client Secret**
6. Add to `main/.env`:
   ```
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   JWT_SECRET=some_random_secret_string
   ```
7. Restart the service:
   ```bash
   docker-compose restart main
   ```

### 3. Test the System

```bash
# Health check
curl http://localhost:3000/health

# Start OAuth flow (open in browser)
open http://localhost:3000/auth/github
```

## 📋 System Overview

### Flow Diagram
```
┌─────────┐     ┌─────────────┐     ┌──────────┐     ┌────────┐
│ User    │────▶│ GitHub OAuth│────▶│ Main API │────▶│ MongoDB│
└─────────┘     └─────────────┘     └──────────┘     └────────┘
                                         │
                                         ▼
┌─────────┐     ┌──────────┐     ┌──────────┐
│ Worker  │◀────│ RabbitMQ │◀────│ Webhook  │
└─────────┘     └──────────┘     └──────────┘
```

### What Happens:

1. **User logs in** → GitHub OAuth → Token saved in MongoDB
2. **User selects repo** → Webhook created on GitHub (using OAuth token)
3. **GitHub sends events** → Main API receives → Saves to MongoDB
4. **Event pushed to RabbitMQ** → Worker consumes → Processes
5. **Worker updates status** → Back to MongoDB via API

## 🛠️ Development

### Local Development (Without Docker)

```bash
cd main

# Install dependencies
npm install

# Start MongoDB, RabbitMQ, Redis via Docker
docker-compose up -d mongodb rabbitmq redis

# Run in dev mode (hot reload)
npm run dev

# Build
npm run build

# Production
npm start
```

## 📖 API Usage

### 1. Authentication
```bash
# Login (opens browser)
curl http://localhost:3000/auth/github

# After auth, use JWT token
TOKEN="your_jwt_token"

# Get profile
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/auth/profile
```

### 2. Setup Webhook
```bash
# Get your repositories
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/repos

# Setup webhook for a repo
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"repoFullName": "username/repo-name"}' \
  http://localhost:3000/repos/webhook

# View tracked repos
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/repos/tracked
```

### 3. Monitor Events
```bash
# Get webhook events for a repo
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/webhook/events/REPO_ID?status=completed&limit=10"
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild main service
docker-compose up -d --build main

# View specific service logs
docker-compose logs -f rabbitmq
docker-compose logs -f mongodb

# Check status
docker-compose ps

# Clean everything (including volumes)
docker-compose down -v
```

## 🔍 Debugging

### Check Services

```bash
# Check if all containers are running
docker-compose ps

# Check RabbitMQ queues
# Open http://localhost:15672 (guest/guest)
# Go to Queues tab → webhook-events

# Check MongoDB data
docker exec -it kurser-mongodb mongosh kurser
> db.users.find()
> db.repositories.find()
> db.webhookevents.find()
```

### Common Issues

**1. RabbitMQ connection failed**
```bash
docker-compose logs rabbitmq
docker-compose restart rabbitmq
```

**2. MongoDB connection failed**
```bash
docker-compose logs mongodb
# Check if .env has correct MONGODB_URI
```

**3. GitHub webhook not receiving**
- Verify PUBLIC_URL is accessible from GitHub
- For local dev, use ngrok:
  ```bash
  ngrok http 3000
  # Update webhook URL in GitHub repo settings
  ```

**4. OAuth callback fails**
- Verify GITHUB_CALLBACK_URL matches OAuth app settings
- Check GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET

## 📁 Project Structure

```
kurser/
├── main/                   # Main API service
│   ├── src/
│   │   ├── config/        # Environment, DB, RabbitMQ
│   │   ├── models/        # MongoDB schemas
│   │   ├── controller/    # Business logic
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth middleware
│   │   └── index.ts       # Entry point
│   ├── Dockerfile         # Optimized build
│   ├── .env.example       # Environment template
│   └── package.json
├── worker/                # Worker service (separate)
├── docker-compose.yml     # All services
└── QUICKSTART.md         # This file
```

## 🌐 Production Deployment

### For Vercel

```bash
cd main

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Use external MongoDB Atlas and CloudAMQP/RabbitMQ
```

### Environment Variables for Production

```bash
# Required
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
JWT_SECRET=xxx
MONGODB_URI=mongodb+srv://...  # MongoDB Atlas
RABBITMQ_HOST=xxx              # CloudAMQP or RabbitMQ Cloud
PUBLIC_URL=https://your-app.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app
```

## 📚 Documentation

- **API Documentation**: See `main/API.md`
- **Full README**: See `main/README.md`

## 🎯 Next Steps

1. ✅ Start services with Docker
2. ✅ Configure GitHub OAuth
3. ✅ Test authentication flow
4. ✅ Setup webhook for a test repository
5. ✅ Push code and verify event in RabbitMQ
6. ✅ Build worker service to consume events
7. ✅ Deploy to production

## 💡 Tips

- Use **ngrok** for local GitHub webhooks testing
- Monitor RabbitMQ at http://localhost:15672
- Check MongoDB with `mongosh` or MongoDB Compass
- View logs with `docker-compose logs -f`
- For production, use managed services (MongoDB Atlas, CloudAMQP)

## 🐛 Support

If you encounter issues:
1. Check `docker-compose logs -f`
2. Verify `.env` configuration
3. Ensure GitHub OAuth app is configured correctly
4. Test with `curl http://localhost:3000/health`

---

**Happy coding! 🚀**

# Docker Compose Setup - Complete Guide

## Architecture

```
┌─────────────────────────────────────────────┐
│         Frontend (React + Nginx)            │
│         Container: kurser-frontend          │
│         Port: 3001                          │
└─────────────────┬───────────────────────────┘
                  │
                  │ HTTP Requests
                  ▼
┌─────────────────────────────────────────────┐
│         Backend (Express + Node)            │
│         Container: kurser-main              │
│         Port: 3000                          │
└─────┬──────────────────────┬────────────────┘
      │                      │
      │                      │
      ▼                      ▼
┌─────────────┐      ┌──────────────────┐
│  MongoDB    │      │   RabbitMQ       │
│  Atlas      │      │   (Docker)       │
│  (Cloud)    │      │   Container:     │
│             │      │   kurser-rabbitmq│
└─────────────┘      └──────────────────┘
```

## Services

### 1. RabbitMQ ✅
- **Image**: `rabbitmq:3.12-management-alpine`
- **Container**: `kurser-rabbitmq`
- **Ports**: 
  - 5672 (AMQP)
  - 15672 (Management UI)
- **Credentials**: guest / guest
- **Volume**: `rabbitmq_data`

### 2. Backend (Main) ✅
- **Build**: `./main/Dockerfile`
- **Container**: `kurser-main`
- **Port**: 3000
- **Environment**:
  - Uses MongoDB Atlas (from .env)
  - Connects to RabbitMQ container
  - GitHub OAuth from .env

### 3. Frontend ✅
- **Build**: `./frontend/Dockerfile`
- **Container**: `kurser-frontend`
- **Port**: 3001
- **Server**: Nginx
- **Connects to**: Backend API

## Quick Start

### 1. Single Command Start
```bash
cd /home/keshav/kurser
docker compose up -d
```

This will:
- ✅ Start RabbitMQ container
- ✅ Build and start backend container
- ✅ Build and start frontend container
- ✅ Create network and volumes

### 2. Check Status
```bash
docker compose ps
```

### 3. View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f main
docker compose logs -f frontend
docker compose logs -f rabbitmq
```

### 4. Access Applications
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Backend Health**: http://localhost:3000/health
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

## Environment Variables

Your `.env` file in `./main/.env` should have:

```env
# Server
PORT=3000
NODE_ENV=production

# GitHub OAuth
GITHUB_CLIENT_ID=Ov23liXEVYMU6ISIsOac
GITHUB_CLIENT_SECRET=6bdba58317af69291cfe84812a15e6f78e435ef5
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

# MongoDB Atlas (Cloud - Already Set)
MONGODB_URI=mongodb+srv://thesharmakeshav:TFJUWDRi46dbR5TB@cluster0.kegg0.mongodb.net/kurser?retryWrites=true&w=majority

# RabbitMQ (Docker - Container Name)
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_QUEUE=webhook-events

# JWT
JWT_SECRET=your_jwt_secret_key_change_this

# Frontend
FRONTEND_URL=http://localhost:3001
```

**Important Note**: When running in Docker, `RABBITMQ_HOST=rabbitmq` (container name).
When running locally (npm run dev), use `RABBITMQ_HOST=localhost`.

## Docker Commands

### Start Services
```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d rabbitmq
docker compose up -d main
```

### Stop Services
```bash
# Stop all
docker compose down

# Stop but keep volumes
docker compose stop
```

### Rebuild After Code Changes
```bash
# Rebuild all
docker compose up -d --build

# Rebuild specific service
docker compose up -d --build main
docker compose up -d --build frontend
```

### View Logs
```bash
# All logs
docker compose logs

# Follow logs
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100

# Specific service
docker compose logs -f main
```

### Remove Everything (Clean Slate)
```bash
# Stop and remove containers, networks
docker compose down

# Remove volumes too (data will be lost)
docker compose down -v
```

### Execute Commands in Container
```bash
# Backend shell
docker compose exec main sh

# Check backend health from inside
docker compose exec main wget -q -O- http://localhost:3000/health
```

## Development vs Production

### Development Mode (Local)
```bash
# Terminal 1: Backend
cd /home/keshav/kurser/main
npm run dev

# Terminal 2: Frontend
cd /home/keshav/kurser/frontend
npm run dev
```

In `.env` use:
```env
RABBITMQ_HOST=localhost
```

### Production Mode (Docker)
```bash
cd /home/keshav/kurser
docker compose up -d
```

In `.env` use:
```env
RABBITMQ_HOST=rabbitmq
```

## Troubleshooting

### Services Won't Start
```bash
# Check logs
docker compose logs

# Check specific service
docker compose logs main

# Restart specific service
docker compose restart main
```

### Port Already in Use
```bash
# Check what's using the port
sudo netstat -tulpn | grep -E "3000|3001|5672"

# Stop conflicting services
# Then restart docker compose
docker compose down
docker compose up -d
```

### RabbitMQ Connection Failed
```bash
# Check RabbitMQ health
docker compose exec rabbitmq rabbitmq-diagnostics ping

# Check RabbitMQ logs
docker compose logs rabbitmq

# Restart RabbitMQ
docker compose restart rabbitmq
```

### Backend Build Failed
```bash
# Check Dockerfile syntax
cat /home/keshav/kurser/main/Dockerfile

# Try building manually
cd /home/keshav/kurser/main
docker build -t test-build .

# Check build logs
docker compose up --build main
```

### Frontend Not Loading
```bash
# Check nginx logs
docker compose logs frontend

# Check if files were built
docker compose exec frontend ls -la /usr/share/nginx/html

# Restart frontend
docker compose restart frontend
```

### Cannot Connect to MongoDB Atlas
```bash
# Check from backend container
docker compose exec main ping cluster0.kegg0.mongodb.net

# Verify .env file
docker compose exec main cat .env | grep MONGODB_URI

# Check backend logs
docker compose logs main | grep -i mongo
```

## Testing the Setup

### 1. Start Everything
```bash
cd /home/keshav/kurser
docker compose up -d
```

### 2. Wait for Services (30 seconds)
```bash
sleep 30
```

### 3. Check Health
```bash
# Backend health
curl http://localhost:3000/health

# RabbitMQ
curl -u guest:guest http://localhost:15672/api/overview

# Frontend (should return HTML)
curl http://localhost:3001
```

### 4. Open Browser
```
http://localhost:3001
```

### 5. Test Full Flow
1. Click "Login with GitHub"
2. Authorize application
3. Load Profile ✅
4. Load Repositories ✅
5. Setup Webhook ✅
6. View Events ✅

## Volume Management

### List Volumes
```bash
docker volume ls | grep kurser
```

### Backup RabbitMQ Data
```bash
docker run --rm -v kurser_rabbitmq_data:/data -v $(pwd):/backup alpine tar czf /backup/rabbitmq-backup.tar.gz -C /data .
```

### Restore RabbitMQ Data
```bash
docker run --rm -v kurser_rabbitmq_data:/data -v $(pwd):/backup alpine tar xzf /backup/rabbitmq-backup.tar.gz -C /data
```

### Remove Volumes
```bash
docker compose down -v
```

## Network

All services are on `kurser-network` bridge network. They can communicate using container names:
- Backend → RabbitMQ: `rabbitmq:5672`
- Frontend → Backend: Uses host port `localhost:3000`

## File Structure

```
/home/keshav/kurser/
├── docker-compose.yml          # ✅ Main compose file
├── .dockerignore               # ✅ Docker ignore patterns
│
├── main/                       # Backend
│   ├── Dockerfile             # ✅ Backend container config
│   ├── .dockerignore          # ✅ Backend ignore patterns
│   ├── .env                   # ✅ Environment variables
│   ├── src/                   # Source code
│   └── package.json           # Dependencies
│
└── frontend/                   # Frontend
    ├── Dockerfile             # ✅ Frontend container config
    ├── nginx.conf             # ✅ Nginx configuration
    ├── .dockerignore          # ✅ Frontend ignore patterns
    ├── src/                   # React source
    └── package.json           # Dependencies
```

## Summary

Everything is ready! Simply run:

```bash
cd /home/keshav/kurser
docker compose up -d
```

Wait 30 seconds, then open: **http://localhost:3001**

All services will start automatically:
- ✅ RabbitMQ on 5672 & 15672
- ✅ Backend on 3000
- ✅ Frontend on 3001
- ✅ Connected to MongoDB Atlas
- ✅ Fully functional webhook manager

## Quick Commands Reference

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Restart
docker compose restart

# Logs
docker compose logs -f

# Rebuild
docker compose up -d --build

# Status
docker compose ps

# Clean everything
docker compose down -v
```

# Services Setup - Complete Guide

## Current Running Services ✅

### 1. RabbitMQ (Docker)
- **Container**: `rabbitmq`
- **AMQP Port**: 5672
- **Management UI**: http://localhost:15672
- **Credentials**: admin / admin123
- **Status**: ✅ Running

### 2. MongoDB (Docker)
- **Container**: `mongodb`
- **Port**: 27017
- **Credentials**: admin / admin123
- **Status**: ✅ Running

### 3. MongoDB Atlas (Cloud)
- **Currently Using**: MongoDB Atlas
- **Connection String**: Set in .env
- **Status**: ✅ Active

## Environment Configuration

Your `.env` file is configured to use:
- ✅ MongoDB Atlas (Cloud) - Currently active
- ✅ RabbitMQ (Docker) - admin/admin123 credentials
- ✅ GitHub OAuth - Credentials set
- ✅ Frontend URL - http://localhost:3001

## Quick Start

### 1. Check Services Status
```bash
docker ps | grep -E "rabbitmq|mongodb"
```

### 2. Start Backend
```bash
cd /home/keshav/kurser/main
npm run dev
```

### 3. Start Frontend
```bash
cd /home/keshav/kurser/frontend
npm run dev
```

### 4. Open Application
```
http://localhost:3001
```

## Service Management

### Check RabbitMQ
```bash
# Check container
docker ps | grep rabbitmq

# View logs
docker logs rabbitmq

# Access Management UI
# URL: http://localhost:15672
# User: admin
# Pass: admin123
```

### Check MongoDB
```bash
# Check container
docker ps | grep mongodb

# View logs
docker logs mongodb

# Connect with mongosh (if needed)
docker exec -it mongodb mongosh -u admin -p admin123 --authenticationDatabase admin
```

### Restart Services (if needed)
```bash
# Restart RabbitMQ
docker restart rabbitmq

# Restart MongoDB
docker restart mongodb
```

## Switch Between MongoDB Options

### Currently Using: MongoDB Atlas ✅
Your .env is set to use MongoDB Atlas (cloud):
```env
MONGODB_URI=mongodb+srv://thesharmakeshav:TFJUWDRi46dbR5TB@cluster0.kegg0.mongodb.net/kurser?retryWrites=true&w=majority
```

### To Use Local MongoDB Docker Instead:
Edit `/home/keshav/kurser/main/.env`:
```env
# Comment out Atlas
# MONGODB_URI=mongodb+srv://...

# Uncomment local Docker
MONGODB_URI=mongodb://admin:admin123@localhost:27017/kurser?authSource=admin
```

## Complete System Architecture

```
┌─────────────────────────────────────────────┐
│         Frontend (React)                    │
│         http://localhost:3001               │
└─────────────────┬───────────────────────────┘
                  │
                  │ HTTP Requests
                  ▼
┌─────────────────────────────────────────────┐
│         Backend API (Express)               │
│         http://localhost:3000               │
└─────┬──────────────────────┬────────────────┘
      │                      │
      │                      │
      ▼                      ▼
┌─────────────┐      ┌──────────────────┐
│  MongoDB    │      │   RabbitMQ       │
│  Atlas      │      │   (Docker)       │
│  (Cloud)    │      │   Port: 5672     │
│             │      │   UI: 15672      │
└─────────────┘      └──────────────────┘
```

## Verification Commands

```bash
# 1. Check all containers
docker ps

# 2. Test RabbitMQ
curl -u admin:admin123 http://localhost:15672/api/overview

# 3. Test Backend Health
curl http://localhost:3000/health

# 4. Check MongoDB connection (when backend is running)
# Backend will log connection status
```

## Troubleshooting

### RabbitMQ Connection Issues
```bash
# Check if running
docker ps | grep rabbitmq

# Restart if needed
docker restart rabbitmq

# Check logs
docker logs rabbitmq -f
```

### MongoDB Connection Issues
```bash
# If using Atlas - check internet connection
ping cluster0.kegg0.mongodb.net

# If using local Docker
docker ps | grep mongodb
docker restart mongodb
```

### Backend Won't Start
```bash
# Verify .env file
cat /home/keshav/kurser/main/.env | grep -E "MONGODB|RABBITMQ"

# Check if ports are free
netstat -tulpn | grep -E "3000|5672"

# Rebuild
cd /home/keshav/kurser/main
npm run build
```

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3001 | - |
| Backend API | http://localhost:3000 | JWT Token |
| RabbitMQ Management | http://localhost:15672 | admin / admin123 |
| Backend Health | http://localhost:3000/health | Public |
| MongoDB | Atlas Cloud | In .env |
| MongoDB Local | localhost:27017 | admin / admin123 |

## Everything is Ready! 🚀

All services are configured and running. Simply:

1. **Terminal 1**: `cd /home/keshav/kurser/main && npm run dev`
2. **Terminal 2**: `cd /home/keshav/kurser/frontend && npm run dev`
3. **Browser**: Open http://localhost:3001

Start testing all APIs through the React UI!

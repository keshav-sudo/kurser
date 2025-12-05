# Complete Testing Guide

## Prerequisites Checklist

### 1. Environment Variables (.env file)
Ensure your `.env` file in `/home/keshav/kurser/main/` has:
```env
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/kurser

# RabbitMQ (Docker is running on port 5672)
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_QUEUE=webhook-events

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

# JWT
JWT_SECRET=your_jwt_secret_key_change_this

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

### 2. Services Status
✅ **RabbitMQ**: Running in Docker on port 5672
- Container: `rabbitmq`
- Management UI: http://localhost:15672 (guest/guest)
- AMQP Port: 5672

⚠️ **MongoDB**: Needs to be running on port 27017
```bash
# Check if MongoDB is running
sudo systemctl status mongod
# OR if using Docker:
docker ps | grep mongo
```

### 3. Dependencies Cleaned
✅ **Removed unused dependencies**:
- ❌ Redis/ioredis (removed)
- ❌ Prisma (removed)
- ❌ @types/dotenv (removed)

✅ **Current dependencies** (only what's needed):
- Express, Mongoose, Axios
- JWT, CORS
- RabbitMQ (amqplib)

## Starting the Application

### 1. Start Backend API
```bash
cd /home/keshav/kurser/main
npm run dev
```
Backend will run on: http://localhost:3000

### 2. Start Frontend (React App)
```bash
cd /home/keshav/kurser/frontend
npm run dev
```
Frontend will run on: http://localhost:3001

## Testing All APIs

### Method 1: Using React Frontend (Easiest)

1. Open browser: http://localhost:3001
2. Click "Login with GitHub"
3. Authorize the application
4. You'll be redirected back with a token
5. Use the UI to test all endpoints:
   - ✅ Load Profile
   - ✅ Load Repositories
   - ✅ Setup Webhook
   - ✅ View Tracked Repos
   - ✅ Remove Webhook
   - ✅ Load Webhook Events
   - ✅ Health Check

### Method 2: Using cURL (Manual Testing)

#### 1. Health Check
```bash
curl http://localhost:3000/health
```

#### 2. GitHub Login (Browser)
```bash
# Open in browser:
http://localhost:3000/auth/github
```

#### 3. Get Profile (after login)
```bash
TOKEN="your_jwt_token_from_callback"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/auth/profile
```

#### 4. List GitHub Repositories
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/repos
```

#### 5. List Tracked Repositories
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/repos/tracked
```

#### 6. Setup Webhook
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"repoFullName": "username/repo-name"}' \
  http://localhost:3000/repos/webhook
```

#### 7. Get Webhook Events
```bash
REPO_ID="123456"
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/webhook/events/$REPO_ID?status=completed&limit=20"
```

#### 8. Remove Webhook
```bash
REPO_ID="123456"
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/repos/webhook/$REPO_ID
```

#### 9. Test Webhook Endpoint (Simulate GitHub)
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-GitHub-Delivery: test-delivery-id" \
  -d '{
    "repository": {
      "id": 123456,
      "full_name": "username/repo-name"
    },
    "ref": "refs/heads/main",
    "commits": []
  }' \
  http://localhost:3000/webhook
```

## Monitoring RabbitMQ

### Access RabbitMQ Management UI
```
URL: http://localhost:15672
Username: guest
Password: guest
```

### Check Queue Status
1. Go to "Queues" tab
2. Look for "webhook-events" queue
3. Monitor messages being published and consumed

## Troubleshooting

### Backend won't start
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Check if RabbitMQ Docker is running
docker ps | grep rabbitmq

# Verify .env file exists with correct values
cat /home/keshav/kurser/main/.env
```

### Frontend can't connect to backend
```bash
# Verify backend is running on port 3000
curl http://localhost:3000/health

# Check CORS settings in backend
# Frontend URL should be: http://localhost:3001
```

### GitHub OAuth not working
1. Check GitHub OAuth App settings:
   - Homepage URL: http://localhost:3000
   - Callback URL: http://localhost:3000/auth/github/callback
2. Verify GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env
3. Make sure GITHUB_CALLBACK_URL matches in .env

### RabbitMQ connection fails
```bash
# Check if Docker container is running
docker ps | grep rabbitmq

# Check logs
docker logs rabbitmq

# Restart RabbitMQ if needed
docker restart rabbitmq
```

## Project Structure

```
/home/keshav/kurser/
├── main/                    # Backend API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controller/     # API controllers
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # Express routes
│   │   └── index.ts        # Entry point
│   ├── .env               # Environment variables
│   ├── package.json       # Dependencies (cleaned)
│   └── API.md            # API documentation
│
└── frontend/              # React Testing App
    ├── src/
    │   ├── App.jsx       # Main application
    │   └── App.css       # Styles
    ├── vite.config.js    # Vite config (port 3001)
    └── package.json      # Frontend dependencies
```

## Quick Start Commands

```bash
# Terminal 1: Start Backend
cd /home/keshav/kurser/main && npm run dev

# Terminal 2: Start Frontend
cd /home/keshav/kurser/frontend && npm run dev

# Terminal 3: Monitor RabbitMQ (optional)
docker logs -f rabbitmq

# Terminal 4: Test API
curl http://localhost:3000/health
```

## Verification Checklist

- [ ] RabbitMQ Docker container running (port 5672)
- [ ] MongoDB running (port 27017)
- [ ] Backend API running (port 3000)
- [ ] Frontend app running (port 3001)
- [ ] .env file configured with GitHub OAuth credentials
- [ ] Can access frontend at http://localhost:3001
- [ ] Can perform GitHub login
- [ ] Can load repositories
- [ ] Can setup webhooks
- [ ] Can view webhook events
- [ ] RabbitMQ queue receives messages

## Notes

- **No Redis**: Redis dependency has been completely removed as it's not used
- **No Prisma**: Prisma has been removed, using Mongoose for MongoDB
- **Clean Dependencies**: Only essential packages are included
- **Synchronized Setup**: Frontend and backend work together seamlessly
- **Complete API Coverage**: All endpoints can be tested via React UI

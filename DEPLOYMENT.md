# Kurser Deployment Guide 🚀

Complete guide to deploy Kurser using various platforms.

## Deployment Options

1. **Railway** (Recommended for beginners)
2. **Render**
3. **Fly.io**
4. **DigitalOcean App Platform**
5. **Docker/VPS**
6. **Kubernetes**

---

## 1. Railway Deployment (Easiest) 🚂

Railway automatically detects Nixpacks and deploys with zero configuration.

### Prerequisites
- Railway account (free tier available)
- GitHub repository

### Steps

#### A. Deploy via Railway Dashboard

1. **Visit Railway**: https://railway.app
2. **Connect GitHub**: Link your repository
3. **Create New Project**: Click "New Project"
4. **Deploy from GitHub**: Select your `kurser` repo

#### B. Deploy Each Service

Railway will create 4 services:

**1. Redis Service**
```bash
# Click "New" → "Database" → "Redis"
# Railway automatically provisions Redis
```

**2. Main API Service**
```bash
# Click "New" → "GitHub Repo" → Select "main" folder
# Add environment variables:
```

Environment Variables for Main:
```
MONGODB_URI=your_mongodb_uri
REDIS_HOST=${{Redis.RAILWAY_PRIVATE_DOMAIN}}
REDIS_PORT=${{Redis.RAILWAY_TCP_PROXY_PORT}}
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=https://your-main-service.railway.app/auth/github/callback
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://your-frontend.railway.app
PUBLIC_URL=https://your-main-service.railway.app
```

**3. Worker Service**
```bash
# Click "New" → "GitHub Repo" → Select "worker" folder
```

Environment Variables for Worker:
```
REDIS_HOST=${{Redis.RAILWAY_PRIVATE_DOMAIN}}
REDIS_PORT=${{Redis.RAILWAY_TCP_PROXY_PORT}}
WORKER_CONCURRENCY=5
MONGODB_URI=your_mongodb_uri
MAIN_API_URL=${{main.RAILWAY_PRIVATE_DOMAIN}}:3000
CLONE_DIR=/tmp/kurser-repos
```

**4. Frontend Service**
```bash
# Click "New" → "GitHub Repo" → Select "frontend" folder
```

Environment Variables for Frontend:
```
VITE_API_URL=https://your-main-service.railway.app
```

#### C. Scale Workers

```bash
# In Railway dashboard, go to Worker service
# Settings → Replicas → Set to 3
```

### Railway CLI Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link services
cd main && railway link
cd ../worker && railway link
cd ../frontend && railway link

# Deploy
railway up
```

---

## 2. Render Deployment 🎨

### Steps

1. **Create Redis Instance**
   - New → Redis
   - Free tier available

2. **Deploy Main API**
   - New → Web Service
   - Connect GitHub repo
   - Root Directory: `main`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Add environment variables

3. **Deploy Worker**
   - New → Background Worker
   - Root Directory: `worker`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Add environment variables

4. **Deploy Frontend**
   - New → Static Site
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

### render.yaml (Auto-deploy)

Create `render.yaml` in project root:

```yaml
services:
  - type: redis
    name: kurser-redis
    ipAllowList: []
    plan: free

  - type: web
    name: kurser-main
    runtime: node
    buildCommand: cd main && npm install && npm run build
    startCommand: cd main && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: REDIS_HOST
        fromService:
          name: kurser-redis
          type: redis
          property: host
      - key: REDIS_PORT
        fromService:
          name: kurser-redis
          type: redis
          property: port
      - key: MONGODB_URI
        sync: false
      - key: GITHUB_CLIENT_ID
        sync: false
      - key: GITHUB_CLIENT_SECRET
        sync: false

  - type: worker
    name: kurser-worker
    runtime: node
    buildCommand: cd worker && npm install && npm run build
    startCommand: cd worker && npm start
    envVars:
      - key: REDIS_HOST
        fromService:
          name: kurser-redis
          type: redis
          property: host
      - key: WORKER_CONCURRENCY
        value: 5

  - type: web
    name: kurser-frontend
    runtime: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/dist
```

---

## 3. Fly.io Deployment ✈️

### Prerequisites
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login
```

### Deploy Steps

**1. Create fly.toml files**

`main/fly.toml`:
```toml
app = "kurser-main"

[build]
  builder = "paketobuildpacks/builder:base"
  buildpacks = ["gcr.io/paketo-buildpacks/nodejs"]

[env]
  PORT = "8080"

[[services]]
  http_checks = []
  internal_port = 8080
  protocol = "tcp"
  
  [[services.ports]]
    port = 80
    handlers = ["http"]
  
  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

`worker/fly.toml`:
```toml
app = "kurser-worker"

[build]
  builder = "paketobuildpacks/builder:base"
  buildpacks = ["gcr.io/paketo-buildpacks/nodejs"]

[env]
  WORKER_CONCURRENCY = "5"

[deploy]
  strategy = "immediate"
```

**2. Create Redis**
```bash
fly redis create kurser-redis
```

**3. Deploy Services**
```bash
# Deploy main
cd main
fly deploy

# Deploy worker
cd ../worker
fly scale count 3  # Scale to 3 workers
fly deploy

# Deploy frontend
cd ../frontend
fly deploy
```

---

## 4. DigitalOcean App Platform 🌊

### Steps

1. **Create App**
   - Go to App Platform
   - Connect GitHub repo

2. **Add Components**

**Redis:**
- Add Database → Redis

**Main API:**
- Type: Web Service
- Source Directory: `main`
- Build Command: `npm install && npm run build`
- Run Command: `npm start`
- HTTP Port: 3000

**Worker:**
- Type: Worker
- Source Directory: `worker`
- Build Command: `npm install && npm run build`
- Run Command: `npm start`
- Instance Count: 3

**Frontend:**
- Type: Static Site
- Source Directory: `frontend`
- Build Command: `npm install && npm run build`
- Output Directory: `dist`

3. **Add Environment Variables** in App Platform dashboard

---

## 5. Docker Compose (VPS) 🐳

### Prerequisites
- VPS with Docker installed
- Domain name (optional)

### Steps

1. **Clone Repository**
```bash
git clone https://github.com/your-username/kurser.git
cd kurser
```

2. **Configure Environment**
```bash
cp main/.env.example main/.env
cp worker/.env.example worker/.env

# Edit .env files with your values
nano main/.env
nano worker/.env
```

3. **Deploy**
```bash
# Build and start
docker-compose up -d --build

# Scale workers
docker-compose up -d --scale worker=5

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

4. **Setup Nginx (Optional)**

`/etc/nginx/sites-available/kurser`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/kurser /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. **SSL with Certbot**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 6. Kubernetes (Production Scale) ☸️

### Deploy to Kubernetes

**1. Create namespace**
```bash
kubectl create namespace kurser
```

**2. Deploy Redis**
```bash
kubectl apply -f k8s/redis.yaml
```

`k8s/redis.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: kurser
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: kurser
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
```

**3. Deploy Main API**
```bash
kubectl apply -f k8s/main.yaml
```

**4. Deploy Workers with Auto-scaling**
```bash
kubectl apply -f k8s/worker.yaml
```

`k8s/worker.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kurser-worker
  namespace: kurser
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kurser-worker
  template:
    metadata:
      labels:
        app: kurser-worker
    spec:
      containers:
      - name: worker
        image: your-registry/kurser-worker:latest
        env:
        - name: REDIS_HOST
          value: "redis"
        - name: WORKER_CONCURRENCY
          value: "5"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: kurser-worker-hpa
  namespace: kurser
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: kurser-worker
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## Environment Variables Reference 📝

### Main API
```bash
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb://...
REDIS_HOST=redis
REDIS_PORT=6379
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=https://your-domain.com/auth/github/callback
JWT_SECRET=...
FRONTEND_URL=https://your-frontend.com
PUBLIC_URL=https://your-api.com
```

### Worker
```bash
REDIS_HOST=redis
REDIS_PORT=6379
WORKER_CONCURRENCY=5
WORKER_NAME=worker-1
MONGODB_URI=mongodb://...
CLONE_DIR=/tmp/kurser-repos
MAIN_API_URL=http://main:3000
```

### Frontend
```bash
VITE_API_URL=https://your-api.com
```

---

## Post-Deployment Checklist ✅

- [ ] All services running
- [ ] Redis connected
- [ ] MongoDB connected
- [ ] GitHub OAuth configured
- [ ] Environment variables set
- [ ] SSL certificates installed
- [ ] Domain names configured
- [ ] Worker scaling tested
- [ ] Webhooks working
- [ ] Monitoring setup
- [ ] Backup strategy in place

---

## Monitoring & Scaling 📊

### Health Checks

**Main API:**
```bash
curl https://your-api.com/health
```

**Worker:**
```bash
# Check Redis queue
redis-cli -h your-redis-host LLEN bull:webhook-events:wait
```

### Scale Workers

**Railway:**
```bash
# Dashboard → Worker Service → Settings → Replicas
```

**Docker Compose:**
```bash
docker-compose up -d --scale worker=10
```

**Kubernetes:**
```bash
kubectl scale deployment kurser-worker --replicas=10 -n kurser
```

---

## Cost Optimization 💰

### Free Tier Recommendations

**For < 100 repositories:**
- Railway: Free tier
- 1 worker instance
- Redis: 25MB free

**For 100-500 repositories:**
- Render/Railway: $7-15/month
- 2-3 worker instances
- Redis: 100MB

**For 500+ repositories:**
- DigitalOcean/AWS: $20-50/month
- 5-10 worker instances
- Redis: 1GB
- Consider Azure Queues

---

## Troubleshooting 🔧

### Common Issues

**1. Workers not connecting to Redis**
```bash
# Check Redis URL
echo $REDIS_HOST

# Test connection
redis-cli -h $REDIS_HOST ping
```

**2. GitHub OAuth not working**
```bash
# Verify callback URL matches GitHub app settings
# Must be: https://your-domain.com/auth/github/callback
```

**3. Workers running but not processing**
```bash
# Check queue has jobs
redis-cli KEYS bull:*

# Check worker logs
docker logs kurser-worker-1
```

---

## Support & Resources 📚

- **Railway Docs**: https://docs.railway.app
- **Nixpacks Docs**: https://nixpacks.com
- **BullMQ Docs**: https://docs.bullmq.io
- **Redis Cloud**: https://redis.com (free 30MB)
- **MongoDB Atlas**: https://mongodb.com (free 512MB)

---

## Next Steps 🎯

1. Choose deployment platform
2. Set up environment variables
3. Deploy services
4. Configure GitHub OAuth
5. Test webhook delivery
6. Monitor and scale as needed

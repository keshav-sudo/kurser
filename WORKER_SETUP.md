# Kurser Worker Setup Guide 🚀

Complete guide to set up and scale the Kurser worker service.

## Quick Start ⚡

### 1. Start Services with Docker Compose

```bash
# Start all services (includes Redis, Main API, Worker, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f worker

# Check status
docker-compose ps
```

### 2. Verify Worker is Running

```bash
# Check worker logs
docker-compose logs worker

# Should see:
# ✅ BullMQ connected to Redis
# 🚀 Webhook worker started
# 🚀 Repo clone worker started
# 🚀 Repo analysis worker started
```

### 3. Test the System

1. **Add a repository** via the frontend
2. **Worker automatically clones** the repository
3. **Analysis runs** and processes the code
4. **Check logs** to see processing:

```bash
docker-compose logs -f worker
```

## Configuration 🛠️

### Environment Variables

Create `worker/.env`:

```bash
# Redis (Required)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Worker Settings
WORKER_CONCURRENCY=5        # Jobs per worker
WORKER_NAME=kurser-worker-1 # Unique worker name

# MongoDB
MONGODB_URI=mongodb://localhost:27017/kurser

# Repository Storage
CLONE_DIR=/tmp/kurser-repos

# Main API
MAIN_API_URL=http://main:3000

# Optional: Azure Storage Queue
AZURE_STORAGE_CONNECTION_STRING=
```

### Main API Configuration

Update `main/.env`:

```bash
# Add Redis configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Scaling Workers 📈

### Option 1: Docker Compose Scale (Easiest)

Scale to 3 workers:

```bash
docker-compose up -d --scale worker=3
```

Check all workers:

```bash
docker-compose ps worker
```

### Option 2: Manual Worker Instances

Run additional workers:

```bash
# Worker 2
docker run -d \
  --name kurser-worker-2 \
  --env-file worker/.env \
  -e WORKER_NAME=kurser-worker-2 \
  --network kurser_kurser-network \
  kurser-worker

# Worker 3
docker run -d \
  --name kurser-worker-3 \
  --env-file worker/.env \
  -e WORKER_NAME=kurser-worker-3 \
  --network kurser_kurser-network \
  kurser-worker
```

### Option 3: Kubernetes (Production)

Create `k8s/worker-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kurser-worker
spec:
  replicas: 5  # Start with 5 workers
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
        image: kurser-worker:latest
        env:
        - name: REDIS_HOST
          value: "redis-service"
        - name: REDIS_PORT
          value: "6379"
        - name: WORKER_CONCURRENCY
          value: "5"
        - name: MAIN_API_URL
          value: "http://main-service:3000"
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
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: kurser-worker
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

Deploy:

```bash
kubectl apply -f k8s/worker-deployment.yaml
```

### Option 4: Auto-Scaling with Metrics

Based on queue length:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: kurser-worker-queue-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: kurser-worker
  minReplicas: 2
  maxReplicas: 20
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 4
        periodSeconds: 30
      selectPolicy: Max
```

## Monitoring 📊

### 1. Redis Queue Status

Check queue depth:

```bash
docker exec -it kurser-redis redis-cli

# Check webhook queue
LLEN bull:webhook-events:wait

# Check clone queue
LLEN bull:repo-clone:wait

# Check analysis queue
LLEN bull:repo-analysis:wait
```

### 2. Worker Logs

```bash
# All workers
docker-compose logs -f worker

# Specific worker
docker logs -f kurser-worker-1
```

### 3. Bull Board Dashboard (Optional)

Install Bull Board for visual monitoring:

```bash
npm install -g @bull-board/api @bull-board/express
```

Add to `main/src/index.ts`:

```typescript
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(webhookQueue),
    new BullMQAdapter(repoCloneQueue),
    new BullMQAdapter(repoAnalysisQueue),
  ],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

Access at: `http://localhost:3000/admin/queues`

## Performance Tuning ⚡

### Worker Concurrency

```bash
# Light load (< 100 repos)
WORKER_CONCURRENCY=3

# Medium load (100-500 repos)
WORKER_CONCURRENCY=5

# Heavy load (500+ repos)
WORKER_CONCURRENCY=10
```

### Redis Optimization

```bash
# Increase Redis memory (docker-compose.yml)
redis:
  image: redis:7-alpine
  command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
```

### Repository Cleanup

Automatically cleanup old clones:

Add to `worker/src/utils/cleanup.ts`:

```typescript
import { promises as fs } from 'fs';
import path from 'path';
import { config } from '../config/env';

export async function cleanupOldRepos(maxAgeDays: number = 7) {
  const now = Date.now();
  const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
  
  const repos = await fs.readdir(config.cloneDir);
  
  for (const repo of repos) {
    const repoPath = path.join(config.cloneDir, repo);
    const stats = await fs.stat(repoPath);
    
    if (now - stats.mtimeMs > maxAge) {
      await fs.rm(repoPath, { recursive: true });
      console.log(`🧹 Cleaned up old repo: ${repo}`);
    }
  }
}

// Run every 24 hours
setInterval(() => cleanupOldRepos(), 24 * 60 * 60 * 1000);
```

## Scaling Guidelines 📏

### Small Scale (0-100 repos)

```yaml
workers: 1
concurrency: 5
redis_memory: 256MB
```

### Medium Scale (100-500 repos)

```yaml
workers: 2-3
concurrency: 5
redis_memory: 512MB
```

### Large Scale (500-2000 repos)

```yaml
workers: 5-10
concurrency: 5-10
redis_memory: 1-2GB
```

### Enterprise Scale (2000+ repos)

```yaml
workers: 10-20+
concurrency: 10
redis_memory: 4GB+
azure_queues: enabled
kubernetes: auto-scaling enabled
```

## Azure Queue Integration ☁️

For massive scale, use Azure Storage Queues:

### Setup

1. Create Azure Storage Account:
   ```bash
   az storage account create \
     --name kurserqueue \
     --resource-group kurser \
     --location eastus \
     --sku Standard_LRS
   ```

2. Get connection string:
   ```bash
   az storage account show-connection-string \
     --name kurserqueue \
     --resource-group kurser
   ```

3. Add to `worker/.env`:
   ```bash
   AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
   ```

### Benefits

- **Throughput**: 20,000 messages/sec vs Redis 10,000/sec
- **Retention**: 7 days vs Redis memory-based
- **Reliability**: 99.9% SLA with geo-redundancy
- **Cost**: $0.00036 per 10,000 operations

## Troubleshooting 🔧

### Worker Not Starting

```bash
# Check Redis
docker-compose ps redis
docker exec -it kurser-redis redis-cli ping

# Check worker logs
docker-compose logs worker

# Restart worker
docker-compose restart worker
```

### Jobs Not Processing

```bash
# Check queue has jobs
docker exec -it kurser-redis redis-cli
KEYS bull:*

# Verify worker is connected
docker-compose logs worker | grep "connected"

# Check for errors
docker-compose logs worker | grep "ERROR"
```

### High Memory Usage

```bash
# Check worker memory
docker stats kurser-worker-1

# Reduce concurrency
docker-compose down
# Edit docker-compose.yml: WORKER_CONCURRENCY=3
docker-compose up -d
```

### Slow Processing

```bash
# Add more workers
docker-compose up -d --scale worker=5

# Increase concurrency
WORKER_CONCURRENCY=10 docker-compose up -d
```

## Development Mode 🛠️

Run worker locally for development:

```bash
cd worker

# Copy env file
cp .env.example .env

# Edit .env for local setup
REDIS_HOST=localhost
REDIS_PORT=6379
MAIN_API_URL=http://localhost:3000

# Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Run worker
npm run dev
```

## Production Checklist ✅

Before deploying to production:

- [ ] Redis persistence enabled
- [ ] Worker replicas set (minimum 2)
- [ ] Health checks configured
- [ ] Monitoring/alerting setup
- [ ] Log aggregation configured
- [ ] Auto-scaling rules defined
- [ ] Backup strategy for Redis
- [ ] GitHub token with appropriate permissions
- [ ] MongoDB connection secured
- [ ] Resource limits set
- [ ] Environment variables secured

## Next Steps 🎯

1. **Monitor Performance**: Set up dashboards and alerts
2. **Optimize Costs**: Adjust worker count based on usage
3. **Add Features**: Extend processors for custom analysis
4. **Scale Horizontally**: Add workers as load increases
5. **Enable Azure**: For enterprise-level throughput

## Support 💬

For issues or questions:
1. Check worker logs: `docker-compose logs worker`
2. Review Redis queue: `redis-cli KEYS bull:*`
3. Check main API connection
4. Verify environment variables

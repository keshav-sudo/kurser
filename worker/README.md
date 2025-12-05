# Kurser Worker Service 🚀

Scalable worker service for processing GitHub webhooks, repository cloning, and analysis using BullMQ and Redis.

## Features ✨

- **Queue-based Processing**: Uses BullMQ with Redis for reliable job processing
- **Multiple Worker Types**: Webhook processing, repository cloning, and code analysis
- **Horizontal Scaling**: Run multiple worker instances to handle increased load
- **Azure Queue Support**: Optional integration with Azure Storage Queues for enterprise scale
- **Repository Management**: Automatic cloning, pulling, and analysis of repositories
- **Retry Logic**: Exponential backoff for failed jobs
- **Job Monitoring**: Track job status and execution history

## Architecture 🏗️

```
GitHub Webhook → Main API → Redis Queue → Worker(s) → Process Jobs
                                           ↓
                                    - Clone Repos
                                    - Analyze Code
                                    - Update Database
```

### Queue Types

1. **webhook-events**: Processes GitHub webhook events (push, PR, issues, etc.)
2. **repo-clone**: Handles repository cloning and pulling
3. **repo-analysis**: Analyzes repository structure and code

## Setup 🛠️

### Prerequisites

- Node.js 18+
- Redis 6+
- Git
- MongoDB (for storing results)

### Installation

```bash
cd worker
npm install
```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Redis Configuration (Required)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Worker Configuration
WORKER_CONCURRENCY=5
WORKER_NAME=kurser-worker-1

# MongoDB
MONGODB_URI=mongodb://localhost:27017/kurser

# Repository Clone Directory
CLONE_DIR=/tmp/kurser-repos

# GitHub Token (for private repos)
GITHUB_TOKEN=

# Main API URL
MAIN_API_URL=http://localhost:3000

# Azure Storage Queue (Optional - for high scale)
AZURE_STORAGE_CONNECTION_STRING=
```

## Running the Worker 🏃

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t kurser-worker .
docker run -d \
  --name kurser-worker-1 \
  --env-file .env \
  kurser-worker
```

### Docker Compose

Worker is included in the main `docker-compose.yml`:

```bash
docker-compose up -d worker
```

## Scaling Workers 📈

### Method 1: Docker Compose (Recommended)

Scale to multiple workers:

```bash
docker-compose up -d --scale worker=3
```

### Method 2: Kubernetes

Deploy using Kubernetes for auto-scaling:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kurser-worker
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
        image: kurser-worker:latest
        env:
        - name: REDIS_HOST
          value: "redis-service"
        - name: WORKER_CONCURRENCY
          value: "5"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

### Method 3: Manual Instances

Run multiple worker instances:

```bash
# Terminal 1
WORKER_NAME=worker-1 npm start

# Terminal 2
WORKER_NAME=worker-2 npm start

# Terminal 3
WORKER_NAME=worker-3 npm start
```

## Worker Configuration ⚙️

### Concurrency

Control how many jobs each worker processes simultaneously:

```bash
WORKER_CONCURRENCY=5  # Process 5 jobs at once
```

Adjust based on:
- CPU cores available
- Memory constraints
- I/O operations (cloning repos, etc.)

### Queue Priorities

Workers process jobs in this order:
1. Webhook events (highest priority)
2. Repository analysis
3. Repository cloning

## Monitoring 📊

### Queue Dashboard

Access BullMQ dashboard (if installed):

```bash
npm install -g bull-board
bull-board --redis=redis://localhost:6379
```

### Logs

View worker logs:

```bash
docker-compose logs -f worker
```

### Metrics

Monitor these key metrics:
- Jobs processed per minute
- Queue depth
- Failed job rate
- Average processing time

## Azure Integration ☁️

For enterprise scale, integrate with Azure Storage Queues:

### Setup

1. Create Azure Storage Account
2. Get connection string
3. Add to `.env`:

```bash
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
```

### Benefits

- Higher throughput (up to 20,000 messages/sec)
- Longer message retention (7 days)
- Geographic redundancy
- Built-in monitoring

## Job Processing Flow 🔄

### 1. Webhook Event Processing

```
Webhook → Queue → Worker → Process Event → Trigger Clone Job
```

### 2. Repository Clone

```
Clone Job → Worker → Git Clone/Pull → Trigger Analysis Job
```

### 3. Repository Analysis

```
Analysis Job → Worker → Scan Files → Count Lines → Detect Type → Save Results
```

## Error Handling 🔧

### Retry Strategy

- **Webhook events**: 3 attempts with exponential backoff (2s, 4s, 8s)
- **Repo clone**: 2 attempts with 5s delay
- **Repo analysis**: 2 attempts with 3s delay

### Failed Jobs

Failed jobs are:
- Logged to console
- Stored in Redis for 7 days
- Available for manual retry

## Best Practices 💡

### 1. Resource Management

- Use `CLONE_DIR` on fast storage (SSD)
- Clean up old cloned repositories
- Monitor disk space

### 2. Scaling Strategy

Start with:
- 1 worker with concurrency 5 for < 100 repos
- 2-3 workers for 100-500 repos
- 5+ workers for 500+ repos
- Add Azure Queues for 1000+ repos

### 3. Performance Tuning

```bash
# Light workload
WORKER_CONCURRENCY=3

# Medium workload
WORKER_CONCURRENCY=5

# Heavy workload
WORKER_CONCURRENCY=10
```

### 4. Monitoring

Set up alerts for:
- Queue depth > 100
- Failed job rate > 5%
- Worker downtime

## Troubleshooting 🔍

### Worker Not Processing Jobs

1. Check Redis connection:
   ```bash
   redis-cli ping
   ```

2. Verify queue has jobs:
   ```bash
   redis-cli KEYS bull:webhook-events:*
   ```

3. Check worker logs:
   ```bash
   docker-compose logs worker
   ```

### High Memory Usage

- Reduce `WORKER_CONCURRENCY`
- Enable repository cleanup after analysis
- Increase worker instances, decrease concurrency per instance

### Jobs Failing

- Check GitHub token permissions
- Verify MongoDB connection
- Ensure sufficient disk space for clones

## API Integration 🔌

Workers automatically integrate with the main API for:
- Updating job status
- Storing analysis results
- Reporting errors

No additional configuration needed.

## Development 👨‍💻

### Project Structure

```
worker/
├── src/
│   ├── config/          # Configuration files
│   │   ├── env.ts       # Environment variables
│   │   └── queue.ts     # Queue setup
│   ├── processors/      # Job processors
│   │   ├── webhookProcessor.ts
│   │   ├── repoCloneProcessor.ts
│   │   └── repoAnalysisProcessor.ts
│   ├── workers/         # Worker definitions
│   │   ├── webhookWorker.ts
│   │   ├── repoCloneWorker.ts
│   │   └── repoAnalysisWorker.ts
│   ├── services/        # External services
│   │   ├── gitService.ts
│   │   └── azureQueueService.ts
│   └── index.ts         # Main entry point
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Adding New Job Types

1. Create processor in `src/processors/`
2. Create worker in `src/workers/`
3. Register worker in `src/index.ts`
4. Add queue in `src/config/queue.ts`

## License 📄

ISC

# ✅ Multi-Deploy System - READY TO USE

## 🎉 What's Been Built

Tumhare liye complete **Vercel-style deployment system** ready hai with:

### ✨ Features
- ✅ **Multiple deploys** - har commit ka separate folder
- ✅ **Deploy history** - sab previous versions saved
- ✅ **Preview URLs** - `deployId.domain.com` format
- ✅ **Instant rollback** - symlink change = instant switch 🔥
- ✅ **Auto-build** - Vite, Next.js, CRA automatic detection
- ✅ **Build logs** - full visibility of build process
- ✅ **Worker queue** - scalable background processing

---

## 📦 Blob Structure (Exactly as Requested)

```
Azure Blob Container: deployments

/projects
   /project123
      /deploys
         /1733234567-a8b9c
            index.html
            /static/*
         /1733235890-x9y2z
            index.html
            /static/*
         /latest → symlink
```

---

## 🚀 Quick Start

### 1. Start Services

```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Redis
redis-server

# Terminal 3: Main API
cd main
npm run dev

# Terminal 4: Worker
cd worker
npm run dev
```

### 2. Mount Azure Blob

```bash
./azure-blob-mount.sh
# Updates AZURE_STORAGE_ACCOUNT_NAME and KEY in script first
```

### 3. Configure Nginx

```bash
sudo cp nginx-deploy-config.conf /etc/nginx/sites-available/deployments
sudo ln -s /etc/nginx/sites-available/deployments /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔥 Deploy Your First Project

### Via Webhook (Automatic)
```bash
# Just push to main branch
git push origin main

# Worker automatically:
# 1. Detects push event
# 2. Clones repo
# 3. Runs npm install
# 4. Runs npm run build
# 5. Uploads to Azure Blob
# 6. Creates preview URL
```

### Via API (Manual)
```bash
curl -X POST http://localhost:3000/api/projects/PROJECT_ID/deploy \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "main",
    "commitSha": "abc123"
  }'
```

---

## 🎯 How It Works

### Deployment Flow:
```
GitHub Push/API Request
    ↓
Main API creates Deployment record (status: queued)
    ↓
Job added to Redis queue (BullMQ)
    ↓
Worker picks up job
    ↓
1. Clone repo (simple-git)
2. Detect framework (auto)
3. npm install
4. npm run build
5. Upload to Azure Blob (projects/{id}/deploys/{deployId}/)
    ↓
Status updated: ready
    ↓
Preview URL live: https://deployId.domain.com
```

### Rollback Flow:
```
User clicks "Set as Latest"
    ↓
API updates DB: isLatest = true
    ↓
Update symlink: latest → deployId
    ↓
LIVE INSTANTLY (no rebuild!)
```

---

## 🌍 Nginx Routing Magic

### Production Domain:
```nginx
server_name example.com;
location / {
    alias /mnt/azure-blob/deployments/projects/PROJECT_ID/deploys/latest/;
}
```
Serves current live version via `latest` symlink

### Preview URLs:
```nginx
server_name ~^(?<deploy_id>[a-zA-Z0-9\-]+)\.example\.com$;
location / {
    alias /mnt/azure-blob/deployments/projects/PROJECT_ID/deploys/$deploy_id/;
}
```
Dynamic subdomain routing per deploy

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects/:id/deploy` | POST | Create new deployment |
| `/api/projects/:id/deployments` | GET | List all deployments |
| `/api/deployments/:deployId` | GET | Get deployment details |
| `/api/deployments/:deployId` | PATCH | Update deployment (worker) |
| `/api/deployments/:deployId/set-latest` | POST | Promote to live |
| `/api/deployments/:deployId` | DELETE | Delete deployment |
| `/api/deployments/:deployId/logs` | GET | View build logs |

---

## 🗄️ Database Models

### Deployment Model
```typescript
{
  projectId: ObjectId,
  deployId: string,        // unique ID
  commitSha: string,
  branch: string,
  status: 'queued' | 'building' | 'uploading' | 'ready' | 'failed',
  isLatest: boolean,       // which one is live
  previewUrl: string,
  buildLog: string,
  errorLog: string,
  azurePath: string,       // projects/{id}/deploys/{deployId}
  buildTime: number
}
```

### Repository Model (Updated)
```typescript
{
  ...existing fields,
  domain: string,          // custom domain
  buildCommand: string,    // npm run build
  buildDir: string,        // dist
  installCommand: string   // npm install
}
```

---

## 🔄 Auto-Detection

Worker automatically detects framework:

```typescript
// Checks package.json dependencies
{
  'vite': 'npm run build' → 'dist/',
  'next': 'npm run build' → 'out/',
  'react-scripts': 'npm run build' → 'build/',
  '@angular/core': 'npm run build' → 'dist/'
}

// Also detects package manager
{
  'yarn.lock': 'yarn',
  'pnpm-lock.yaml': 'pnpm',
  default: 'npm'
}
```

---

## 🧪 Testing

```bash
# Test deployment
./test-deployment.sh http://localhost:3000 YOUR_JWT PROJECT_ID

# Manual rollback test
./manage-latest-deploy.sh PROJECT_ID DEPLOY_ID
```

---

## 📁 New Files Created

### Worker:
- ✅ `src/services/buildService.ts` - Build orchestration
- ✅ `src/services/azureBlobService.ts` - Azure upload
- ✅ `src/processors/deploymentProcessor.ts` - Main deployment logic
- ✅ `src/workers/deploymentWorker.ts` - Queue worker
- ✅ Updated `src/config/queue.ts` - Added deployment queue
- ✅ Updated `src/processors/webhookProcessor.ts` - Auto-deploy on push

### Main API:
- ✅ `src/models/Deployment.ts` - Deployment schema
- ✅ `src/controller/deploymentController.ts` - API logic
- ✅ `src/routes/deploymentRoutes.ts` - Routes
- ✅ Updated `src/models/Repository.ts` - Build config fields
- ✅ Updated `src/config/bullmq.ts` - Deployment queue
- ✅ Updated `src/index.ts` - Registered routes

### Scripts & Config:
- ✅ `azure-blob-mount.sh` - Mount blob storage
- ✅ `manage-latest-deploy.sh` - Rollback script
- ✅ `nginx-deploy-config.conf` - Nginx routing
- ✅ `test-deployment.sh` - Testing script
- ✅ `MULTI_DEPLOY_GUIDE.md` - Full documentation

---

## 🎯 Next Steps

1. **Set Environment Variables**
   ```env
   AZURE_STORAGE_CONNECTION_STRING=...
   AZURE_STORAGE_ACCOUNT_NAME=...
   ```

2. **Mount Azure Blob**
   ```bash
   ./azure-blob-mount.sh
   ```

3. **Start Services**
   ```bash
   # Start all 4 services (MongoDB, Redis, Main, Worker)
   ```

4. **Deploy First Project**
   ```bash
   # Push to main branch or use API
   ```

5. **Test Rollback**
   ```bash
   # Create 2 deploys, then switch between them
   ```

---

## 💡 Key Features

### 🔥 Instant Rollback
```bash
# No rebuild needed - just update symlink
./manage-latest-deploy.sh project123 1733234567-a8b9c
# Live in < 1 second!
```

### 🌐 Preview URLs
```
Main branch push → https://1733234567-a8b9c.example.com
PR opened → https://pr-42-1733234567-xyz.example.com
```

### 📊 Full History
```
All deploys saved in blob storage
Can view/rollback to any previous version
Delete old deploys to save space
```

### ⚙️ Per-Project Config
```
Each project can have:
- Custom build command
- Different output directory
- Custom install command
- Custom domain
```

---

## 🎉 System Ready!

Sab kuch implement ho gaya hai exactly jaise tumne manga tha:
- Multiple deploys ✅
- Deploy history ✅
- Preview URLs ✅
- Instant rollback ✅
- Auto-build React/Vite apps ✅
- Azure Blob integration ✅
- Nginx routing ✅

**Just start services aur deploy karo! 🚀**

Full guide: `MULTI_DEPLOY_GUIDE.md`

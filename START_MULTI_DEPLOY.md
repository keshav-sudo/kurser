# 🚀 Quick Start - Multi-Deploy System

## 📋 Prerequisites

```bash
# Required
✓ Node.js 18+
✓ MongoDB
✓ Redis
✓ Azure Storage Account

# Optional (for serving)
✓ Nginx
✓ Linux server with blobfuse2
```

---

## ⚡ 5-Minute Setup

### 1️⃣ Install Dependencies

```bash
# Main API
cd main
npm install
cp .env.example .env
# Edit .env with your values

# Worker
cd ../worker
npm install
cp .env.example .env
# Edit .env with your values
```

### 2️⃣ Configure Environment

**worker/.env:**
```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpoints...
AZURE_STORAGE_ACCOUNT_NAME=youraccount
MONGODB_URI=mongodb://localhost:27017/kurser
REDIS_HOST=localhost
GITHUB_TOKEN=ghp_your_token
MAIN_API_URL=http://localhost:3000
```

**main/.env:**
```env
MONGODB_URI=mongodb://localhost:27017/kurser
REDIS_HOST=localhost
JWT_SECRET=your-secret-key
```

### 3️⃣ Start Services

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

---

## 🎯 First Deployment

### Option A: Via GitHub Webhook (Automatic)

1. **Create repository in your app**
2. **Push to main branch**
3. **Worker automatically builds and deploys**

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

### Option B: Via API (Manual)

```bash
# Get JWT token first (login)
TOKEN="your_jwt_token"
PROJECT_ID="your_project_id"

# Trigger deployment
curl -X POST http://localhost:3000/api/projects/$PROJECT_ID/deploy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "main",
    "commitSha": "HEAD"
  }'

# Response:
{
  "success": true,
  "deployment": {
    "deployId": "1733234567-a8b9c",
    "status": "queued",
    "previewUrl": "https://1733234567-a8b9c.example.com"
  }
}
```

### Option C: Test Script

```bash
./test-deployment.sh http://localhost:3000 YOUR_JWT PROJECT_ID
```

---

## 📊 Monitor Deployment

### Check Status:
```bash
curl http://localhost:3000/api/deployments/DEPLOY_ID \
  -H "Authorization: Bearer $TOKEN"
```

### View Logs:
```bash
curl http://localhost:3000/api/deployments/DEPLOY_ID/logs \
  -H "Authorization: Bearer $TOKEN"
```

### Worker Console:
```
🚀 Starting deployment: 1733234567-a8b9c
   Repo: username/repo
   Branch: main
   Commit: abc123

📦 Step 1: Cloning repository...
✅ Repository cloned

🔨 Step 2: Building project...
🔍 Auto-detecting build configuration...
   Framework: vite
   Build: npm run build
   Output: dist
📦 Installing dependencies...
🔨 Building project...
✅ Build completed in 45s

☁️  Step 3: Uploading to Azure Blob...
✅ Uploaded 127 files

🎉 Deployment successful!
```

---

## 🔥 Test Rollback

```bash
# Deploy first version
curl -X POST .../deploy -d '{"branch": "main"}'
# deployId: 1733234567-aaa

# Make changes, deploy second version
curl -X POST .../deploy -d '{"branch": "main"}'
# deployId: 1733235890-bbb

# Set second as latest
curl -X POST .../deployments/1733235890-bbb/set-latest

# Rollback to first (instant!)
curl -X POST .../deployments/1733234567-aaa/set-latest
```

---

## 🌐 Setup Nginx (Production)

### 1. Mount Azure Blob:
```bash
./azure-blob-mount.sh
# Mounts to: /mnt/azure-blob/deployments
```

### 2. Configure Nginx:
```bash
sudo cp nginx-deploy-config.conf /etc/nginx/sites-available/deployments
sudo ln -s /etc/nginx/sites-available/deployments /etc/nginx/sites-enabled/

# Edit config: Replace PROJECT_ID and domains
sudo nano /etc/nginx/sites-available/deployments

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Setup DNS:
```
A     example.com        → YOUR_SERVER_IP
A     *.example.com      → YOUR_SERVER_IP  (wildcard for previews)
```

### 4. Create "latest" symlink:
```bash
./manage-latest-deploy.sh PROJECT_ID DEPLOY_ID
```

---

## 🎨 Configure Project Build Settings

```bash
# Update project with build config
curl -X PATCH http://localhost:3000/repos/PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "buildCommand": "npm run build",
    "installCommand": "npm install",
    "buildDir": "dist",
    "domain": "myapp.com"
  }'
```

**Auto-detected frameworks:**
- Vite → `npm run build` → `dist/`
- Next.js → `npm run build` → `out/`
- CRA → `npm run build` → `build/`
- Angular → `npm run build` → `dist/`

---

## 📚 API Reference

### Create Deployment
```bash
POST /api/projects/:projectId/deploy
Body: { branch: "main", commitSha: "abc123" }
```

### List Deployments
```bash
GET /api/projects/:projectId/deployments?page=1&limit=20
```

### Get Deployment
```bash
GET /api/deployments/:deployId
```

### Set Latest (Rollback/Promote)
```bash
POST /api/deployments/:deployId/set-latest
```

### Delete Deployment
```bash
DELETE /api/deployments/:deployId
```

### Get Logs
```bash
GET /api/deployments/:deployId/logs
```

---

## 🐛 Troubleshooting

### Worker not processing jobs?
```bash
# Check Redis connection
redis-cli ping

# Check queue
redis-cli
> KEYS *
> LLEN deployments

# Check worker logs
cd worker
npm run dev
```

### Build failing?
```bash
# Check logs
curl .../deployments/DEPLOY_ID/logs

# Common issues:
# - Wrong buildDir (dist vs build vs out)
# - Missing dependencies in package.json
# - Build command incorrect
```

### Azure upload failing?
```bash
# Test connection
az storage blob list \
  --container-name deployments \
  --account-name YOUR_ACCOUNT

# Check environment variables
echo $AZURE_STORAGE_CONNECTION_STRING
```

### Nginx not serving files?
```bash
# Verify mount
ls /mnt/azure-blob/deployments/projects/

# Verify symlink
ls -la /mnt/azure-blob/deployments/projects/PROJECT_ID/deploys/latest

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## 📈 Production Checklist

- [ ] MongoDB replica set or Atlas
- [ ] Redis cluster or managed service
- [ ] Azure Storage with CDN
- [ ] Nginx with SSL (Let's Encrypt)
- [ ] DNS wildcard for preview URLs
- [ ] Environment variables secured
- [ ] Worker auto-restart (PM2/systemd)
- [ ] Monitoring (logs, alerts)
- [ ] Backup strategy

---

## 🎉 You're Ready!

System ab fully functional hai:

✅ **Push to main** → Auto-deploy  
✅ **Open PR** → Preview deploy  
✅ **Multiple versions** in blob storage  
✅ **Instant rollback** via symlink  
✅ **Full build logs** for debugging  

**Detailed docs:** `MULTI_DEPLOY_GUIDE.md`  
**Architecture:** `DEPLOYMENT_READY.md`

**Happy deploying! 🚀**

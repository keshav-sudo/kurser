# 🚀 Multi-Deploy System Guide

Complete system for **Vercel-style deployments** with Azure Blob Storage + Nginx

## 🎯 Features

✅ **Multiple deployments** per project  
✅ **Deploy history** - keep all previous versions  
✅ **Preview URLs** - unique URL for each deploy  
✅ **Instant rollback** - change symlink, no rebuild  
✅ **Auto-build** - Vite, Next.js, CRA, etc.  
✅ **Per-project config** - custom build commands  

---

## 📦 Blob Storage Structure

```
container: deployments

/projects
   /project123
      /deploys
         /1733234567-a8b9c (deploy ID)
            index.html
            /static
               /js
               /css
            /assets
         /1733235890-x9y2z
            index.html
            /static
            /assets
         /latest → symlink to current live deploy
```

**Key Points:**
- Each deploy = separate folder with full build output
- `latest` = symlink pointing to current live version
- Rollback = update symlink, instant switch 🔥

---

## 🔧 Setup Steps

### 1. Install Dependencies

```bash
# Worker needs these for building projects
cd worker
npm install

# Ensure these are in package.json:
# - @azure/storage-blob
# - simple-git
# - bullmq
```

### 2. Configure Environment Variables

**worker/.env:**
```env
# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_ACCOUNT_NAME=youraccount

# Redis for job queue
REDIS_HOST=localhost
REDIS_PORT=6379

# MongoDB
MONGODB_URI=mongodb://localhost:27017/kurser

# GitHub token for private repos
GITHUB_TOKEN=ghp_your_token_here

# Where to clone repos
CLONE_DIR=/tmp/kurser-repos

# Main API URL for status updates
MAIN_API_URL=http://localhost:3000
```

**main/.env:**
```env
MONGODB_URI=mongodb://localhost:27017/kurser
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret
```

### 3. Mount Azure Blob Storage

```bash
# Run the mount script
./azure-blob-mount.sh

# This will:
# - Install blobfuse2 if needed
# - Mount container to /mnt/azure-blob/deployments
# - Make files accessible to Nginx
```

**Verify mount:**
```bash
ls -la /mnt/azure-blob/deployments/projects/
```

### 4. Configure Nginx

```bash
# Copy config
sudo cp nginx-deploy-config.conf /etc/nginx/sites-available/deployments

# Enable site
sudo ln -s /etc/nginx/sites-available/deployments /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

**Update config for your domains:**
- Replace `example.com` with your domain
- Update PROJECT_ID placeholders
- Configure DNS wildcard: `*.example.com` → your server IP

---

## 🚀 Usage

### Create New Deployment

**API Request:**
```bash
curl -X POST http://localhost:3000/api/projects/PROJECT_ID/deploy \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "main",
    "commitSha": "abc123"
  }'
```

**Response:**
```json
{
  "success": true,
  "deployment": {
    "deployId": "1733234567-a8b9c",
    "status": "queued",
    "branch": "main",
    "previewUrl": "https://1733234567-a8b9c.example.com",
    "createdAt": "2024-12-03T10:30:00Z"
  }
}
```

### What Happens:

1. **Queue Job** → Worker picks up deployment
2. **Clone Repo** → Git clone with correct branch
3. **Auto-detect** → Identifies framework (Vite, Next, etc.)
4. **Install** → `npm install` / `yarn` / `pnpm`
5. **Build** → Runs build command
6. **Upload** → All files → Azure Blob
7. **Ready** → Status = `ready`, preview URL is live

---

## 🔄 Rollback / Promote Deploy

### Via API (Instant):

```bash
curl -X POST http://localhost:3000/api/deployments/DEPLOY_ID/set-latest \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This updates:
- Database: `isLatest = true` for new deploy
- Symlink: `latest` → points to new deploy
- **No rebuild needed!** Live instantly 🔥

### Manual (SSH):

```bash
./manage-latest-deploy.sh PROJECT_ID DEPLOY_ID
```

---

## 📋 List Deployments

```bash
curl http://localhost:3000/api/projects/PROJECT_ID/deployments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "deployments": [
    {
      "deployId": "1733234567-a8b9c",
      "status": "ready",
      "branch": "main",
      "commitSha": "abc123",
      "isLatest": true,
      "previewUrl": "https://1733234567-a8b9c.example.com",
      "buildTime": 45,
      "createdAt": "2024-12-03T10:30:00Z"
    },
    {
      "deployId": "1733230000-x9y2z",
      "status": "ready",
      "branch": "develop",
      "isLatest": false,
      "previewUrl": "https://1733230000-x9y2z.example.com",
      "buildTime": 52,
      "createdAt": "2024-12-03T09:15:00Z"
    }
  ]
}
```

---

## 🌍 URL Structure

### Production Domain
```
https://example.com → serves /latest/
```

### Preview URLs
```
https://1733234567-a8b9c.example.com → specific deploy
https://1733230000-x9y2z.example.com → another deploy
```

**Setup DNS:**
```
A     example.com           → YOUR_SERVER_IP
A     *.example.com         → YOUR_SERVER_IP  (wildcard for previews)
```

---

## 🗑️ Delete Deployment

```bash
curl -X DELETE http://localhost:3000/api/deployments/DEPLOY_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Note:** Cannot delete the current latest deployment

---

## 📊 Deployment Logs

```bash
curl http://localhost:3000/api/deployments/DEPLOY_ID/logs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Shows:
- Install output
- Build output
- Error logs (if failed)

---

## ⚙️ Project Configuration

### Update Build Settings:

```bash
curl -X PATCH http://localhost:3000/repos/REPO_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "buildCommand": "npm run build",
    "installCommand": "npm install",
    "buildDir": "dist",
    "domain": "myapp.example.com"
  }'
```

### Framework Auto-Detection:

Worker automatically detects:
- **Vite** → `npm run build` → `dist/`
- **Next.js** → `npm run build` → `out/`
- **Create React App** → `npm run build` → `build/`
- **Angular** → `npm run build` → `dist/`

---

## 🔥 Instant Rollback Example

```bash
# Current latest: 1733234567-a8b9c
# Found bug! Rollback to previous: 1733230000-x9y2z

curl -X POST http://localhost:3000/api/deployments/1733230000-x9y2z/set-latest \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# ✅ Done! Previous version is live in < 1 second
```

---

## 🛠️ Troubleshooting

### Worker not building?

```bash
# Check worker logs
cd worker
npm run dev

# Check queue
redis-cli
> KEYS *
> LLEN deployments
```

### Files not appearing in Nginx?

```bash
# Verify mount
ls /mnt/azure-blob/deployments/projects/

# Verify files uploaded
az storage blob list \
  --container-name deployments \
  --prefix "projects/PROJECT_ID/deploys/" \
  --account-name STORAGE_ACCOUNT
```

### Preview URL 404?

1. Check Nginx config has wildcard domain
2. Verify DNS wildcard record
3. Check deployment status is "ready"
4. Verify files exist in blob path

---

## 📈 Performance Tips

1. **CDN**: Put Cloudflare/Azure CDN in front of Nginx
2. **Caching**: Static assets cached for 1 year
3. **Compression**: Gzip enabled in Nginx
4. **Cleanup**: Delete old deploys to save space
5. **Blob Tier**: Use "Hot" tier for active projects

---

## 🎉 That's It!

You now have:
- Vercel-style multi-deploy system
- Preview URLs for every deploy
- Instant rollback with no rebuild
- Full deploy history
- Auto-detection of frameworks

**Deploy often. Break nothing. Roll back instantly. 🔥**

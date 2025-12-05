# 🚀 Quick Deployment Reference

## Current Status

✅ **Local Setup**:
- Backend API: `http://localhost:3000`
- Frontend Dev: `http://localhost:3001`
- MongoDB: Atlas (Cloud)
- Redis: Docker (localhost:6379)

## Deploy Frontend to Azure Blob Storage

### Option 1: Interactive Script (Easiest)
```bash
./deploy-frontend-azure.sh
```

### Option 2: Manual Steps

```bash
# 1. Login to Azure
az login

# 2. Set variables
STORAGE_ACCOUNT="kurserfrontend"  # Change this (unique globally)
BACKEND_URL="https://your-backend.azurewebsites.net"  # Your backend URL
RESOURCE_GROUP="kurser-rg"

# 3. Create storage account
az group create --name $RESOURCE_GROUP --location eastus
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

# 4. Enable static website
az storage blob service-properties update \
  --account-name $STORAGE_ACCOUNT \
  --static-website \
  --404-document index.html \
  --index-document index.html

# 5. Build and upload
cd frontend
echo "VITE_API_URL=$BACKEND_URL" > .env.production
npm run build
az storage blob upload-batch \
  --account-name $STORAGE_ACCOUNT \
  --source ./dist \
  --destination '$web' \
  --overwrite

# 6. Get URL
az storage account show \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query "primaryEndpoints.web" \
  --output tsv
```

## Deploy Backend to Azure

### Option 1: Azure Container Instances

```bash
# Build and push image
docker build -t kurser-main ./main
docker tag kurser-main youracr.azurecr.io/kurser-main:latest
docker push youracr.azurecr.io/kurser-main:latest

# Deploy
az container create \
  --resource-group kurser-rg \
  --name kurser-api \
  --image youracr.azurecr.io/kurser-main:latest \
  --dns-name-label kurser-api \
  --ports 3000 \
  --environment-variables \
    MONGODB_URI="your_mongodb_uri" \
    GITHUB_CLIENT_ID="your_client_id" \
    GITHUB_CLIENT_SECRET="your_secret" \
    JWT_SECRET="your_jwt_secret" \
    REDIS_PASSWORD="kurser_redis_pass_2024"
```

### Option 2: Railway.app (Easiest)

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select kurser repository
4. Add environment variables from `main/.env`
5. Deploy → Get URL

## After Deployment

### 1. Update GitHub OAuth
```
Homepage URL: https://kurserfrontend.z13.web.core.windows.net
Callback URL: https://your-backend.azurewebsites.net/auth/github/callback
```

### 2. Update Backend .env
```bash
FRONTEND_URL=https://kurserfrontend.z13.web.core.windows.net
GITHUB_CALLBACK_URL=https://your-backend.azurewebsites.net/auth/github/callback
PUBLIC_URL=https://your-backend.azurewebsites.net
```

### 3. Update Frontend .env.production
```bash
VITE_API_URL=https://your-backend.azurewebsites.net
```

## Test Deployment

```bash
# Test backend
curl https://your-backend.azurewebsites.net/health

# Test frontend
# Visit: https://kurserfrontend.z13.web.core.windows.net
# Click "Check API Health" - should show ✅
```

## Redeploy Frontend (After Changes)

```bash
cd frontend
npm run build
az storage blob upload-batch \
  --account-name kurserfrontend \
  --source ./dist \
  --destination '$web' \
  --overwrite
```

## Environment Variables Checklist

### Backend (main/.env)
- [x] `GITHUB_CLIENT_ID` - From GitHub OAuth App
- [x] `GITHUB_CLIENT_SECRET` - From GitHub OAuth App
- [x] `GITHUB_CALLBACK_URL` - Backend URL + /auth/github/callback
- [x] `MONGODB_URI` - From MongoDB Atlas
- [x] `JWT_SECRET` - Random secret (use: `openssl rand -hex 32`)
- [ ] `FRONTEND_URL` - Update after frontend deployment
- [ ] `PUBLIC_URL` - Update after backend deployment
- [x] `REDIS_PASSWORD` - Set in docker-compose.yml

### Frontend (.env.production)
- [ ] `VITE_API_URL` - Update with deployed backend URL

## Quick Commands

```bash
# Local development
docker compose up -d                    # Start backend
cd frontend && npm run dev              # Start frontend

# View logs
docker compose logs -f                  # All services
docker compose logs -f main             # Backend only
docker compose logs -f worker           # Worker only

# Deploy frontend to Azure
./deploy-frontend-azure.sh              # Interactive
# Or manually with az commands

# Stop all
docker compose down                     # Stop backend
# Kill frontend with Ctrl+C
```

## Troubleshooting

### CORS Error
- Check `FRONTEND_URL` in backend .env matches deployed frontend URL
- Restart backend: `docker compose restart main`

### API Not Responding
- Check backend is deployed and running
- Test health: `curl https://your-backend.azurewebsites.net/health`

### Login Not Working
- Check GitHub OAuth callback URL matches backend URL
- Check `GITHUB_CALLBACK_URL` in backend .env

## Cost Estimate

### Azure Blob Storage (Frontend)
- Storage: ~$0.02/GB/month
- Bandwidth: First 5GB free
- **Typical: < $1/month**

### Azure Container Instances (Backend)
- 1 vCPU, 1.5GB RAM: ~$40/month
- Or use Railway.app: $5/month (hobby plan)

### MongoDB Atlas
- M0 Free Tier: $0/month (512MB)

### Total
- **Minimal setup: $5-10/month**
- **Production setup: $40-50/month**

---

**See full guides:**
- [AZURE_BLOB_DEPLOYMENT.md](./AZURE_BLOB_DEPLOYMENT.md) - Detailed Azure guide
- [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) - Complete deployment guide

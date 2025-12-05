# 🚀 Azure Blob Storage Frontend Deployment

## Overview

Deploy your Kurser frontend to Azure Blob Storage as a static website.

## Prerequisites

- Azure account (free tier available)
- Azure CLI installed
- Frontend built and tested locally

## Step 1: Install Azure CLI (if not installed)

### Linux
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### macOS
```bash
brew install azure-cli
```

### Windows
Download from: https://aka.ms/installazurecliwindows

## Step 2: Login to Azure

```bash
az login
# Opens browser for authentication
```

## Step 3: Create Storage Account

```bash
# Set variables
RESOURCE_GROUP="kurser-rg"
STORAGE_ACCOUNT="kurserfrontend"  # Must be unique globally, lowercase, no special chars
LOCATION="eastus"

# Create resource group (if not exists)
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create storage account
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2
```

## Step 4: Enable Static Website Hosting

```bash
# Enable static website
az storage blob service-properties update \
  --account-name $STORAGE_ACCOUNT \
  --static-website \
  --404-document index.html \
  --index-document index.html
```

## Step 5: Build Frontend with Production Config

```bash
cd frontend

# Update .env.production with your backend URL
cat > .env.production << EOF
VITE_API_URL=https://your-backend-url.azurewebsites.net
EOF

# Build
npm run build
```

## Step 6: Upload to Azure Blob Storage

```bash
# Upload build files to $web container
az storage blob upload-batch \
  --account-name $STORAGE_ACCOUNT \
  --source ./dist \
  --destination '$web' \
  --overwrite
```

## Step 7: Get Frontend URL

```bash
# Get the static website URL
az storage account show \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query "primaryEndpoints.web" \
  --output tsv
```

Your frontend will be available at:
```
https://kurserfrontend.z13.web.core.windows.net/
```

## Step 8: Configure CORS (Important!)

```bash
# Get storage account key
STORAGE_KEY=$(az storage account keys list \
  --resource-group $RESOURCE_GROUP \
  --account-name $STORAGE_ACCOUNT \
  --query '[0].value' \
  --output tsv)

# Set CORS rules
az storage cors add \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --services b \
  --methods GET HEAD POST PUT DELETE OPTIONS \
  --origins '*' \
  --allowed-headers '*' \
  --exposed-headers '*' \
  --max-age 3600
```

## Step 9: Update Backend Environment

Update `main/.env`:
```bash
FRONTEND_URL=https://kurserfrontend.z13.web.core.windows.net
```

Restart backend:
```bash
docker compose restart main
```

## Step 10: Update GitHub OAuth

1. Go to https://github.com/settings/developers
2. Edit your OAuth App
3. Update **Homepage URL**: `https://kurserfrontend.z13.web.core.windows.net`
4. Keep callback URL pointing to your backend

## Quick Deploy Script

Create `deploy-frontend-azure.sh`:

```bash
#!/bin/bash

STORAGE_ACCOUNT="kurserfrontend"
BACKEND_URL="https://your-backend.azurewebsites.net"

echo "🏗️  Building frontend..."
cd frontend

# Update production config
echo "VITE_API_URL=$BACKEND_URL" > .env.production

# Build
npm run build

echo "📤 Uploading to Azure..."
az storage blob upload-batch \
  --account-name $STORAGE_ACCOUNT \
  --source ./dist \
  --destination '$web' \
  --overwrite

echo "✅ Deployment complete!"
echo "🌐 URL: https://$STORAGE_ACCOUNT.z13.web.core.windows.net/"
```

Make it executable:
```bash
chmod +x deploy-frontend-azure.sh
```

Run:
```bash
./deploy-frontend-azure.sh
```

## Custom Domain (Optional)

### Step 1: Add Custom Domain
```bash
az storage account update \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --custom-domain "kurser.yourdomain.com"
```

### Step 2: Add DNS Record
Add CNAME record in your domain DNS:
```
kurser.yourdomain.com → kurserfrontend.z13.web.core.windows.net
```

### Step 3: Enable HTTPS (Azure CDN)
```bash
# Create CDN profile
az cdn profile create \
  --name kurser-cdn \
  --resource-group $RESOURCE_GROUP \
  --sku Standard_Microsoft

# Create CDN endpoint
az cdn endpoint create \
  --name kurser \
  --profile-name kurser-cdn \
  --resource-group $RESOURCE_GROUP \
  --origin kurserfrontend.z13.web.core.windows.net \
  --origin-host-header kurserfrontend.z13.web.core.windows.net
```

## Environment Variables Reference

### Frontend Production (.env.production)
```bash
# Your deployed backend URL
VITE_API_URL=https://your-backend.azurewebsites.net
```

### Backend (main/.env)
```bash
# Your deployed frontend URL
FRONTEND_URL=https://kurserfrontend.z13.web.core.windows.net

# GitHub OAuth callback (backend URL)
GITHUB_CALLBACK_URL=https://your-backend.azurewebsites.net/auth/github/callback
```

## Testing Deployment

1. **Visit Frontend URL**:
   ```
   https://kurserfrontend.z13.web.core.windows.net
   ```

2. **Check API Health**:
   - Click "Check API Health" button
   - Should show "✅"

3. **Test GitHub Login**:
   - Click "Login with GitHub"
   - Should redirect to GitHub OAuth
   - After auth, should redirect back to frontend

4. **Check Browser Console**:
   - Open DevTools (F12)
   - Look for any CORS errors
   - Check Network tab for API calls

## Troubleshooting

### Frontend Shows 404
```bash
# Re-upload with proper settings
az storage blob service-properties update \
  --account-name $STORAGE_ACCOUNT \
  --static-website \
  --404-document index.html \
  --index-document index.html

# Re-upload files
cd frontend
az storage blob upload-batch \
  --account-name $STORAGE_ACCOUNT \
  --source ./dist \
  --destination '$web' \
  --overwrite
```

### CORS Errors
```bash
# Check backend FRONTEND_URL in main/.env
# Should match your Azure Blob URL exactly

# Or set to * for testing:
FRONTEND_URL=*
```

### API Calls Failing
```bash
# Check frontend .env.production
cat frontend/.env.production
# Should have correct VITE_API_URL

# Rebuild if needed
cd frontend
npm run build
az storage blob upload-batch \
  --account-name $STORAGE_ACCOUNT \
  --source ./dist \
  --destination '$web' \
  --overwrite
```

### Backend Not Responding
```bash
# Check if backend is running
curl https://your-backend.azurewebsites.net/health

# Check backend logs (if on Azure)
az webapp log tail --name your-backend --resource-group kurser-rg
```

## Update/Redeploy

When you make changes:

```bash
cd frontend
npm run build
az storage blob upload-batch \
  --account-name $STORAGE_ACCOUNT \
  --source ./dist \
  --destination '$web' \
  --overwrite
```

## Cost Estimate

Azure Blob Storage Static Website:
- **Storage**: ~$0.02/GB per month
- **Bandwidth**: First 5GB free, then ~$0.087/GB
- **Typical small app**: < $1/month

## CI/CD with GitHub Actions (Optional)

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend to Azure

on:
  push:
    branches: [ main ]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Build
        working-directory: ./frontend
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.BACKEND_URL }}
      
      - name: Upload to Azure Blob Storage
        uses: azure/CLI@v1
        with:
          azcliversion: 2.30.0
          inlineScript: |
            az storage blob upload-batch \
              --account-name kurserfrontend \
              --source ./frontend/dist \
              --destination '$web' \
              --overwrite \
              --auth-mode key \
              --account-key ${{ secrets.AZURE_STORAGE_KEY }}
```

Add secrets in GitHub repo settings:
- `BACKEND_URL`: Your backend URL
- `AZURE_STORAGE_KEY`: Get with `az storage account keys list`

## Complete Example

```bash
# Complete deployment script
#!/bin/bash
set -e

echo "🚀 Deploying Kurser Frontend to Azure Blob Storage"

# Configuration
RESOURCE_GROUP="kurser-rg"
STORAGE_ACCOUNT="kurserfrontend"
LOCATION="eastus"
BACKEND_URL="https://kurser-api.azurewebsites.net"

# 1. Create resources
echo "📦 Creating Azure resources..."
az group create --name $RESOURCE_GROUP --location $LOCATION 2>/dev/null || true
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 2>/dev/null || true

# 2. Enable static website
echo "🌐 Enabling static website..."
az storage blob service-properties update \
  --account-name $STORAGE_ACCOUNT \
  --static-website \
  --404-document index.html \
  --index-document index.html

# 3. Build frontend
echo "🏗️  Building frontend..."
cd frontend
echo "VITE_API_URL=$BACKEND_URL" > .env.production
npm run build

# 4. Upload
echo "📤 Uploading to Azure..."
az storage blob upload-batch \
  --account-name $STORAGE_ACCOUNT \
  --source ./dist \
  --destination '$web' \
  --overwrite

# 5. Get URL
FRONTEND_URL=$(az storage account show \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query "primaryEndpoints.web" \
  --output tsv)

echo ""
echo "✅ Deployment complete!"
echo "🌐 Frontend URL: $FRONTEND_URL"
echo ""
echo "Next steps:"
echo "1. Update GitHub OAuth Homepage URL to: $FRONTEND_URL"
echo "2. Update backend FRONTEND_URL to: $FRONTEND_URL"
echo "3. Restart backend: docker compose restart main"
```

## Summary

✅ **Static website hosting** on Azure Blob Storage
✅ **Fast CDN delivery** (optional)
✅ **HTTPS enabled** by default
✅ **Cost effective** (< $1/month)
✅ **Easy updates** with Azure CLI
✅ **CI/CD ready** with GitHub Actions

Your frontend is now deployed and accessible globally! 🎉

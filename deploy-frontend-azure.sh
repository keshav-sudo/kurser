#!/bin/bash

# Kurser Frontend - Azure Blob Storage Deploy Script

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Kurser Frontend - Azure Blob Deployment${NC}"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${YELLOW}❌ Azure CLI not found${NC}"
    echo "Install it: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
    exit 1
fi

# Configuration
read -p "Storage Account Name (lowercase, no special chars): " STORAGE_ACCOUNT
read -p "Backend URL (e.g., https://your-api.azurewebsites.net): " BACKEND_URL
RESOURCE_GROUP="${STORAGE_ACCOUNT}-rg"
LOCATION="eastus"

echo ""
echo -e "${BLUE}📦 Configuration:${NC}"
echo "  Storage Account: $STORAGE_ACCOUNT"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Backend URL: $BACKEND_URL"
echo "  Location: $LOCATION"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Login check
echo -e "${BLUE}🔐 Checking Azure login...${NC}"
az account show &> /dev/null || az login

# Create resource group
echo -e "${BLUE}📦 Creating resource group...${NC}"
az group create --name $RESOURCE_GROUP --location $LOCATION --output none 2>/dev/null || true

# Create storage account
echo -e "${BLUE}💾 Creating storage account...${NC}"
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --output none 2>/dev/null || true

# Enable static website
echo -e "${BLUE}🌐 Enabling static website hosting...${NC}"
az storage blob service-properties update \
  --account-name $STORAGE_ACCOUNT \
  --static-website \
  --404-document index.html \
  --index-document index.html \
  --output none

# Build frontend
echo -e "${BLUE}🏗️  Building frontend...${NC}"
cd frontend

# Update production config
echo "VITE_API_URL=$BACKEND_URL" > .env.production

# Install and build
npm install --silent
npm run build

# Upload to Azure
echo -e "${BLUE}📤 Uploading to Azure Blob Storage...${NC}"
az storage blob upload-batch \
  --account-name $STORAGE_ACCOUNT \
  --source ./dist \
  --destination '$web' \
  --overwrite \
  --output none

cd ..

# Get frontend URL
FRONTEND_URL=$(az storage account show \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query "primaryEndpoints.web" \
  --output tsv)

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo -e "${GREEN}🌐 Frontend URL:${NC}"
echo "   $FRONTEND_URL"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "   1. Update GitHub OAuth App:"
echo "      Homepage URL: $FRONTEND_URL"
echo "      Callback URL: $BACKEND_URL/auth/github/callback"
echo ""
echo "   2. Update backend main/.env:"
echo "      FRONTEND_URL=$FRONTEND_URL"
echo ""
echo "   3. Restart backend:"
echo "      docker compose restart main"
echo ""
echo -e "${GREEN}🎉 Your frontend is live!${NC}"


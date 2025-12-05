#!/bin/bash

echo "🚀 Kurser Production Setup Script"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env files exist
check_env_files() {
    echo "📋 Checking environment files..."
    
    if [ ! -f "main/.env" ]; then
        echo -e "${YELLOW}⚠️  main/.env not found${NC}"
        echo "Creating from example..."
        cp main/.env.example main/.env
        echo -e "${RED}❌ Please edit main/.env with your credentials${NC}"
        ENV_MISSING=1
    else
        echo -e "${GREEN}✅ main/.env exists${NC}"
    fi
    
    if [ ! -f "worker/.env" ]; then
        echo -e "${YELLOW}⚠️  worker/.env not found${NC}"
        echo "Creating from example..."
        cp worker/.env.example worker/.env
        echo -e "${RED}❌ Please edit worker/.env with your credentials${NC}"
        ENV_MISSING=1
    else
        echo -e "${GREEN}✅ worker/.env exists${NC}"
    fi
    
    if [ ! -f "frontend/.env" ]; then
        echo -e "${YELLOW}⚠️  frontend/.env not found${NC}"
        echo "Creating from example..."
        cp frontend/.env.example frontend/.env
        echo -e "${YELLOW}ℹ️  frontend/.env created (update API_URL before deploying)${NC}"
    else
        echo -e "${GREEN}✅ frontend/.env exists${NC}"
    fi
    
    echo ""
}

# Function to check if MongoDB URI is set
check_mongodb() {
    if grep -q "mongodb+srv://username:password" main/.env; then
        echo -e "${RED}❌ MongoDB URI not configured in main/.env${NC}"
        echo "   Please update MONGODB_URI with your MongoDB Atlas connection string"
        return 1
    fi
    
    if grep -q "mongodb+srv://username:password" worker/.env; then
        echo -e "${RED}❌ MongoDB URI not configured in worker/.env${NC}"
        echo "   Please update MONGODB_URI with your MongoDB Atlas connection string"
        return 1
    fi
    
    echo -e "${GREEN}✅ MongoDB URI configured${NC}"
    return 0
}

# Function to check GitHub OAuth
check_github_oauth() {
    if grep -q "your_github_client_id" main/.env; then
        echo -e "${RED}❌ GitHub OAuth not configured in main/.env${NC}"
        echo "   Please update GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET"
        return 1
    fi
    
    echo -e "${GREEN}✅ GitHub OAuth configured${NC}"
    return 0
}

# Main setup
check_env_files

if [ "$ENV_MISSING" = "1" ]; then
    echo -e "${RED}=================================="
    echo "❌ Setup incomplete"
    echo "Please configure the .env files and run this script again"
    echo "==================================${NC}"
    exit 1
fi

echo ""
echo "🔍 Validating configuration..."
echo ""

ERRORS=0

check_mongodb || ERRORS=$((ERRORS+1))
check_github_oauth || ERRORS=$((ERRORS+1))

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo -e "${RED}=================================="
    echo "❌ Configuration incomplete ($ERRORS errors)"
    echo "Please fix the errors above and run this script again"
    echo "==================================${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All configurations valid${NC}"
echo ""

# Ask user what to do
echo "What would you like to do?"
echo "1) Start backend services (Redis + Main + Worker)"
echo "2) Start backend and build frontend"
echo "3) View logs"
echo "4) Stop all services"
echo "5) Clean up everything (including volumes)"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting backend services..."
        docker compose up -d --build
        echo ""
        echo -e "${GREEN}✅ Services started${NC}"
        echo ""
        echo "Check status: docker compose ps"
        echo "View logs: docker compose logs -f"
        echo "Stop services: docker compose down"
        ;;
    2)
        echo ""
        echo "🚀 Starting backend services..."
        docker compose up -d --build
        echo ""
        echo "📦 Building frontend..."
        cd frontend
        npm install
        npm run build
        cd ..
        echo ""
        echo -e "${GREEN}✅ Backend started and frontend built${NC}"
        echo ""
        echo "Frontend build is in: frontend/dist/"
        echo "Deploy using: cd frontend && npm run deploy"
        ;;
    3)
        echo ""
        docker compose logs -f
        ;;
    4)
        echo ""
        echo "🛑 Stopping all services..."
        docker compose down
        echo -e "${GREEN}✅ Services stopped${NC}"
        ;;
    5)
        echo ""
        echo "🗑️  Cleaning up everything..."
        docker compose down -v
        echo -e "${GREEN}✅ Cleanup complete${NC}"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""

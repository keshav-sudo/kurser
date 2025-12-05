#!/bin/bash

echo "🚀 Kurser - Starting GitHub Webhook System..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env exists
if [ ! -f "main/.env" ]; then
    echo "📝 Creating .env file from template..."
    cp main/.env.example main/.env
    echo "⚠️  Please configure GitHub OAuth credentials in main/.env"
    echo "   - GITHUB_CLIENT_ID"
    echo "   - GITHUB_CLIENT_SECRET"
    echo "   - JWT_SECRET"
    echo ""
    echo "   Visit: https://github.com/settings/developers"
    echo ""
    read -p "Press Enter after configuring .env to continue..."
fi

# Start services
echo "🐳 Starting Docker services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check services
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Services started successfully!"
echo ""
echo "📍 Access Points:"
echo "   Main API:       http://localhost:3000"
echo "   Health Check:   http://localhost:3000/health"
echo "   RabbitMQ UI:    http://localhost:15672 (guest/guest)"
echo "   MongoDB:        mongodb://localhost:27017/kurser"
echo ""
echo "🔐 OAuth Flow:"
echo "   1. Open: http://localhost:3000/auth/github"
echo "   2. Authorize the app"
echo "   3. Get JWT token from callback"
echo ""
echo "📖 View logs:"
echo "   docker-compose logs -f main"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
echo ""

# Test health endpoint
echo "🏥 Testing health endpoint..."
sleep 2
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Main API is responding!"
else
    echo "⚠️  Main API not responding yet. Check logs: docker-compose logs main"
fi

echo ""
echo "🎉 All set! Read QUICKSTART.md for next steps."

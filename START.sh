#!/bin/bash

echo "================================================"
echo "   GitHub Webhook Manager - Quick Start"
echo "================================================"
echo ""

# Check RabbitMQ
echo "📋 Checking RabbitMQ..."
if docker ps | grep -q rabbitmq; then
    echo "✅ RabbitMQ is running on port 5672"
else
    echo "❌ RabbitMQ is not running!"
    echo "   Start it with: docker start rabbitmq"
    exit 1
fi

# Check MongoDB
echo ""
echo "📋 Checking MongoDB..."
if pgrep -x mongod > /dev/null || docker ps | grep -q mongo; then
    echo "✅ MongoDB is running"
else
    echo "⚠️  MongoDB might not be running!"
    echo "   Start it with: sudo systemctl start mongod"
    echo "   OR with Docker: docker start mongodb"
fi

echo ""
echo "================================================"
echo "🚀 Starting Services..."
echo "================================================"
echo ""
echo "Backend API will run on: http://localhost:3000"
echo "Frontend App will run on: http://localhost:3001"
echo ""
echo "Opening in separate terminals..."
echo ""
echo "To start manually:"
echo "  Terminal 1: cd /home/keshav/kurser/main && npm run dev"
echo "  Terminal 2: cd /home/keshav/kurser/frontend && npm run dev"
echo ""
echo "Then open: http://localhost:3001"
echo ""
echo "================================================"

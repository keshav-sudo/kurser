#!/bin/bash

echo "=========================================="
echo "🔍 WEBHOOK DEBUG & STATUS CHECK"
echo "=========================================="
echo ""

# Check ngrok
echo "1️⃣ Checking ngrok status..."
if pgrep -f ngrok > /dev/null; then
    echo "   ✅ ngrok is RUNNING"
    
    # Try to get ngrok URL
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)
    if [ -n "$NGROK_URL" ]; then
        echo "   📡 ngrok URL: $NGROK_URL"
    else
        echo "   ⚠️  Could not fetch ngrok URL from dashboard"
    fi
else
    echo "   ❌ ngrok is NOT RUNNING"
    echo "   💡 Start it: ngrok http 3000"
fi
echo ""

# Check .env PUBLIC_URL
echo "2️⃣ Checking PUBLIC_URL in .env..."
cd /home/keshav/kurser/main
PUBLIC_URL=$(grep "^PUBLIC_URL=" .env | cut -d'=' -f2)
if [ -z "$PUBLIC_URL" ]; then
    echo "   ❌ PUBLIC_URL is EMPTY"
else
    echo "   📝 PUBLIC_URL: $PUBLIC_URL"
fi
echo ""

# Check backend
echo "3️⃣ Checking backend status..."
if pgrep -f "node.*index" > /dev/null; then
    echo "   ✅ Backend is RUNNING"
    BACKEND_PID=$(pgrep -f "node.*index" | head -1)
    echo "   🆔 PID: $BACKEND_PID"
else
    echo "   ❌ Backend is NOT RUNNING"
    echo "   💡 Start it: cd main && npm run dev"
fi
echo ""

# Test webhook endpoint
echo "4️⃣ Testing webhook endpoint..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/webhook -X POST \
    -H "Content-Type: application/json" \
    -H "X-GitHub-Event: ping" \
    -d '{"zen":"test"}' 2>/dev/null)

if [ "$RESPONSE" = "000" ]; then
    echo "   ❌ Cannot connect to localhost:3000"
    echo "   💡 Backend might not be running"
elif [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "400" ] || [ "$RESPONSE" = "404" ]; then
    echo "   ✅ Webhook endpoint responding (HTTP $RESPONSE)"
else
    echo "   ⚠️  Unexpected response: HTTP $RESPONSE"
fi
echo ""

# Check MongoDB
echo "5️⃣ Checking webhook events in database..."
WEBHOOK_COUNT=$(docker exec -it kurser-mongodb-1 mongosh -u admin -p admin123 --authenticationDatabase admin kurser --quiet --eval "db.webhookevents.countDocuments()" 2>/dev/null | tr -d '\r' | tail -1)
if [ -n "$WEBHOOK_COUNT" ]; then
    echo "   📊 Webhook events in DB: $WEBHOOK_COUNT"
else
    echo "   ⚠️  Could not query database"
fi
echo ""

echo "=========================================="
echo "📋 SUMMARY"
echo "=========================================="

# Check if everything is OK
NGROK_OK=false
BACKEND_OK=false
URL_OK=false

pgrep -f ngrok > /dev/null && NGROK_OK=true
pgrep -f "node.*index" > /dev/null && BACKEND_OK=true
[ -n "$PUBLIC_URL" ] && URL_OK=true

if $NGROK_OK && $BACKEND_OK && $URL_OK; then
    echo "✅ All systems operational!"
    echo ""
    echo "🎯 To test webhook:"
    echo "   1. Go to GitHub repository"
    echo "   2. Make a commit or create issue"
    echo "   3. Check backend logs for webhook event"
    echo ""
    echo "📊 View ngrok traffic: http://localhost:4040"
elif ! $NGROK_OK; then
    echo "❌ ngrok NOT running"
    echo ""
    echo "🔧 FIX:"
    echo "   1. Open NEW terminal"
    echo "   2. Run: ngrok http 3000"
    echo "   3. Copy the https URL (like https://abc123.ngrok-free.app)"
    echo "   4. Update .env: PUBLIC_URL=<that-url>"
    echo "   5. Restart backend"
elif ! $URL_OK; then
    echo "❌ PUBLIC_URL not set in .env"
    echo ""
    echo "🔧 FIX:"
    echo "   1. Get ngrok URL from terminal where ngrok is running"
    echo "   2. Edit .env: nano /home/keshav/kurser/main/.env"
    echo "   3. Set: PUBLIC_URL=https://your-ngrok-url.ngrok-free.app"
    echo "   4. Restart backend"
elif ! $BACKEND_OK; then
    echo "❌ Backend NOT running"
    echo ""
    echo "🔧 FIX:"
    echo "   cd /home/keshav/kurser/main"
    echo "   npm run dev"
fi

echo "=========================================="

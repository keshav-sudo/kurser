#!/bin/bash

echo "=========================================="
echo "🔧 WEBHOOK FIX SCRIPT"
echo "=========================================="
echo ""

# Step 1: Check if ngrok is installed
echo "Step 1: Checking ngrok installation..."
if ! command -v ngrok &> /dev/null; then
    echo "   ❌ ngrok NOT installed"
    echo ""
    echo "   Install it:"
    echo "   sudo snap install ngrok"
    echo ""
    exit 1
else
    echo "   ✅ ngrok installed"
fi
echo ""

# Step 2: Start ngrok in background
echo "Step 2: Starting ngrok..."
if pgrep -f ngrok > /dev/null; then
    echo "   ⚠️  ngrok already running, restarting..."
    pkill -f ngrok
    sleep 2
fi

echo "   🚀 Starting ngrok on port 3000..."
nohup ngrok http 3000 > /home/keshav/kurser/ngrok.log 2>&1 &
sleep 3

# Step 3: Get ngrok URL
echo "Step 3: Getting ngrok URL..."
sleep 2
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$NGROK_URL" ]; then
    echo "   ❌ Could not get ngrok URL"
    echo "   Check manually at: http://localhost:4040"
    exit 1
fi

echo "   ✅ ngrok URL: $NGROK_URL"
echo ""

# Step 4: Update .env
echo "Step 4: Updating .env file..."
cd /home/keshav/kurser/main
sed -i "s|^PUBLIC_URL=.*|PUBLIC_URL=$NGROK_URL|" .env
echo "   ✅ Updated PUBLIC_URL in .env"
echo ""

# Step 5: Restart backend
echo "Step 5: Restarting backend..."
if pgrep -f "node.*index" > /dev/null; then
    BACKEND_PID=$(pgrep -f "node.*index" | head -1)
    echo "   🛑 Stopping old backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID
    sleep 2
fi

echo "   🚀 Starting backend..."
cd /home/keshav/kurser/main
nohup npm run dev > /home/keshav/kurser/backend.log 2>&1 &
sleep 3

BACKEND_PID=$(pgrep -f "node.*index" | head -1)
if [ -n "$BACKEND_PID" ]; then
    echo "   ✅ Backend started (PID: $BACKEND_PID)"
else
    echo "   ⚠️  Backend might be starting, check logs"
fi
echo ""

echo "=========================================="
echo "✅ SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "📡 ngrok URL: $NGROK_URL"
echo "🌐 ngrok dashboard: http://localhost:4040"
echo ""
echo "🎯 NEXT STEPS:"
echo "   1. Go to frontend and DELETE old webhook setup"
echo "   2. Setup repository again (new webhook will be created)"
echo "   3. Test by making commit to GitHub"
echo ""
echo "📊 Monitor:"
echo "   - ngrok traffic: http://localhost:4040"
echo "   - Backend logs: tail -f /home/keshav/kurser/backend.log"
echo "   - ngrok logs: tail -f /home/keshav/kurser/ngrok.log"
echo ""
echo "🔍 Debug anytime: bash /home/keshav/kurser/webhook-debug.sh"
echo "=========================================="

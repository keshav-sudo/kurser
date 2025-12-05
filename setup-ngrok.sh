#!/bin/bash

echo "╔═══════════════════════════════════════════════════╗"
echo "║     🌐 ngrok Webhook Setup Script 🌐             ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok not installed"
    echo ""
    echo "Install it:"
    echo "  sudo snap install ngrok"
    echo "  OR"
    echo "  Download from: https://ngrok.com/download"
    echo ""
    exit 1
fi

echo "✅ ngrok is installed"
echo ""

# Check if ngrok is running
if pgrep -x "ngrok" > /dev/null; then
    echo "⚠️  ngrok is already running"
    echo ""
    echo "To get the URL:"
    echo "  curl http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[0].public_url'"
    echo ""
    
    # Try to get URL
    NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)
    
    if [ ! -z "$NGROK_URL" ]; then
        echo "📍 Current ngrok URL: $NGROK_URL"
        echo ""
        read -p "Use this URL? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Update .env
            cd /home/keshav/kurser/main
            
            # Remove old PUBLIC_URL line
            sed -i '/^PUBLIC_URL=/d' .env
            
            # Add new PUBLIC_URL
            echo "PUBLIC_URL=$NGROK_URL" >> .env
            
            echo "✅ Updated .env with PUBLIC_URL=$NGROK_URL"
            echo ""
            echo "Now restart backend:"
            echo "  cd /home/keshav/kurser"
            echo "  docker compose restart main"
            echo ""
            echo "  OR (if running locally):"
            echo "  cd /home/keshav/kurser/main"
            echo "  # Stop with Ctrl+C, then:"
            echo "  npm run dev"
            exit 0
        fi
    fi
else
    echo "Starting ngrok..."
    echo ""
    echo "In a NEW terminal, run:"
    echo "  ngrok http 3000"
    echo ""
    echo "Then come back here and press Enter..."
    read
    
    # Try to get URL
    NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)
    
    if [ -z "$NGROK_URL" ]; then
        echo "❌ Could not detect ngrok URL"
        echo ""
        echo "Manual steps:"
        echo "1. Start ngrok: ngrok http 3000"
        echo "2. Copy the https URL"
        echo "3. Edit .env: nano /home/keshav/kurser/main/.env"
        echo "4. Add: PUBLIC_URL=https://your-url.ngrok.io"
        echo "5. Restart: docker compose restart main"
        exit 1
    fi
    
    echo "📍 Detected ngrok URL: $NGROK_URL"
    echo ""
fi

# Update .env
cd /home/keshav/kurser/main

# Backup .env
cp .env .env.backup

# Remove old PUBLIC_URL line
sed -i '/^PUBLIC_URL=/d' .env

# Add new PUBLIC_URL
echo "PUBLIC_URL=$NGROK_URL" >> .env

echo "✅ Updated .env with:"
echo "   PUBLIC_URL=$NGROK_URL"
echo ""

# Ask to restart
read -p "Restart backend now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd /home/keshav/kurser
    
    if docker compose ps | grep -q kurser-main; then
        echo "Restarting Docker container..."
        docker compose restart main
        echo ""
        echo "✅ Backend restarted!"
    else
        echo "⚠️  Docker not running. If using local dev:"
        echo "   Stop with Ctrl+C, then: npm run dev"
    fi
fi

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║              ✅ Setup Complete! ✅                ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Open: http://localhost:3001"
echo "  2. Login with GitHub"
echo "  3. Setup webhook for a repo"
echo "  4. Push code to that repo"
echo "  5. See real webhook events arrive!"
echo ""
echo "Monitor events:"
echo "  docker logs -f kurser-main"
echo ""
echo "ngrok URL will be active as long as ngrok is running."
echo "To stop: Find ngrok terminal and press Ctrl+C"
echo ""

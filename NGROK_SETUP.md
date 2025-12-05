# 🌐 Complete Webhook Setup with ngrok

## Problem Samajhte Hain

**GitHub Webhooks** - Jab bhi aap code push karte ho, PR banate ho, ya koi event hota hai, GitHub automatically aapke server ko data bhejta hai (POST request).

**Issue**: GitHub ko aapka server **publicly accessible** chahiye. `localhost:3000` GitHub tak nahi pahunch sakta.

**Solution**: ngrok - Ye ek tunnel banata hai jo aapke localhost ko public URL de deta hai.

## Quick Setup (5 Minutes)

### Step 1: ngrok Install Karo

```bash
# Linux/Ubuntu
sudo snap install ngrok

# Ya download karo
# https://ngrok.com/download
```

### Step 2: ngrok Account (Optional but Recommended)

```bash
# Sign up: https://dashboard.ngrok.com/signup
# Copy auth token
ngrok authtoken YOUR_AUTH_TOKEN
```

### Step 3: Start ngrok

```bash
# New terminal me
ngrok http 3000
```

Output dikhega:
```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        India (in)
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
```

**Copy this URL**: `https://abc123.ngrok.io`

### Step 4: Update Environment

```bash
cd /home/keshav/kurser/main

# Edit .env file
nano .env
```

Add this line:
```env
PUBLIC_URL=https://abc123.ngrok.io
```

Save and exit (Ctrl+X, Y, Enter)

### Step 5: Restart Backend

**If using Docker:**
```bash
cd /home/keshav/kurser
docker compose restart main
```

**If using local dev:**
```bash
cd /home/keshav/kurser/main
# Stop: Ctrl+C
npm run dev
```

### Step 6: Test!

1. Open browser: http://localhost:3001
2. Login with GitHub
3. Load Repositories
4. Select a repo
5. Click "Setup Webhook"
6. ✅ Success! Real webhook created!

### Step 7: Verify Webhook on GitHub

1. Go to your repo on GitHub
2. Settings → Webhooks
3. You'll see webhook with URL: `https://abc123.ngrok.io/webhook`
4. Click on it to see deliveries

### Step 8: Test Real Events

```bash
# Push some code to your repo
cd /path/to/your/repo
echo "test" >> README.md
git add .
git commit -m "test webhook"
git push
```

**Check logs:**
```bash
docker logs -f kurser-main
# You'll see: "✅ Webhook received: push for username/repo"
```

**Check in UI:**
- Load Webhook Events
- You'll see the push event!

## Complete Flow

```
┌─────────────────┐
│   GitHub Repo   │
│  (Push Event)   │
└────────┬────────┘
         │
         │ HTTP POST
         ▼
┌─────────────────┐
│     ngrok       │
│  (Public URL)   │
└────────┬────────┘
         │
         │ Tunnel
         ▼
┌─────────────────┐
│  Your Backend   │
│  localhost:3000 │
└────────┬────────┘
         │
         ├─────────────┐
         │             │
         ▼             ▼
    ┌─────────┐  ┌──────────┐
    │ MongoDB │  │ RabbitMQ │
    └─────────┘  └──────────┘
```

## Environment Variables Explained

```env
# Empty = Webhook creation skipped (local testing only)
PUBLIC_URL=

# With ngrok = Real webhooks work!
PUBLIC_URL=https://abc123.ngrok.io

# Production = Use your domain
PUBLIC_URL=https://your-app.com
```

## Troubleshooting

### ngrok session expired
**Problem**: Free ngrok URLs expire when you close ngrok
**Solution**: 
- Keep ngrok running
- Or get ngrok paid plan for permanent URLs
- Or restart ngrok and update PUBLIC_URL

### Webhook still not working
```bash
# 1. Check ngrok is running
curl https://your-url.ngrok.io/health

# 2. Check PUBLIC_URL is set
docker exec kurser-main printenv | grep PUBLIC_URL

# 3. Restart backend
docker compose restart main

# 4. Check logs
docker logs -f kurser-main
```

### Can't access ngrok URL from outside
**Problem**: Firewall blocking
**Solution**: ngrok handles this - no firewall config needed!

## Without ngrok (Local Mode)

If you don't want to use ngrok:

1. ✅ Repository tracking works
2. ✅ UI testing works
3. ✅ Manual webhook testing works (cURL)
4. ❌ Real GitHub events won't arrive

**Manual Test:**
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{
    "repository": {
      "id": 123456,
      "full_name": "username/repo"
    }
  }'
```

## Production Deployment

For production, deploy to:

### Vercel
```env
PUBLIC_URL=https://your-app.vercel.app
```

### Railway
```env
PUBLIC_URL=https://your-app.railway.app
```

### DigitalOcean
```env
PUBLIC_URL=https://your-domain.com
```

Then GitHub webhooks will automatically work!

## Quick Commands

```bash
# Start ngrok
ngrok http 3000

# Update .env
echo "PUBLIC_URL=https://your-url.ngrok.io" >> /home/keshav/kurser/main/.env

# Restart backend
cd /home/keshav/kurser && docker compose restart main

# Watch logs
docker logs -f kurser-main

# Test webhook
curl http://localhost:3000/webhook -X POST \
  -H "X-GitHub-Event: push" \
  -H "Content-Type: application/json" \
  -d '{"repository":{"id":123,"full_name":"test/repo"}}'
```

## Status Check

```bash
# Check all services
docker compose ps

# Check backend logs
docker logs kurser-main --tail 50

# Test health
curl http://localhost:3000/health

# Test via ngrok
curl https://your-url.ngrok.io/health
```

## Summary

| Mode | Setup | Real Events | Best For |
|------|-------|-------------|----------|
| Local | None | ❌ | Quick UI testing |
| ngrok | 5 min | ✅ | Full development |
| Production | Deploy | ✅ | Live apps |

**Recommendation**: Use ngrok for proper testing! Takes only 5 minutes! 🚀

## Next Steps

1. **Install ngrok**: `sudo snap install ngrok`
2. **Start it**: `ngrok http 3000`
3. **Copy URL**: e.g., `https://abc123.ngrok.io`
4. **Update .env**: `PUBLIC_URL=https://abc123.ngrok.io`
5. **Restart**: `docker compose restart main`
6. **Test**: Setup webhook in UI
7. **Push code**: See real events arrive!

**That's it!** Real GitHub webhooks working! 🎉

# Webhook Setup Guide

## Problem: "Validation Failed" Error

GitHub webhooks require a **publicly accessible URL**. Localhost URLs (http://localhost:3000) won't work because GitHub cannot send webhook events to your local machine.

## Solutions

### Option 1: Test Without Real Webhooks (Local Development)

The app now works **without** creating real GitHub webhooks. It will:
- ✅ Track repositories in database
- ✅ Store events when you manually trigger them
- ⚠️ Not receive automatic webhook events from GitHub

**No setup needed!** Just leave `PUBLIC_URL` empty in `.env`

```env
PUBLIC_URL=
```

When you setup a webhook, you'll see:
```json
{
  "message": "Repository tracked (webhook disabled - set PUBLIC_URL for webhook)",
  "warning": "Set PUBLIC_URL environment variable to enable GitHub webhooks"
}
```

### Option 2: Use ngrok (Recommended for Testing)

ngrok creates a public URL that tunnels to your localhost.

#### Step 1: Install ngrok
```bash
# Download from: https://ngrok.com/download
# Or install via package manager:
sudo snap install ngrok  # Ubuntu/Linux
brew install ngrok       # macOS
```

#### Step 2: Start ngrok
```bash
# In a new terminal
ngrok http 3000
```

You'll see output like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

#### Step 3: Update .env
Copy the ngrok URL and add to `.env`:
```env
PUBLIC_URL=https://abc123.ngrok.io
```

#### Step 4: Restart Backend
```bash
cd /home/keshav/kurser/main
# Stop current server (Ctrl+C)
npm run dev
```

#### Step 5: Test Webhook
Now when you setup a webhook, it will:
- ✅ Create real webhook on GitHub
- ✅ Receive automatic events from GitHub
- ✅ Process push, PR, issues events

### Option 3: Deploy to Production

For production, deploy to:
- Vercel
- Railway
- Heroku
- DigitalOcean
- AWS

Then set `PUBLIC_URL` to your production domain:
```env
PUBLIC_URL=https://your-app.vercel.app
```

## Improved Error Handling

The webhook setup now handles:

1. **Admin Access Check**: Verifies you have admin rights to the repo
2. **Duplicate Webhook**: Finds and uses existing webhook if already created
3. **Validation Errors**: Provides clear error messages
4. **Local Mode**: Works without PUBLIC_URL for testing

## Understanding the Errors

### "Validation Failed"
**Cause**: GitHub cannot validate the webhook URL
**Solutions**:
- Use ngrok (Option 2)
- Or work in local mode without webhooks (Option 1)

### "Admin access required"
**Cause**: You don't have admin permissions on the repository
**Solution**: Use a repo you own or have admin access to

### Webhook already exists
**Cause**: Webhook was created in previous attempt
**Solution**: The app will automatically use the existing webhook

## Testing Flow

### Without ngrok (Local Mode):
1. Setup "webhook" (tracks repo only)
2. Manually trigger test events via API
3. View events in database

### With ngrok (Full Mode):
1. Start ngrok
2. Update PUBLIC_URL in .env
3. Restart backend
4. Setup webhook (creates real GitHub webhook)
5. Push code to GitHub
6. See real webhook events arrive!

## Complete Setup Example

```bash
# Terminal 1: Start ngrok
ngrok http 3000

# Terminal 2: Update .env
cd /home/keshav/kurser/main
echo "PUBLIC_URL=https://your-ngrok-url.ngrok.io" >> .env

# Restart backend
npm run dev

# Terminal 3: Start frontend
cd /home/keshav/kurser/frontend
npm run dev

# Browser: http://localhost:3001
# Now setup webhook - it will create real GitHub webhook!
```

## Manual Testing Without Webhooks

You can test the webhook receiver manually:

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-GitHub-Delivery: test-12345" \
  -d '{
    "repository": {
      "id": 123456,
      "full_name": "username/repo"
    },
    "ref": "refs/heads/main",
    "commits": [
      {
        "id": "abc123",
        "message": "Test commit"
      }
    ]
  }'
```

## Environment Variables

```env
# Leave empty for local testing without webhooks
PUBLIC_URL=

# Or set to ngrok URL for real webhooks
PUBLIC_URL=https://abc123.ngrok.io

# Or set to production URL
PUBLIC_URL=https://your-app.com
```

## Current Status

✅ **Fixed**: Webhook setup now works in two modes:
- **Local Mode**: Without PUBLIC_URL (tracks repos, no real webhooks)
- **Public Mode**: With PUBLIC_URL (creates real GitHub webhooks)

✅ **Improved**: Better error messages for common issues

✅ **Flexible**: Works for both development and production

## Restart Required

After updating `.env`, always restart the backend:

```bash
# Stop: Ctrl+C
# Start:
cd /home/keshav/kurser/main
npm run dev
```

## Summary

| Mode | PUBLIC_URL | Real Webhooks | Best For |
|------|------------|---------------|----------|
| Local | Empty | ❌ No | Quick testing |
| ngrok | ngrok URL | ✅ Yes | Development |
| Production | Domain | ✅ Yes | Live apps |

Choose the mode that fits your needs!

# 🔧 Webhook Fix - Abhi Karo

## Problem Samjho
- ✅ Backend chal raha hai
- ✅ Webhook GitHub pe ban gaya hai  
- ❌ ngrok NAHI chal raha
- ❌ Commits pe trigger nahi ho raha

**Kyun?** GitHub purane ngrok URL pe hit kar raha hai jo ab down hai.

---

## Solution (3 Steps)

### Step 1: ngrok Install Karo

```bash
sudo snap install ngrok
```

**Password maangega** - apna system password daalo.

---

### Step 2: ngrok Start Karo (NAYA TERMINAL)

**Naya terminal kholo** aur:

```bash
ngrok http 3000
```

**Output aise hoga:**
```
Forwarding    https://abcd-1234.ngrok-free.app -> http://localhost:3000
```

**Is URL ko COPY karo** (https://abcd-1234.ngrok-free.app)

**YE TERMINAL KHULA RAKHO** - ngrok running rehna chahiye!

---

### Step 3: .env Update + Backend Restart

**Original terminal mein:**

```bash
# .env edit karo
cd /home/keshav/kurser/main
nano .env
```

**Find this line:**
```
PUBLIC_URL=https://something.ngrok-free.app
```

**Replace with YOUR new ngrok URL:**
```
PUBLIC_URL=https://abcd-1234.ngrok-free.app
```

**Save:** `Ctrl+X` → `Y` → `Enter`

**Backend restart:**
```bash
# Backend ko band karo (jahan chal raha hai)
# Ctrl+C press karo

# Phir start karo
npm run dev
```

---

## Step 4: Webhook Dobara Setup Karo

### Important: Purana webhook DELETE karo pehle!

**Frontend pe jao:**
1. Repository list mein jao
2. "frontend" repo ka webhook **DELETE** karo
3. Phir **dobara setup** karo

**Ab naya webhook bnega** correct ngrok URL ke saath!

---

## Test Karo

### Option 1: GitHub pe commit karo
```bash
cd /path/to/your/frontend/repo
git commit --allow-empty -m "Test webhook"
git push
```

### Option 2: GitHub website pe
1. Koi file edit karo
2. Commit karo

### Check Logs
Backend terminal mein dikhega:
```
✅ Webhook received: push for keshav-sudo/frontend
```

**ngrok dashboard** pe bhi dikhega: http://localhost:4040

---

## Quick Commands

**Check kya chal raha hai:**
```bash
bash /home/keshav/kurser/webhook-debug.sh
```

**Backend logs:**
```bash
cd /home/keshav/kurser/main
npm run dev
# Ya
tail -f backend.log  # agar background mein hai
```

**ngrok dashboard:**
Browser mein kholo: http://localhost:4040

---

## Common Issues

### "Address already in use"
Backend already chal raha hai. Pehle band karo:
```bash
pkill -f "node.*index"
# Then restart
```

### ngrok URL change ho gaya
Har ngrok restart pe URL badalta hai (free plan). Phir se:
1. Naya URL copy karo
2. .env update karo
3. Backend restart karo
4. Webhook dobara setup karo

### Webhook nahi dikh raha
GitHub repo mein check karo:
- Settings → Webhooks
- Apna webhook URL dekho
- Recent deliveries check karo

---

## Current Status

**Before fix:**
- ngrok: ❌ Not running
- Backend: ✅ Running  
- PUBLIC_URL: ⚠️ Old/wrong URL
- Webhook: ❌ Not triggering

**After fix:**
- ngrok: ✅ Running
- Backend: ✅ Running
- PUBLIC_URL: ✅ Correct
- Webhook: ✅ Triggering

---

## Summary

```bash
# Terminal 1: ngrok
ngrok http 3000

# Terminal 2: Backend  
cd /home/keshav/kurser/main
# Update .env with ngrok URL
npm run dev

# Terminal 3: Frontend (optional)
cd /home/keshav/kurser/frontend
npm run dev
```

**Remember:**
- ngrok terminal khula rakho
- Backend restart after .env change
- Webhook dobara setup karo (delete old → create new)
- Test with commit

Done! 🎉

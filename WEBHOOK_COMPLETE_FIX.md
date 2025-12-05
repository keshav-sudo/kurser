# 🎯 Webhook Complete Fix - Step by Step

## ✅ GOOD NEWS
Tumhara webhook endpoint **PERFECT KAAM KAR RAHA HAI**!

Test result:
```json
{"message":"Webhook received","eventId":"6931a28917f36b94fcfb135a"}
```

## ❌ PROBLEM
**ngrok running NAHI hai** - GitHub se request aane ka raasta band hai.

---

## 🔧 SOLUTION (Follow Exactly)

### Step 1: ngrok Install (Agar nahi hai)
```bash
sudo snap install ngrok
```

### Step 2: ngrok Start Karo
**NAYA TERMINAL kholo** (important!) aur:

```bash
ngrok http 3000
```

**Output:**
```
Session Status                online
Account                       your-account (Plan: Free)
Version                       3.x.x
Region                        India (in)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abcd-1234.ngrok-free.app -> http://localhost:3000
```

**✨ Copy karo:** `https://abcd-1234.ngrok-free.app`

**⚠️ Is terminal ko CLOSE MAT KARNA!**

---

### Step 3: .env Update Karo

```bash
cd /home/keshav/kurser/main
nano .env
```

**Find this line:**
```
PUBLIC_URL=https://something.ngrok-free.app
```

**Update to YOUR ngrok URL:**
```
PUBLIC_URL=https://abcd-1234.ngrok-free.app
```

**Save:** `Ctrl+X` → `Y` → `Enter`

---

### Step 4: Backend Restart (Docker mein hai)

**Option A: Docker restart (recommended)**
```bash
cd /home/keshav/kurser
docker-compose restart main
```

**Option B: Full restart**
```bash
cd /home/keshav/kurser
docker-compose down
docker-compose up -d
```

**Check logs:**
```bash
docker-compose logs -f main
```

---

### Step 5: GitHub Webhook Update Karo

Ab do options hain:

#### Option A: Existing webhook UPDATE karo (fastest)

1. **GitHub pe jao:**
   - Repository: https://github.com/keshav-sudo/frontend
   - Settings → Webhooks
   - Apna webhook pe click karo

2. **Payload URL update:**
   ```
   https://YOUR-NEW-NGROK-URL.ngrok-free.app/webhook
   ```

3. **Save karo**

#### Option B: Frontend se dobara setup karo

1. **Frontend dashboard pe jao**
2. **Repository DELETE karo** (purana webhook hata jayega)
3. **Dobara ADD karo** (naya webhook ban jayega)

---

## 🧪 TEST KARO

### Test 1: Manual curl (through ngrok)
```bash
curl -X POST https://YOUR-NGROK-URL.ngrok-free.app/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{
    "repository": {
      "id": 1109400953,
      "full_name": "keshav-sudo/frontend"
    },
    "ref": "refs/heads/main",
    "commits": []
  }'
```

**Expected:** `{"message":"Webhook received","eventId":"..."}`

### Test 2: Real GitHub Event

**Option 1: Empty commit**
```bash
cd /path/to/your/frontend/repo
git commit --allow-empty -m "Test webhook trigger"
git push
```

**Option 2: GitHub website**
- README.md edit karo
- Commit karo

---

## 📊 MONITORING

### 1. ngrok Dashboard
```
http://localhost:4040
```
Yahaan dikhega:
- Incoming requests
- Request/Response headers
- Status codes

### 2. Backend Logs
```bash
docker-compose logs -f main
```

Dikhega:
```
📥 POST /webhook - 2025-12-04T15:XX:XX.XXXZ
🎯 Webhook request headers: push
✅ Webhook received: push for keshav-sudo/frontend
```

### 3. Frontend Events
```
http://localhost:3001/repos/1109400953
```

---

## 🔍 VERIFY EVERYTHING

Run this debug script:
```bash
bash /home/keshav/kurser/webhook-debug.sh
```

**Expected output:**
```
✅ ngrok is RUNNING
✅ Backend is RUNNING
✅ PUBLIC_URL set correctly
✅ Webhook endpoint responding
```

---

## 📝 CURRENT CONFIGURATION

**Your Setup:**
```
Server Route:  /webhook
Server Port:   3000 (Docker)
Webhook Path:  POST /webhook
Content-Type:  application/json
Events:        All (from GitHub UI screenshot)
```

**GitHub Webhook URL should be:**
```
https://YOUR-NGROK-URL.ngrok-free.app/webhook
```

**NOT:**
- ❌ http://localhost:3000/webhook
- ❌ https://YOUR-NGROK-URL.ngrok-free.app (missing /webhook)
- ❌ https://YOUR-NGROK-URL.ngrok-free.app/api/webhook

---

## ⚠️ IMPORTANT NOTES

### 1. ngrok URL Changes
Free plan pe **har restart pe URL change hota hai**

**Har baar karna hoga:**
1. New ngrok URL copy karo
2. .env update karo
3. Backend restart karo
4. GitHub webhook URL update karo

### 2. ngrok Session
- Terminal close mat karo jahan ngrok chal raha hai
- Computer sleep/shutdown pe ngrok band ho jayega
- Phir se start karna padega

### 3. SSL Verification
GitHub pe SSL verification **enabled** rakho (default).
ngrok automatically SSL provide karta hai.

---

## 🎯 QUICK CHECKLIST

Before testing:
- [ ] ngrok running hai?
- [ ] ngrok URL .env mein hai?
- [ ] Backend restart kiya?
- [ ] GitHub webhook URL updated?
- [ ] Events selected on GitHub?

If all checked, webhook will work! 🚀

---

## 🐛 STILL NOT WORKING?

### Check ngrok:
```bash
ps aux | grep ngrok
curl http://localhost:4040/api/tunnels
```

### Check backend:
```bash
docker-compose ps
docker-compose logs main | tail -20
```

### Test endpoint:
```bash
# Replace with your ngrok URL
curl -X POST https://YOUR-URL.ngrok-free.app/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: ping" \
  -d '{"repository":{"id":1109400953}}'
```

### Check GitHub webhook:
- Go to: Settings → Webhooks → Your webhook
- Click "Recent Deliveries"
- Check Response tab
- Should show 200, not 404

---

## 📞 RESPONSE CODES

| Code | Meaning | Action |
|------|---------|--------|
| 200 | ✅ Success | Working! |
| 400 | ⚠️ Bad payload | Check request format |
| 404 | ❌ Not found | Check URL path |
| 500 | 💥 Server error | Check backend logs |
| 000 | 🔌 Connection failed | ngrok not running |

---

## 🎉 SUCCESS LOOKS LIKE

**Backend logs:**
```
📥 POST /webhook - 2025-12-04T15:XX:XX.XXXZ
🎯 Webhook request headers: push
✅ Webhook received: push for keshav-sudo/frontend
```

**ngrok dashboard:**
```
POST /webhook    200 OK
```

**GitHub webhook:**
```
✓ Recent Delivery - 200 OK
```

**Database:**
```
New event in webhookevents collection
Status: pending → processing → completed
```

---

## 🚀 FINAL COMMAND SEQUENCE

```bash
# Terminal 1: ngrok
ngrok http 3000

# Terminal 2: Update & restart
cd /home/keshav/kurser/main
# Copy ngrok URL and update .env
nano .env  # Set PUBLIC_URL
cd /home/keshav/kurser
docker-compose restart main
docker-compose logs -f main

# Terminal 3: Monitor ngrok
# Open browser: http://localhost:4040

# GitHub: Update webhook URL

# Test: Make a commit
```

DONE! 🎊

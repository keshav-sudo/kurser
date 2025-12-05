# Webhook Quick Setup - Urdu/Hindi Guide

## Masla
Aapka repository track ho gaya hai LEKIN webhook create nahi hua kyunki `PUBLIC_URL` set nahi hai.

## Samajhiye
- **LOCAL_URL** (http://localhost:3000) - Sirf aapke computer pe kaam karta hai
- **PUBLIC_URL** - Internet se accessible, GitHub webhooks ke liye zaroori

## Do Options Hain

### Option 1: Bina Webhook (Abhi ke liye)
Repository tracking kaam kar rahi hai. Manual testing kar sakte ho.

**Kya hoga:**
✅ Repository database mein save
✅ Manual events test kar sakte ho
❌ Automatic GitHub events nahi aayenge

**Kuch karna nahi hai** - Already working!

---

### Option 2: Real Webhooks (ngrok se)

#### Step 1: ngrok Install Karo
```bash
# Download: https://ngrok.com/download
# Ya install karo:
sudo snap install ngrok  # Ubuntu/Linux
brew install ngrok       # macOS
```

#### Step 2: ngrok Start Karo
**NAYA TERMINAL** kholo aur chalaao:
```bash
ngrok http 3000
```

Output mein milega:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

#### Step 3: .env File Update Karo
Jo URL mila (https://abc123.ngrok.io), use .env mein daalo:

```bash
cd /home/keshav/kurser/main
nano .env
```

Ye line dhundo:
```
PUBLIC_URL=
```

Aur aise change karo:
```
PUBLIC_URL=https://abc123.ngrok.io
```
*(Apna ngrok URL lagana)*

Save karo: `Ctrl+X`, phir `Y`, phir `Enter`

#### Step 4: Backend Restart Karo
```bash
# Pehle ruk jao: Ctrl+C
cd /home/keshav/kurser/main
npm run dev
```

#### Step 5: Ab Webhook Setup Karo
Frontend pe jao aur repository setup karo. Ab REAL webhook ban jayega!

---

## Current Status

✅ **Repository Tracked**: frontend (keshav-sudo/frontend)
✅ **Database**: Repo info saved
⚠️ **Webhook**: Not created (PUBLIC_URL missing)

## Kya Karna Chahte Ho?

### Agar Testing Karni Hai (Manual):
- Kuch nahi karna, already working
- Events manually API se trigger kar sakte ho

### Agar Real Webhooks Chahiye:
1. ngrok install aur start karo
2. PUBLIC_URL set karo .env mein
3. Backend restart karo
4. Repository dobara setup karo (automatic webhook ban jayega)

## ngrok Console
ngrok start karne ke baad, ye URL kholo browser mein:
```
http://localhost:4040
```
Yahaan saari incoming requests dikhegi - debugging ke liye useful!

## Environment Variables Summary

```env
# Current (No webhooks)
PUBLIC_URL=

# With ngrok (Real webhooks)
PUBLIC_URL=https://your-ngrok-url.ngrok.io

# Production
PUBLIC_URL=https://your-domain.com
```

## Agar Restart Karna Hai

**Backend:**
```bash
cd /home/keshav/kurser/main
# Roko: Ctrl+C
npm run dev
```

**Frontend:**
```bash
cd /home/keshav/kurser/frontend
# Roko: Ctrl+C
npm run dev
```

**ngrok** (agar use kar rahe ho):
```bash
# Nayi terminal
ngrok http 3000
```

## Important Notes

1. **ngrok URL har baar change hota hai** jab restart karte ho (free plan)
2. Har ngrok restart pe `.env` update karni hogi
3. Backend restart zaroori hai `.env` change ke baad
4. Repository dobara setup karna padega naye webhook ke liye

## Test Karo

Agar ngrok setup kar liya:
1. GitHub pe repo mein kuch commit karo
2. Ya issue banao
3. Backend console mein webhook event dikhega!

```
✅ Webhook received: push for keshav-sudo/frontend
```

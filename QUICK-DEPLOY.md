# Quick Railway Deployment

## The Problem
Railway detected your monorepo but doesn't know which service to build.

## The Solution
Deploy **frontend** and **backend** as **separate services**.

---

## Quick Steps (5 minutes)

### 1. Commit the new config files
```bash
git add .
git commit -m "feat: add Railway deployment configs"
git push origin main
```

### 2. Go to Railway Dashboard
Visit: https://railway.app/new

### 3. Create Services

#### A. Add PostgreSQL
1. Click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Done! ✅

#### B. Add Redis
1. Click **"+ New"**
2. Select **"Database"** → **"Redis"**
3. Done! ✅

#### C. Deploy Backend
1. Click **"+ New"** → **"GitHub Repo"**
2. Select `yassin549/test`
3. Go to **Settings** → **Source**
4. Set **Root Directory**: `backend`
5. Go to **Variables** tab
6. Add these variables:
   ```
   DJANGO_SECRET_KEY=your-super-secret-key-min-50-chars-long
   DJANGO_DEBUG=False
   DJANGO_ALLOWED_HOSTS=*.railway.app
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   NOWPAYMENTS_API_KEY=your-key
   NOWPAYMENTS_WEBHOOK_SECRET=your-secret
   NOWPAYMENTS_SANDBOX=True
   ```
7. Click **"Deploy"** ✅

#### D. Deploy Frontend
1. Click **"+ New"** → **"GitHub Repo"**
2. Select `yassin549/test` again
3. Go to **Settings** → **Source**
4. Set **Root Directory**: `frontend`
5. Go to **Variables** tab
6. Add these variables:
   ```
   NEXT_PUBLIC_API_URL=https://<backend-url>.railway.app
   NEXT_PUBLIC_WS_URL=wss://<backend-url>.railway.app
   NODE_ENV=production
   ```
   (Replace `<backend-url>` with your actual backend Railway domain)
7. Click **"Deploy"** ✅

---

## That's It!

Your app will be live at:
- **Frontend**: `https://<your-frontend>.railway.app`
- **Backend**: `https://<your-backend>.railway.app`

---

## Generate Django Secret Key

Run this locally to generate a secure key:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Or use this online: https://djecrety.ir/

---

## After Deployment

1. **Update CORS**: Add your frontend URL to backend's `CORS_ALLOWED_ORIGINS`
2. **Test WebSocket**: Open the game and check if multiplier updates
3. **Test API**: Try placing a bet
4. **Check Logs**: View logs in Railway dashboard if something fails

---

## Need Help?

See `RAILWAY-DEPLOYMENT.md` for detailed troubleshooting.

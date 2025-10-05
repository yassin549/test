# Fix Railway "Unable to Generate Build Plan" Error

## The Problem
Railway is trying to build from the **root directory** which contains both frontend and backend. It doesn't know which one to build.

## The Solution
Set the **Root Directory** for each service.

---

## Step-by-Step Fix

### 1. Go to Railway Dashboard
Visit: https://railway.app/dashboard

### 2. Click on Your Project
Find the project you just created

### 3. For Each Service (Backend/Frontend):

#### A. Click on the Service
Click on the service card (it will show "Build Failed")

#### B. Go to Settings
Click the **"Settings"** tab at the top

#### C. Find "Source" Section
Scroll down to the **"Source"** section

#### D. Set Root Directory
You'll see a field labeled **"Root Directory"**

**For Backend Service:**
- Enter: `backend`
- Click outside the field to save

**For Frontend Service:**
- Enter: `frontend`
- Click outside the field to save

#### E. Redeploy
- Go back to the **"Deployments"** tab
- Click **"Deploy"** button (or it will auto-deploy)

---

## Visual Guide

```
Railway Dashboard
    ↓
Your Project
    ↓
Service (Backend or Frontend)
    ↓
Settings Tab
    ↓
Source Section
    ↓
Root Directory Field → Enter "backend" or "frontend"
    ↓
Save & Redeploy
```

---

## If You Haven't Created Services Yet

### Option 1: Create Services from Dashboard

1. **Create New Project** on Railway
2. **Add PostgreSQL**: Click "+ New" → Database → PostgreSQL
3. **Add Redis**: Click "+ New" → Database → Redis
4. **Add Backend**:
   - Click "+ New" → GitHub Repo
   - Select `yassin549/test`
   - **Immediately go to Settings → Source → Set Root Directory to `backend`**
   - Add environment variables
5. **Add Frontend**:
   - Click "+ New" → GitHub Repo
   - Select `yassin549/test` again
   - **Immediately go to Settings → Source → Set Root Directory to `frontend`**
   - Add environment variables

### Option 2: Use Railway CLI

See `RAILWAY-CLI-DEPLOY.md` for CLI instructions.

---

## Environment Variables Reminder

### Backend
```
DJANGO_SECRET_KEY=<50-char-random-string>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=*.railway.app
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
CORS_ALLOWED_ORIGINS=https://<frontend-url>.railway.app
NOWPAYMENTS_API_KEY=<your-key>
NOWPAYMENTS_WEBHOOK_SECRET=<your-secret>
NOWPAYMENTS_SANDBOX=True
```

### Frontend
```
NEXT_PUBLIC_API_URL=https://<backend-url>.railway.app
NEXT_PUBLIC_WS_URL=wss://<backend-url>.railway.app
NODE_ENV=production
```

---

## Common Mistakes

❌ **Deploying from root directory** → Railway doesn't know what to build
✅ **Set root directory to `backend` or `frontend`** → Railway knows what to build

❌ **Creating one service for the whole repo** → Won't work for monorepos
✅ **Create separate services for frontend and backend** → Each with its own root directory

❌ **Forgetting to set environment variables** → App will crash
✅ **Set all required environment variables** → App runs smoothly

---

## Still Having Issues?

1. **Check the logs**: Railway Dashboard → Service → Deployments → Click on deployment → View logs
2. **Verify root directory**: Settings → Source → Root Directory should be `backend` or `frontend`
3. **Check environment variables**: Settings → Variables → Ensure all are set
4. **Try redeploying**: Deployments → Deploy button

---

## Quick Checklist

- [ ] PostgreSQL database created
- [ ] Redis database created
- [ ] Backend service created with root directory = `backend`
- [ ] Frontend service created with root directory = `frontend`
- [ ] Backend environment variables set
- [ ] Frontend environment variables set
- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] Frontend can connect to backend
- [ ] WebSocket works

---

## Need More Help?

- Check `QUICK-DEPLOY.md` for quick start
- Check `RAILWAY-DEPLOYMENT.md` for comprehensive guide
- Check `RAILWAY-CLI-DEPLOY.md` for CLI instructions
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

# Railway Deployment - Step by Step

## ⚠️ IMPORTANT: Root Directory Must Be Set

Railway cannot auto-detect monorepos. You MUST manually set the root directory for each service.

---

## Method 1: Railway Dashboard (Easiest)

### Step 1: Create a New Project
1. Go to https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Select your repo: `yassin549/test`
4. **STOP! Don't click deploy yet!**

### Step 2: Configure the Service
1. You'll see a service card
2. Click on it
3. Click **"Settings"** at the top
4. Find **"Service"** section
5. Look for **"Root Directory"** field
6. Enter: `backend` (we'll deploy backend first)
7. Click outside to save

### Step 3: Add Environment Variables
Still in Settings, go to **"Variables"** section:
```
DJANGO_SECRET_KEY=your-50-char-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=*.railway.app
NOWPAYMENTS_API_KEY=your-key
NOWPAYMENTS_WEBHOOK_SECRET=your-secret
NOWPAYMENTS_SANDBOX=True
```

### Step 4: Add PostgreSQL
1. In your project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will auto-create `DATABASE_URL` variable

### Step 5: Add Redis
1. Click **"+ New"** again
2. Select **"Database"** → **"Add Redis"**
3. Railway will auto-create `REDIS_URL` variable

### Step 6: Link Database to Backend
1. Go back to your backend service
2. Go to **"Settings"** → **"Variables"**
3. Add:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `REDIS_URL` = `${{Redis.REDIS_URL}}`

### Step 7: Deploy Backend
1. Go to **"Deployments"** tab
2. Click **"Deploy"**
3. Wait for it to finish (check logs)

### Step 8: Deploy Frontend
1. In your project, click **"+ New"**
2. Select **"GitHub Repo"**
3. Select `yassin549/test` again
4. **IMMEDIATELY** click on the new service
5. Go to **"Settings"**
6. Set **"Root Directory"** to: `frontend`
7. Go to **"Variables"** and add:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   NEXT_PUBLIC_WS_URL=wss://your-backend-url.railway.app
   NODE_ENV=production
   ```
   (Replace `your-backend-url` with actual backend URL from step 7)
8. Go to **"Deployments"** → **"Deploy"**

---

## Method 2: Railway CLI (Alternative)

### Install CLI
```bash
npm install -g @railway/cli
railway login
```

### Deploy Backend
```bash
cd backend
railway init
# Select "Create new project"
# Name it "aviator-game"

railway up
# This deploys from the backend directory

# Add variables
railway variables set DJANGO_SECRET_KEY="your-key"
railway variables set DJANGO_DEBUG="False"
railway variables set DJANGO_ALLOWED_HOSTS="*.railway.app"
```

### Add Databases via Dashboard
1. Go to Railway dashboard
2. Add PostgreSQL and Redis to the project
3. They'll auto-link

### Deploy Frontend
```bash
cd ../frontend
railway link
# Select the same project

railway up
# This deploys from the frontend directory

# Add variables
railway variables set NEXT_PUBLIC_API_URL="https://backend-url.railway.app"
railway variables set NODE_ENV="production"
```

---

## Method 3: Separate Repos (Nuclear Option)

If Railway keeps failing, create separate repos:

1. Create `aviator-backend` repo with just backend code
2. Create `aviator-frontend` repo with just frontend code
3. Deploy each separately on Railway

---

## Why This Keeps Failing

Railway sees this structure:
```
/
├── backend/
├── frontend/
└── other files
```

Without setting **Root Directory**, Railway tries to build from `/` which has no `package.json` or `requirements.txt` at the root level.

**Solution**: Tell Railway to build from `/backend` or `/frontend` by setting the Root Directory field.

---

## Screenshot Guide

**Where to find Root Directory setting:**

```
Railway Dashboard
    ↓
Click Your Project
    ↓
Click Service Card
    ↓
Click "Settings" Tab (top)
    ↓
Scroll to "Service" or "Source" Section
    ↓
Find "Root Directory" Input Field
    ↓
Type: backend  (or frontend)
    ↓
Click outside field (auto-saves)
    ↓
Go to "Deployments" Tab
    ↓
Click "Deploy" Button
```

---

## Generate Django Secret Key

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Or visit: https://djecrety.ir/

---

## Checklist

- [ ] Backend service created
- [ ] Backend root directory set to `backend`
- [ ] Backend environment variables added
- [ ] PostgreSQL database added
- [ ] Redis database added
- [ ] Database URLs linked to backend
- [ ] Backend deployed successfully
- [ ] Frontend service created
- [ ] Frontend root directory set to `frontend`
- [ ] Frontend environment variables added
- [ ] Frontend deployed successfully
- [ ] Test the live app

---

## Still Not Working?

If Railway continues to fail, consider these alternatives:

1. **Render.com** - Better monorepo support
2. **Vercel (Frontend) + Railway (Backend)** - Hybrid approach
3. **DigitalOcean App Platform** - Simpler configuration
4. **Heroku** - Classic PaaS with good docs

Let me know if you want me to create configs for any of these alternatives.

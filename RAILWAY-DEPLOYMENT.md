# Railway Deployment Guide

## Overview

This Aviator game is a **monorepo** with separate frontend and backend services. You need to deploy them as **3 separate Railway services**:

1. **Frontend** (Next.js)
2. **Backend** (Django)
3. **Database** (PostgreSQL)
4. **Redis** (for WebSocket/Channels)

---

## Step-by-Step Deployment

### 1. Create a Railway Project

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your repository: `yassin549/test`

### 2. Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will automatically create the database
4. Note: The `DATABASE_URL` environment variable is auto-generated

### 3. Add Redis

1. Click **"+ New"**
2. Select **"Database"** → **"Redis"**
3. Railway will automatically create Redis
4. Note: The `REDIS_URL` environment variable is auto-generated

### 4. Deploy Backend (Django)

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repo: `yassin549/test`
3. Click **"Add variables"** and set:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`

4. Add environment variables:
   ```
   DJANGO_SECRET_KEY=your-secret-key-here-generate-a-long-random-string
   DJANGO_DEBUG=False
   DJANGO_ALLOWED_HOSTS=*.railway.app
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   NOWPAYMENTS_API_KEY=your-nowpayments-api-key
   NOWPAYMENTS_WEBHOOK_SECRET=your-webhook-secret
   NOWPAYMENTS_SANDBOX=True
   ```

5. Click **"Deploy"**

### 5. Deploy Frontend (Next.js)

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repo: `yassin549/test`
3. Click **"Settings"** and set:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Start Command**: `npm start`

4. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
   NEXT_PUBLIC_WS_URL=wss://${{Backend.RAILWAY_PUBLIC_DOMAIN}}
   NODE_ENV=production
   ```

5. Click **"Deploy"**

---

## Alternative: Deploy Each Service Separately

If the above doesn't work, deploy each service individually:

### Option A: Using Railway CLI

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Create project:**
   ```bash
   railway init
   ```

4. **Deploy Backend:**
   ```bash
   cd backend
   railway up
   ```

5. **Deploy Frontend:**
   ```bash
   cd ../frontend
   railway up
   ```

### Option B: Using Railway Dashboard (Recommended)

1. **Create 3 separate services manually:**
   - Service 1: Backend (set root directory to `backend`)
   - Service 2: Frontend (set root directory to `frontend`)
   - Service 3: PostgreSQL (from templates)
   - Service 4: Redis (from templates)

2. **For Backend Service:**
   - Go to **Settings** → **Source**
   - Set **Root Directory**: `backend`
   - Set **Build Command**: `pip install -r requirements.txt`
   - Set **Start Command**: `python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`

3. **For Frontend Service:**
   - Go to **Settings** → **Source**
   - Set **Root Directory**: `frontend`
   - Set **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - Set **Start Command**: `npm start`

---

## Environment Variables Reference

### Backend Variables
```env
# Django Core
DJANGO_SECRET_KEY=<generate-random-50-char-string>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=*.railway.app
DJANGO_SETTINGS_MODULE=config.settings

# Database (auto-provided by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (auto-provided by Railway)
REDIS_URL=${{Redis.REDIS_URL}}

# CORS
CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>.railway.app

# NowPayments
NOWPAYMENTS_API_KEY=<your-api-key>
NOWPAYMENTS_WEBHOOK_SECRET=<your-webhook-secret>
NOWPAYMENTS_SANDBOX=True

# Optional
PORT=8000
```

### Frontend Variables
```env
# API URLs
NEXT_PUBLIC_API_URL=https://<your-backend-domain>.railway.app
NEXT_PUBLIC_WS_URL=wss://<your-backend-domain>.railway.app

# Environment
NODE_ENV=production
```

---

## Troubleshooting

### Build Fails: "Could not determine how to build"
- **Solution**: Set the **Root Directory** in Railway settings to either `frontend` or `backend`

### Frontend can't connect to Backend
- **Solution**: Update `NEXT_PUBLIC_API_URL` with your backend's Railway domain
- **Solution**: Add frontend domain to `CORS_ALLOWED_ORIGINS` in backend

### Database connection fails
- **Solution**: Ensure `DATABASE_URL` is set to `${{Postgres.DATABASE_URL}}`
- **Solution**: Run migrations: `python manage.py migrate`

### WebSocket connection fails
- **Solution**: Ensure `REDIS_URL` is set correctly
- **Solution**: Check that Channels is properly configured

### Static files not loading
- **Solution**: Run `python manage.py collectstatic --noinput` in build command
- **Solution**: Configure `STATIC_ROOT` and `STATIC_URL` in Django settings

---

## Post-Deployment Checklist

- [ ] Backend is accessible at `https://<backend>.railway.app`
- [ ] Frontend is accessible at `https://<frontend>.railway.app`
- [ ] Database migrations ran successfully
- [ ] WebSocket connections work (test in game)
- [ ] API calls from frontend to backend work
- [ ] NowPayments webhook is configured with Railway URL
- [ ] CORS is properly configured
- [ ] Environment variables are set correctly

---

## Monitoring & Logs

- View logs in Railway dashboard for each service
- Set up health checks for backend: `/health/` endpoint
- Monitor database usage in PostgreSQL service
- Check Redis connection in backend logs

---

## Scaling

Once deployed, you can scale:
- **Replicas**: Increase number of instances
- **Resources**: Upgrade RAM/CPU
- **Database**: Upgrade PostgreSQL plan
- **Redis**: Upgrade Redis plan

---

## Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Click **"Generate Domain"** or **"Custom Domain"**
3. Add your custom domain and configure DNS

---

## Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check logs in Railway dashboard for errors

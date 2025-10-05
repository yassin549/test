# Railway CLI Deployment

## Install Railway CLI

```bash
npm install -g @railway/cli
```

## Login

```bash
railway login
```

## Deploy Backend

```bash
cd backend
railway init
railway up
```

When prompted:
- Select "Create new project" or use existing
- Name it "aviator-backend"

Add environment variables:
```bash
railway variables set DJANGO_SECRET_KEY="your-secret-key"
railway variables set DJANGO_DEBUG="False"
railway variables set DJANGO_ALLOWED_HOSTS="*.railway.app"
railway variables set NOWPAYMENTS_API_KEY="your-key"
railway variables set NOWPAYMENTS_WEBHOOK_SECRET="your-secret"
railway variables set NOWPAYMENTS_SANDBOX="True"
```

## Deploy Frontend

```bash
cd ../frontend
railway init
railway up
```

When prompted:
- Select "Create new project" or use existing
- Name it "aviator-frontend"

Add environment variables:
```bash
railway variables set NEXT_PUBLIC_API_URL="https://your-backend.railway.app"
railway variables set NEXT_PUBLIC_WS_URL="wss://your-backend.railway.app"
railway variables set NODE_ENV="production"
```

## Add Databases

In Railway dashboard:
1. Add PostgreSQL to backend project
2. Add Redis to backend project
3. Link them to backend service

---

## Simpler Alternative: Manual Service Creation

1. **Create a new Railway project**
2. **Add 4 services manually:**

### Service 1: PostgreSQL
- Click "+ New"
- Select "Database" → "PostgreSQL"

### Service 2: Redis
- Click "+ New"
- Select "Database" → "Redis"

### Service 3: Backend
- Click "+ New"
- Select "GitHub Repo"
- Choose `yassin549/test`
- **IMPORTANT**: Go to Settings → Source → Set Root Directory to `backend`
- Add environment variables (see QUICK-DEPLOY.md)

### Service 4: Frontend
- Click "+ New"
- Select "GitHub Repo"
- Choose `yassin549/test` again
- **IMPORTANT**: Go to Settings → Source → Set Root Directory to `frontend`
- Add environment variables (see QUICK-DEPLOY.md)

---

## The Key Issue

Railway is trying to build from the root directory, which contains multiple apps. You MUST set the root directory for each service to tell Railway which subdirectory to build.

**Root Directory Setting Location:**
```
Railway Dashboard → Service → Settings → Source → Root Directory
```

Set it to:
- `backend` for Django service
- `frontend` for Next.js service
```

# Deployment Summary

## What Was Added

### Configuration Files
- ✅ `railway.json` - Root Railway config
- ✅ `frontend/railway.json` - Frontend Railway config
- ✅ `backend/railway.json` - Backend Railway config
- ✅ `frontend/nixpacks.toml` - Nixpacks build config for frontend
- ✅ `backend/nixpacks.toml` - Nixpacks build config for backend
- ✅ `frontend/Procfile` - Process file for frontend
- ✅ `backend/Procfile` - Process file for backend

### Documentation
- ✅ `RAILWAY-DEPLOYMENT.md` - Comprehensive deployment guide
- ✅ `QUICK-DEPLOY.md` - 5-minute quick start guide

### Backend Updates
- ✅ Added `whitenoise` for static file serving
- ✅ Updated `ALLOWED_HOSTS` to read from environment
- ✅ Updated `CORS_ALLOWED_ORIGINS` to read from environment
- ✅ Added `STATIC_ROOT` for production static files
- ✅ Added WhiteNoise middleware

---

## Next Steps

### 1. Commit and Push
```bash
git add .
git commit -m "feat: add Railway deployment configuration"
git push origin main
```

### 2. Deploy on Railway

Follow the **QUICK-DEPLOY.md** guide:

1. **Create PostgreSQL database**
2. **Create Redis database**
3. **Deploy Backend** (set root directory to `backend`)
4. **Deploy Frontend** (set root directory to `frontend`)

### 3. Set Environment Variables

#### Backend Variables
```env
DJANGO_SECRET_KEY=<generate-50-char-random-string>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=*.railway.app
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
CORS_ALLOWED_ORIGINS=https://<frontend-url>.railway.app
NOWPAYMENTS_API_KEY=<your-key>
NOWPAYMENTS_WEBHOOK_SECRET=<your-secret>
NOWPAYMENTS_SANDBOX=True
```

#### Frontend Variables
```env
NEXT_PUBLIC_API_URL=https://<backend-url>.railway.app
NEXT_PUBLIC_WS_URL=wss://<backend-url>.railway.app
NODE_ENV=production
```

### 4. Generate Django Secret Key

Run locally:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Or visit: https://djecrety.ir/

---

## Architecture

```
┌─────────────────┐
│   PostgreSQL    │
│   (Railway)     │
└────────┬────────┘
         │
         │
┌────────▼────────┐      ┌─────────────────┐
│     Redis       │◄─────┤   Backend       │
│   (Railway)     │      │   (Django)      │
└─────────────────┘      │   Port: 8000    │
                         └────────┬────────┘
                                  │
                                  │ API/WebSocket
                                  │
                         ┌────────▼────────┐
                         │   Frontend      │
                         │   (Next.js)     │
                         │   Port: 3000    │
                         └─────────────────┘
```

---

## Deployment Checklist

- [ ] Commit and push all files
- [ ] Create Railway project
- [ ] Add PostgreSQL database
- [ ] Add Redis database
- [ ] Deploy backend with environment variables
- [ ] Deploy frontend with environment variables
- [ ] Test backend health endpoint
- [ ] Test frontend loads
- [ ] Test WebSocket connection
- [ ] Test API calls
- [ ] Configure NowPayments webhook URL
- [ ] Test deposit flow
- [ ] Test game rounds
- [ ] Monitor logs for errors

---

## Troubleshooting

### Build Fails
- Check logs in Railway dashboard
- Verify root directory is set correctly
- Ensure all environment variables are set

### Frontend Can't Connect to Backend
- Verify `NEXT_PUBLIC_API_URL` is correct
- Add frontend URL to backend's `CORS_ALLOWED_ORIGINS`

### Database Connection Fails
- Ensure `DATABASE_URL` is set to `${{Postgres.DATABASE_URL}}`
- Check if migrations ran successfully

### WebSocket Fails
- Verify `REDIS_URL` is set correctly
- Check Redis connection in backend logs

---

## Post-Deployment

### Monitor
- Check Railway logs for errors
- Monitor database usage
- Monitor Redis connections

### Scale
- Increase replicas if needed
- Upgrade database plan if needed
- Upgrade Redis plan if needed

### Custom Domain
- Add custom domain in Railway settings
- Configure DNS records
- Update environment variables with new domain

---

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check `RAILWAY-DEPLOYMENT.md` for detailed troubleshooting

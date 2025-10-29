# Railway Deployment Guide - Luster AI

Quick-start guide to deploy Luster AI to Railway in under 15 minutes.

## 🚀 Quick Overview

This monorepo deploys 3 services to Railway:
- **API Service** (FastAPI backend)
- **Worker Service** (Python job processor)
- **Web Service** (Next.js frontend)

**Estimated Monthly Cost**: $10-50/month depending on usage

---

## Prerequisites

Before starting, ensure you have:
- [ ] Railway account (sign up at [railway.app](https://railway.app))
- [ ] Railway CLI installed: `npm i -g @railway/cli` or `brew install railway`
- [ ] OpenAI API key
- [ ] Supabase project (for auth)
- [ ] RevenueCat project (for payments)
- [ ] Git repository pushed to GitHub/GitLab

---

## Step 1: Create Railway Project

### Option A: Via Railway Dashboard (Recommended)

1. Go to [railway.app/new](https://railway.app/new)
2. Click "Deploy from GitHub repo"
3. Select your `Luster AI` repository
4. Railway will auto-detect it's a monorepo

### Option B: Via CLI

```bash
# Login to Railway
railway login

# Link to your project (or create new)
railway init

# This creates a railway.json file in your project
```

---

## Step 2: Add Database

1. In Railway dashboard, click **"+ New"**
2. Select **"Database" → "PostgreSQL"**
3. Railway will provision a Postgres instance
4. Copy the `DATABASE_URL` from the database service variables

**Note**: The DATABASE_URL will be automatically available as `${{Postgres.DATABASE_URL}}` to all services.

---

## Step 3: Create API Service

### Via Railway Dashboard:

1. Click **"+ New" → "Empty Service"**
2. Name it: `api`
3. Under **Settings**:
   - **Root Directory**: `services/api`
   - **Watch Paths**: `services/api/**`
4. Add a **Public Domain** (click "Generate Domain")

### Environment Variables for API:

Go to **Variables** tab and add:

```bash
# Database (Auto-provided by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# File Storage (using local disk for now)
UPLOADS_DIR=/app/uploads
OUTPUTS_DIR=/app/outputs

# Optional: Redis (if you add Redis service)
REDIS_URL=${{Redis.REDIS_URL}}

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0.05
ENVIRONMENT=production
APP_VERSION=1.0.0
LOG_LEVEL=INFO

# RevenueCat
REVENUECAT_WEBHOOK_SECRET=your_revenuecat_webhook_secret

# Port (Railway provides this automatically)
PORT=${{PORT}}
```

### Deploy:
Railway will auto-deploy when you push to your main branch, or click **"Deploy"** manually.

---

## Step 4: Create Worker Service

### Via Railway Dashboard:

1. Click **"+ New" → "Empty Service"**
2. Name it: `worker`
3. Under **Settings**:
   - **Root Directory**: `services/worker`
   - **Watch Paths**: `services/worker/**`
4. **No public domain needed** (internal service)

### Environment Variables for Worker:

```bash
# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# File Storage
UPLOADS_DIR=/app/uploads
OUTPUTS_DIR=/app/outputs

# Optional: Redis
REDIS_URL=${{Redis.REDIS_URL}}
```

---

## Step 5: Create Web Service

### Via Railway Dashboard:

1. Click **"+ New" → "Empty Service"**
2. Name it: `web`
3. Under **Settings**:
   - **Root Directory**: `apps/web`
   - **Watch Paths**: `apps/web/**`
4. Add a **Public Domain** (click "Generate Domain")

### Environment Variables for Web:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# API Backend URL (from API service)
NEXT_PUBLIC_API_URL=${{api.RAILWAY_PUBLIC_DOMAIN}}

# Database (if web app connects directly)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# App URL (for redirects, emails, etc.)
APP_URL=${{WEB.RAILWAY_PUBLIC_DOMAIN}}
```

---

## Step 6: Configure Service Connections

Railway automatically handles internal networking. Services can reference each other using:

```bash
# In Web service, reference API:
NEXT_PUBLIC_API_URL=https://${{api.RAILWAY_PUBLIC_DOMAIN}}

# In Worker, reference Redis:
REDIS_URL=${{Redis.REDIS_URL}}
```

---

## Step 7: Run Database Migrations

After deploying the API service:

### Option A: Via Railway CLI

```bash
# Connect to your API service
railway link

# Select the "api" service

# Run migrations
railway run alembic upgrade head
```

### Option B: Via Railway Dashboard

1. Go to **API service → Settings → Deployments**
2. Click on the latest deployment
3. Open **"Shell"** or **"Logs"**
4. Run: `alembic upgrade head`

---

## Step 8: Verify Deployment

### Check API Health:

```bash
# Using your Railway API domain
curl https://your-api.railway.app/health

# Expected response:
# {"status": "healthy", "services": {"database": "healthy"}}
```

### Check Admin Dashboard:

Visit: `https://your-api.railway.app/admin/dashboard`

You should see:
- ✅ System health status
- 📊 Job statistics
- 👷 Worker activity
- 📈 Metrics

### Check Web App:

Visit: `https://your-web.railway.app`
- Should load the Luster AI landing/login page
- Supabase auth should work

### Check Worker:

In Railway dashboard:
1. Go to **Worker service → Logs**
2. You should see: `Worker started successfully` and polling logs

---

## Step 9: Configure Domain (Optional)

### Custom Domain for API:

1. Go to **API service → Settings → Domains**
2. Click **"Add Domain"**
3. Enter: `api.yourdomain.com`
4. Add the CNAME record to your DNS provider
5. Railway auto-provisions SSL via Let's Encrypt

### Custom Domain for Web:

1. Go to **Web service → Settings → Domains**
2. Add: `app.yourdomain.com` or `yourdomain.com`
3. Configure DNS CNAME

---

## Troubleshooting

### API Service Won't Start

**Check Logs:**
```bash
railway logs --service api
```

**Common Issues:**
- ❌ Missing `DATABASE_URL` → Add Postgres service
- ❌ Missing `OPENAI_API_KEY` → Add to env vars
- ❌ Port binding error → Ensure `uvicorn` uses `$PORT`

### Worker Service Not Processing Jobs

**Check Worker Logs:**
```bash
railway logs --service worker
```

**Common Issues:**
- ❌ Worker exiting immediately → Check DATABASE_URL
- ❌ No jobs processing → Verify worker can connect to DB
- ❌ OpenAI errors → Check OPENAI_API_KEY validity

### Web Service Build Fails

**Common Issues:**
- ❌ `npm install` fails → Check package.json dependencies
- ❌ Next.js build fails → Ensure NEXT_PUBLIC_* vars are set at build time
- ❌ Runtime errors → Check browser console for API connection issues

### Database Connection Issues

**Verify DATABASE_URL:**
```bash
railway variables --service api

# Should show: DATABASE_URL=postgresql://...
```

**Test Connection:**
```bash
railway run --service api python -c "from database import get_db; next(get_db())"
```

---

## Monitoring & Maintenance

### View Service Logs

```bash
# API logs
railway logs --service api

# Worker logs (realtime)
railway logs --service worker --follow

# Web logs
railway logs --service web
```

### Check Resource Usage

In Railway dashboard:
1. Click on each service
2. View **"Metrics"** tab
3. Monitor CPU, Memory, Network usage

### Scale Services

**Vertical Scaling** (more resources per instance):
1. Go to **Service → Settings → Resources**
2. Adjust memory/CPU limits

**Horizontal Scaling** (multiple instances):
- Available on Railway Pro plan
- Useful for API service under high load

---

## Cost Management

### Estimated Monthly Costs

**Starter (Low Traffic)**:
```
API Service:      $5-10/month
Worker Service:   $3-5/month
Web Service:      $5-10/month
Postgres:         $5/month
─────────────────────────────
Total:            $18-30/month
```

**Growing (Medium Traffic)**:
```
API Service:      $15-25/month
Worker Service:   $10-15/month
Web Service:      $10-15/month
Postgres:         $10/month
Redis (optional): $5/month
─────────────────────────────
Total:            $50-70/month
```

### Cost Optimization Tips

1. **Use Sleep Mode** (Hobby plan):
   - Railway sleeps services after inactivity
   - Good for development/staging

2. **Optimize Worker**:
   - Worker only needs to run when jobs exist
   - Consider on-demand scaling

3. **Monitor Sentry Usage**:
   - Keep `SENTRY_TRACES_SAMPLE_RATE` low (0.05 = 5%)
   - Free tier: 100K spans/month

4. **Use Railway Metrics**:
   - Set up usage alerts at $25, $50, $75
   - Monitor daily to avoid surprises

---

## Deployment Checklist

Before going live:

### Security
- [ ] Admin dashboard authentication enabled
- [ ] CORS configured for production domains only
- [ ] Environment variables not committed to git
- [ ] Supabase RLS policies enabled
- [ ] RevenueCat webhook signature verification enabled

### Performance
- [ ] Database indexes created (see migrations)
- [ ] Sentry sampling rate configured (0.05 for prod)
- [ ] Image uploads tested end-to-end
- [ ] Worker processing speed acceptable

### Monitoring
- [ ] Sentry project created and DSN configured
- [ ] Admin dashboard accessible
- [ ] Railway metrics alerts configured
- [ ] Health check endpoints working

### Backups
- [ ] Railway Postgres backups enabled (automatic)
- [ ] Cloudflare R2 versioning enabled (for images)
- [ ] Database backup strategy documented

---

## CI/CD Setup

Railway auto-deploys when you push to your main branch. To customize:

### Automatic Deployments

Railway watches your GitHub repository and automatically deploys when:
- Commits pushed to `main` branch
- Files changed in service's watch path (e.g., `services/api/**`)

### Manual Deployment

```bash
# Deploy specific service
railway up --service api

# Or via dashboard
# Click service → Deployments → "Deploy Latest"
```

### Branch Deployments

Create separate Railway projects for:
- **Production**: Deploys from `main`
- **Staging**: Deploys from `staging`
- **Development**: Deploys from `develop`

---

## Rollback Procedure

If something goes wrong:

### Via Railway Dashboard:

1. Go to **Service → Deployments**
2. Find the last working deployment
3. Click **"⋯" → "Redeploy"**

### Via CLI:

```bash
# View deployment history
railway status

# Rollback to previous deployment
railway rollback
```

---

## Next Steps

After successful deployment:

1. **Set up monitoring alerts** (Sentry, Railway)
2. **Configure custom domains** (optional)
3. **Create staging environment** (separate Railway project)
4. **Enable automated backups** (Railway Postgres)
5. **Document incident response procedures**
6. **Add CI/CD tests** (optional: run tests before deploy)

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Luster AI Docs**: See `DEPLOYMENT.md` for monitoring details
- **Admin Dashboard**: `https://your-api.railway.app/admin/dashboard`

---

## Quick Command Reference

```bash
# Login to Railway
railway login

# Link to project
railway link

# View all services
railway status

# View logs (realtime)
railway logs --service api --follow

# Run migrations
railway run --service api alembic upgrade head

# Open service in browser
railway open --service web

# View environment variables
railway variables --service api

# Shell into running container
railway shell --service api
```

---

**Last Updated**: January 2025
**Maintainer**: Luster AI Team

**Questions?** Open an issue on GitHub or reach out on Discord.

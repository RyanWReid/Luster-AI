# Luster AI Deployment Guide

Production deployment checklist and monitoring setup for Railway.

## Pre-Deployment Checklist

### 1. Environment Variables

Set these in Railway dashboard for each service:

#### API Service
```bash
# Required
DATABASE_URL=<railway-postgres-url>
OPENAI_API_KEY=<your-openai-key>

# Storage (if using R2/S3)
UPLOADS_DIR=/app/uploads
OUTPUTS_DIR=/app/outputs

# Monitoring (Recommended)
SENTRY_DSN=<your-sentry-dsn>
SENTRY_TRACES_SAMPLE_RATE=0.05  # Start low in prod, increase if needed
ENVIRONMENT=production
APP_VERSION=1.0.0

# Optional: Redis Queue
REDIS_URL=<railway-redis-url>

# Logging
LOG_LEVEL=INFO
```

#### Worker Service
```bash
# Same as API, plus:
# Add worker-specific vars if needed
```

### 2. Sentry Setup (Recommended)

1. Sign up at [sentry.io](https://sentry.io) (free tier: 100K spans/month)
2. Create new project → FastAPI
3. Copy DSN to `SENTRY_DSN` env var
4. Set `SENTRY_TRACES_SAMPLE_RATE=0.05` (5% sampling for production)

**Cost Management:**
- Free tier: 100K spans/month
- Paid: $29/mo for 500K spans
- Calculate: `requests/mo × 5 spans × sample_rate`
- Example: 100K requests × 5 × 0.05 = 25K spans (free!)

### 3. Railway Configuration

#### Networking
- Enable Public Networking for API service
- Note the generated domain (e.g., `your-app.up.railway.app`)

#### Resources
- API: 1GB RAM, 0.5 vCPU (adjust based on traffic)
- Worker: 512MB RAM, 0.5 vCPU
- Database: Postgres (Railway managed)
- Redis: Optional (Railway managed)

#### Estimated Costs
```
Light traffic (<10K jobs/mo):  $10-20/month
Medium traffic (<100K jobs/mo): $50-100/month
Heavy traffic (>100K jobs/mo):  $150-300/month
```

## Deployment Steps

### Step 1: Push Code

```bash
# From feature branch
git checkout feature/monitoring-observability

# Review changes
git log main..HEAD --oneline

# Merge to main
git checkout main
git merge feature/monitoring-observability
git push origin main
```

### Step 2: Deploy to Railway

```bash
# Railway will auto-deploy on push to main
# Or manually trigger via Railway dashboard

# Monitor deployment
railway logs --service api
railway logs --service worker
```

### Step 3: Verify Deployment

#### Health Checks
```bash
# System health
curl https://your-app.up.railway.app/health

# Admin health (detailed)
curl https://your-app.up.railway.app/admin/health

# Should return:
# {
#   "status": "healthy",
#   "services": {"database": "healthy", "redis": "healthy"},
#   "workers": {"estimated_active": 1}
# }
```

#### Monitoring Dashboard
Visit: `https://your-app.up.railway.app/admin/dashboard`

Should show:
- ✅ Green system health indicator
- 📊 Job statistics
- 👷 Worker activity
- 📈 System metrics

### Step 4: Test Worker Processing

```bash
# Create a test job
curl -X POST https://your-app.up.railway.app/jobs \
  -F "asset_id=<test-asset-id>" \
  -F "prompt=Test enhancement" \
  -F "tier=premium"

# Check job status
curl https://your-app.up.railway.app/jobs/<job-id>

# Verify in admin dashboard
# Jobs should transition: queued → processing → succeeded
```

### Step 5: Enable Optional Features

#### A. RQ Dashboard (Redis Queue Monitoring)

If using Redis workers:

```bash
# Install in API service
pip install rq-dashboard-fast

# Dashboard will auto-mount at /admin/rq
# Visit: https://your-app.up.railway.app/admin/rq
```

#### B. OpenTelemetry (Advanced Tracing)

For distributed tracing:

```bash
# Install dependencies
pip install -r requirements-monitoring.txt

# Configure exporter (Grafana Cloud, Jaeger, etc.)
# Add to .env:
OTLP_ENDPOINT=https://otlp.grafana.com
OTLP_HEADERS=Authorization=Bearer <token>
```

## Post-Deployment Monitoring

### Day 1: Initial Monitoring

1. **Watch Sentry Dashboard**
   - Check for errors in first 100 requests
   - Review performance traces (P50, P95, P99)
   - Verify no recurring errors

2. **Monitor Admin Dashboard**
   - Worker activity: should show active workers
   - Success rate: should be > 95%
   - Queue depth: should be < 20 jobs

3. **Check Railway Metrics**
   - CPU usage: should be < 50% under normal load
   - Memory: should be stable (no leaks)
   - Response times: should be < 500ms (P95)

### Week 1: Tune Configuration

Based on real traffic:

#### Sentry Sampling
```bash
# If spans < 50K/month (well under limit)
SENTRY_TRACES_SAMPLE_RATE=0.1  # Increase to 10%

# If spans > 80K/month (approaching limit)
SENTRY_TRACES_SAMPLE_RATE=0.02  # Decrease to 2%
```

#### Worker Scaling
```bash
# If queue depth consistently > 50
# Scale up workers in Railway dashboard

# If workers idle (no jobs processing)
# Scale down to save costs
```

#### Database Connection Pool
```python
# In database.py, adjust if seeing connection issues
engine = create_engine(
    DATABASE_URL,
    pool_size=10,  # Increase if seeing "pool exhausted"
    max_overflow=20,
)
```

## Alerting Setup

### Sentry Alerts

Configure in Sentry dashboard:

1. **Error Rate Alert**
   - Condition: Error rate > 5% in 5 minutes
   - Action: Email + Slack notification

2. **Performance Alert**
   - Condition: P95 response time > 2 seconds
   - Action: Email notification

3. **Failed Jobs Alert**
   - Condition: Job failure rate > 10%
   - Action: Slack notification

### Railway Alerts

Configure in Railway dashboard → Settings → Alerts:

1. **High CPU Usage**
   - Threshold: > 80% for 5 minutes
   - Action: Email notification

2. **Memory Warning**
   - Threshold: > 90% for 5 minutes
   - Action: Email + auto-scale

3. **Service Down**
   - Threshold: Health check fails 3x
   - Action: Immediate email + Slack

## Troubleshooting

### Workers Not Processing Jobs

**Symptoms:**
- Jobs stuck in `queued` status
- Admin dashboard shows 0 active workers
- Queue depth increasing

**Solutions:**
```bash
# Check worker logs
railway logs --service worker

# Common issues:
# 1. Worker not running
railway ps  # Verify worker service is up

# 2. Database connection issues
# Check DATABASE_URL is correct

# 3. Redis connection issues (if using RQ)
# Check REDIS_URL is correct and Redis service is running
```

### High Sentry Costs

**Symptoms:**
- Spans usage > 100K/month (free tier limit)
- Unexpected charges

**Solutions:**
```bash
# 1. Lower sampling rate
SENTRY_TRACES_SAMPLE_RATE=0.02  # 2% instead of 25%

# 2. Filter non-critical endpoints
# In main.py:
sentry_sdk.init(
    # ...
    ignore_transactions=[
        "/health",  # Don't trace health checks
        "/admin/*",  # Don't trace admin endpoints
    ]
)

# 3. Use release health only (free)
# Disable performance monitoring temporarily
SENTRY_TRACES_SAMPLE_RATE=0.0
```

### Database Performance Issues

**Symptoms:**
- Slow response times (> 1s)
- Admin queries timing out
- High database CPU in Railway

**Solutions:**
```bash
# 1. Add database indexes
# Create migration:
alembic revision -m "add job status index"

# In migration file:
def upgrade():
    op.create_index('idx_jobs_status', 'jobs', ['status'])
    op.create_index('idx_jobs_created_at', 'jobs', ['created_at'])

# Run migration
alembic upgrade head

# 2. Optimize queries in admin.py
# Use query.limit() for large result sets
# Add pagination for recent jobs endpoint

# 3. Scale database in Railway
# Upgrade to larger Postgres plan if needed
```

## Security Checklist

### Production Security

- [ ] Admin dashboard authentication enabled
- [ ] CORS restricted to your domain only
- [ ] Sentry PII protection enabled (`send_default_pii=False`)
- [ ] Environment variables not in code
- [ ] Railway IP allowlist configured (optional)
- [ ] SSL/TLS enabled (automatic with Railway)
- [ ] Database credentials rotated
- [ ] API rate limiting enabled (TODO)

### Admin Dashboard Security

**Option 1: HTTP Basic Auth** (Quick)
```python
# In admin.py
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets

security = HTTPBasic()

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = secrets.compare_digest(credentials.username, "admin")
    correct_password = secrets.compare_digest(
        credentials.password, os.getenv("ADMIN_PASSWORD")
    )
    if not (correct_username and correct_password):
        raise HTTPException(status_code=401)
    return credentials.username

# Add to all admin routes
@router.get("/dashboard")
def admin_dashboard(username: str = Depends(verify_admin)):
    ...
```

**Option 2: Supabase JWT** (Recommended)
```python
# Verify Supabase token for admin routes
# Reuse existing auth middleware
```

**Option 3: Railway IP Allowlist**
- Configure in Railway dashboard
- Only allow office/VPN IPs to access `/admin/*`

## Rollback Plan

If deployment fails:

```bash
# 1. Quick rollback in Railway dashboard
# Click "Redeploy" on previous successful deployment

# 2. Or rollback code
git revert HEAD
git push origin main

# 3. Verify services recovered
curl https://your-app.up.railway.app/health
```

## Cost Monitoring

### Monthly Cost Breakdown

**Baseline (MVP):**
```
Railway Infrastructure: $10-20/month
- API service: ~$5/month
- Worker service: ~$5/month
- Database: $5/month
- Redis (optional): $5/month

Sentry (optional): $0-29/month
- Free tier: $0 (up to 100K spans)
- Team plan: $29/month (if exceeding free tier)

Total: $10-50/month
```

**Growing (1K jobs/day):**
```
Railway Infrastructure: $50-100/month
Sentry: $29/month (likely needed)
Total: $80-130/month
```

**Scale (10K jobs/day):**
```
Railway Infrastructure: $150-300/month
Sentry: $29-100/month
Total: $180-400/month
```

### Cost Optimization Tips

1. **Start conservative with sampling**
   - Begin with `SENTRY_TRACES_SAMPLE_RATE=0.05`
   - Increase only if you need more visibility

2. **Scale workers based on queue depth**
   - Don't run workers 24/7 if jobs are rare
   - Use Railway's sleep feature for idle services

3. **Monitor Railway usage dashboard**
   - Check daily to avoid surprise costs
   - Set usage alerts at $50, $100, $200

4. **Use Railway's free tier effectively**
   - $5 included usage per month
   - Good for development/staging environments

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Sentry Docs**: https://docs.sentry.io
- **Luster AI Monitoring**: See `services/api/MONITORING.md`
- **Admin Dashboard**: `https://your-app.up.railway.app/admin/dashboard`
- **Sentry Dashboard**: https://sentry.io/organizations/your-org/projects/

## Next Steps

After successful deployment:

1. Set up automated backups (Railway Postgres backup)
2. Configure custom domain (optional)
3. Set up staging environment
4. Create runbook for common issues
5. Document incident response procedures

---

**Last Updated**: October 2025
**Maintainer**: Luster AI Team

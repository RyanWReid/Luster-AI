# Luster AI Monitoring & Observability

Production-grade monitoring system for tracking workers, jobs, and system health.

## Features

### 1. Admin Dashboard
Beautiful HTML dashboard with live updates (no build step required)

**URL**: `http://localhost:8000/admin/dashboard`

Features:
- Real-time system health status
- Worker activity tracking
- Job statistics (24h)
- Queue monitoring
- Recent jobs list with processing times

Auto-refreshes every 5-10 seconds using HTMX.

### 2. Admin API Endpoints

#### Health Check
```bash
GET /admin/health
```
Returns comprehensive system health including database, Redis, workers, and queues.

#### Worker Status
```bash
GET /admin/workers
```
Shows active workers and their activity (inferred from job processing).

#### Job Statistics
```bash
GET /admin/jobs/stats?hours=24
```
Returns job counts by status, success rate, and average processing time.

Parameters:
- `hours` (optional): Time period to analyze (default: 24)

#### Recent Jobs
```bash
GET /admin/jobs/recent?limit=20&status=processing
```
Lists recent jobs with optional filtering.

Parameters:
- `limit` (optional): Number of jobs to return (default: 20, max: 100)
- `status` (optional): Filter by status (queued, processing, succeeded, failed)

#### System Metrics
```bash
GET /admin/metrics
```
Overall system metrics including totals and current queue depth.

### 3. RQ Dashboard (Optional)

If Redis is configured, RQ Dashboard Fast provides detailed queue monitoring.

**URL**: `http://localhost:8000/admin/rq`

**Installation**:
```bash
pip install rq-dashboard-fast
```

Features:
- View all Redis queues (high, default, low)
- Monitor job status and worker activity
- Inspect failed jobs
- Retry or delete jobs

### 4. Sentry Integration

Enhanced Sentry configuration for production monitoring.

**Configuration**:
```bash
# .env file
SENTRY_DSN=your-sentry-dsn-here
SENTRY_TRACES_SAMPLE_RATE=0.25  # 25% of requests (default)
ENVIRONMENT=production
APP_VERSION=1.0.0
```

**Features**:
- Automatic error tracking
- Performance monitoring (25% sampling)
- SQL query tracing
- Profile sampling (10%)
- Request → Worker → OpenAI full trace visibility

## Quick Start

### 1. Basic Monitoring (No dependencies)

The admin dashboard and API endpoints work out of the box:

```bash
# Start the API
cd services/api
python main.py

# Visit the dashboard
open http://localhost:8000/admin/dashboard
```

### 2. Enable RQ Dashboard

```bash
# Install RQ Dashboard
pip install rq-dashboard-fast

# Set Redis URL
export REDIS_URL=redis://localhost:6379/0

# Restart API - dashboard will auto-mount at /admin/rq
```

### 3. Enable Sentry

```bash
# Set Sentry DSN
export SENTRY_DSN=your-dsn-here

# Optional: Adjust sampling rate (0.0 to 1.0)
export SENTRY_TRACES_SAMPLE_RATE=0.25

# Restart API - Sentry will auto-initialize
```

## Production Deployment

### Railway Configuration

Add these environment variables to your Railway service:

```bash
# Sentry (Recommended)
SENTRY_DSN=<your-sentry-dsn>
SENTRY_TRACES_SAMPLE_RATE=0.1  # Lower in prod to reduce costs
ENVIRONMENT=production

# Redis (if using RQ workers)
REDIS_URL=<your-redis-url>
```

### Cost Optimization

**Sentry Sampling Rates:**
- Development: `0.25` (25%) - good visibility
- Staging: `0.1` (10%) - catch issues before prod
- Production: `0.05` (5%) - balance cost vs insight

Calculate your span usage:
```
Spans per month = Requests/month × Avg spans per request × Sample rate

Example: 100K requests × 5 spans × 0.05 = 25K spans/month
```

Sentry free tier: 100K spans/month
Sentry Team plan: $29/mo for additional spans

### Security Considerations

The admin endpoints are currently **unauthenticated**. For production:

**Option 1: Add Basic Auth** (Simple)
```python
# In admin.py, add dependency
from fastapi.security import HTTPBasic, HTTPBasicCredentials

security = HTTPBasic()

@router.get("/dashboard")
def admin_dashboard(credentials: HTTPBasicCredentials = Depends(security)):
    # Add authentication check
    ...
```

**Option 2: Use Railway's IP Allowlist** (Recommended)
Configure Railway to only allow your office/VPN IP addresses to access `/admin/*` routes.

**Option 3: Supabase Auth** (Best for team access)
Verify Supabase JWT tokens for admin routes.

## Monitoring Best Practices

### 1. Set Up Alerts

**Sentry Alerts** (Recommended):
- Error rate > 5% in 5 minutes
- Response time > 2 seconds (P95)
- Failed job rate > 10%

### 2. Dashboard Checks

Monitor daily:
- Worker activity (should always show recent completions)
- Queue depth (queued jobs should be < 100)
- Success rate (should be > 95%)
- Average processing time (track trends)

### 3. Troubleshooting

**No workers active?**
```bash
# Check if worker is running
ps aux | grep worker

# Check recent job completions
curl http://localhost:8000/admin/jobs/stats
```

**Jobs stuck in queue?**
```bash
# Check queue depth
curl http://localhost:8000/admin/metrics

# View queued jobs
curl http://localhost:8000/admin/jobs/recent?status=queued
```

**High failure rate?**
```bash
# Check recent failures
curl http://localhost:8000/admin/jobs/recent?status=failed

# View error messages in Sentry dashboard
```

## Future Enhancements

### Phase 2 (Optional)
- Worker heartbeat tracking (accurate worker counts)
- OpenTelemetry for distributed tracing
- Prometheus metrics export
- Custom Grafana dashboards

### Phase 3 (Scale)
- Alert system (email/Slack notifications)
- Performance profiling
- Cost tracking per job
- Historical trend analysis

## Support

For issues or questions:
1. Check Sentry for error traces
2. Review `/admin/health` for service status
3. Inspect `/admin/jobs/recent` for job failures
4. Check Railway logs for infrastructure issues

## Architecture

```
┌─────────────────────────────────────────┐
│  Admin Dashboard (HTMX)                 │
│  /admin/dashboard                        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Admin API Endpoints                     │
│  /admin/health, /admin/workers, etc.     │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
┌─────────────┐ ┌────────────┐
│  Database   │ │  Redis     │
│  (Jobs)     │ │  (Queues)  │
└─────────────┘ └────────────┘
        ▲             ▲
        │             │
        └──────┬──────┘
               │
        ┌──────┴──────┐
        ▼             ▼
┌─────────────┐ ┌────────────┐
│  DB Worker  │ │ RQ Workers │
│  (Polling)  │ │  (Redis)   │
└─────────────┘ └────────────┘
```

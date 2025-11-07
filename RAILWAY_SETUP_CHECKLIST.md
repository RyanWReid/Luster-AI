# Railway Setup Checklist - Follow Along

Complete these steps one by one. Check off each box as you go! ✅

---

## 🎯 Step 1: Create Railway Project

1. **Open your browser** and go to: **[railway.app/new](https://railway.app/new)**
2. Click **"Deploy from GitHub repo"**
3. **Authorize Railway** to access your GitHub account (if first time)
4. **Select repository**: `RyanWReid/Luster-AI`
5. Railway will create a new project

✅ **Checkpoint**: You should see a new Railway project dashboard

---

## 🗄️ Step 2: Add Postgres Database

1. In your Railway project, click **"+ New"** (top right)
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Railway will provision a Postgres instance (takes ~30 seconds)

✅ **Checkpoint**: You should see a "Postgres" service in your project

---

## 🔧 Step 3: Create API Service

1. Click **"+ New"** → **"Empty Service"**
2. Name it: **`api`**
3. Click on the **api** service card
4. Go to **"Settings"** tab (left sidebar)
5. Scroll to **"Service"** section:
   - **Root Directory**: `services/api`
   - **Watch Paths**: `services/api/**`
6. Go to **"Networking"** tab
7. Click **"Generate Domain"** (under Public Networking)
8. **Copy the domain URL** (e.g., `api-production-xxxx.up.railway.app`)

### Add Environment Variables:

1. Go to **"Variables"** tab
2. Click **"+ New Variable"** and add each of these:

```bash
# Database (click "Add Reference" instead of "New Variable")
DATABASE_URL → Reference → Postgres → DATABASE_URL

# OpenAI (Get from: https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-...your-key-here

# File Storage
UPLOADS_DIR=/app/uploads
OUTPUTS_DIR=/app/outputs

# Monitoring (Optional - skip for now)
SENTRY_DSN=https://...@sentry.io/...
SENTRY_TRACES_SAMPLE_RATE=0.05
ENVIRONMENT=production
APP_VERSION=1.0.0
LOG_LEVEL=INFO

# RevenueCat (Get from: RevenueCat Dashboard > Project Settings > Webhooks)
REVENUECAT_WEBHOOK_SECRET=your_secret_here
```

✅ **Checkpoint**: API service should start deploying automatically

---

## 👷 Step 4: Create Worker Service

1. Click **"+ New"** → **"Empty Service"**
2. Name it: **`worker`**
3. Click on the **worker** service card
4. Go to **"Settings"** tab
5. Under **"Service"** section:
   - **Root Directory**: `services/worker`
   - **Watch Paths**: `services/worker/**`

### Add Environment Variables:

1. Go to **"Variables"** tab
2. Add these variables:

```bash
# Database (Reference)
DATABASE_URL → Reference → Postgres → DATABASE_URL

# OpenAI (same key as API)
OPENAI_API_KEY=sk-proj-...your-key-here

# File Storage
UPLOADS_DIR=/app/uploads
OUTPUTS_DIR=/app/outputs
```

✅ **Checkpoint**: Worker service should deploy automatically

---

## 🌐 Step 5: Create Web Service

1. Click **"+ New"** → **"Empty Service"**
2. Name it: **`web`**
3. Click on the **web** service card
4. Go to **"Settings"** tab
5. Under **"Service"** section:
   - **Root Directory**: `apps/web`
   - **Watch Paths**: `apps/web/**`
6. Go to **"Networking"** tab
7. Click **"Generate Domain"**
8. **Copy the domain URL** (e.g., `web-production-xxxx.up.railway.app`)

### Add Environment Variables:

```bash
# Supabase (from your Supabase project)
NEXT_PUBLIC_SUPABASE_URL=https://rdzanmwdqmidwifviwyr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API URL (use the domain you copied from API service)
NEXT_PUBLIC_API_URL=https://api-production-xxxx.up.railway.app

# Database (Reference)
DATABASE_URL → Reference → Postgres → DATABASE_URL

# App URL (use the domain Railway generated for this web service)
APP_URL=https://web-production-xxxx.up.railway.app
```

✅ **Checkpoint**: Web service should deploy automatically

---

## 🗃️ Step 6: Run Database Migrations

**Important**: Wait for API service to finish deploying before running migrations!

### Check API Deployment Status:
1. Click on **api** service
2. Go to **"Deployments"** tab
3. Wait for status to show **"Success"** (green checkmark)

### Run Migrations:
1. In **api** service, go to **"Deployments"** tab
2. Click on the latest deployment
3. Click **"View Logs"**
4. At the bottom, find the command input or click **"Shell"**
5. Run this command:
   ```bash
   alembic upgrade head
   ```

✅ **Checkpoint**: You should see migration success messages

---

## ✅ Step 7: Verify Everything Works

### Test 1: Check API Health
1. Open your API domain in browser: `https://api-production-xxxx.up.railway.app/health`
2. You should see: `{"status": "healthy", "services": {"database": "healthy"}}`

### Test 2: Check Admin Dashboard
1. Visit: `https://api-production-xxxx.up.railway.app/admin/dashboard`
2. You should see the admin dashboard with system metrics

### Test 3: Check Web App
1. Visit your web domain: `https://web-production-xxxx.up.railway.app`
2. You should see the Luster AI login page

### Test 4: Check Worker Logs
1. Go to Railway dashboard
2. Click on **worker** service
3. Go to **"Deployments"** → Click latest → **"View Logs"**
4. You should see: `Worker started successfully` and polling messages

---

## 🎉 Success Checklist

- [ ] API service deployed and responding at `/health`
- [ ] Worker service running and polling for jobs
- [ ] Web service accessible and loading
- [ ] Database migrations completed
- [ ] All services showing green status in Railway

---

## 🚨 Troubleshooting

### API Service Won't Start

**Check Build Logs:**
1. Click **api** → **Deployments** → Latest → **View Logs**
2. Look for error messages

**Common Issues:**
- Missing `requirements.txt` → Check it exists in `services/api/`
- Missing environment variables → Double-check Variables tab
- Port binding issues → Railway sets `$PORT` automatically

### Worker Not Processing

**Check Worker Logs:**
1. Click **worker** → **Deployments** → **View Logs**

**Common Issues:**
- Can't connect to database → Verify `DATABASE_URL` reference
- OpenAI errors → Check `OPENAI_API_KEY` is valid

### Web Build Fails

**Common Issues:**
- Missing `NEXT_PUBLIC_*` vars → Add to Variables (must be set at build time)
- Node version mismatch → Railway auto-detects from `package.json`

---

## 📝 Important URLs to Save

After setup, save these URLs:

```
API Health:      https://api-production-xxxx.up.railway.app/health
Admin Dashboard: https://api-production-xxxx.up.railway.app/admin/dashboard
Web App:         https://web-production-xxxx.up.railway.app
Railway Project: https://railway.app/project/your-project-id
```

---

## 🎯 Next Steps

After successful deployment:

1. **Test photo upload** → Upload a photo and create a job
2. **Monitor worker** → Verify job gets processed
3. **Set up custom domain** (optional)
4. **Configure Sentry** for error monitoring (optional)
5. **Set up usage alerts** in Railway to track costs

---

## 💰 Cost Monitoring

**Expected Monthly Cost**: $20-50/month

Track your usage:
1. Go to Railway dashboard → **Billing**
2. Click **"Usage"**
3. Set up alerts at $25, $50, $75

---

**Questions?** Check `RAILWAY_DEPLOYMENT.md` for detailed troubleshooting or open an issue on GitHub.

**Last Updated**: January 2025

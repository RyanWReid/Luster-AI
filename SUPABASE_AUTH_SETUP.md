# Supabase Authentication Setup for Railway

## Overview
Your Supabase authentication is now implemented! Follow these steps to configure it in Railway.

## Required Environment Variables

Add these to your **API service** in Railway:

```bash
# Supabase Configuration
SUPABASE_URL=https://rdzanmwdqmidwifviwyr.supabase.co
SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
SUPABASE_JWKS_URL=https://rdzanmwdqmidwifviwyr.supabase.co/auth/v1/.well-known/jwks.json
```

## Step 1: Get Your Supabase Anon Key

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `rdzanmwdqmidwifviwyr`
3. Go to **Settings** → **API**
4. Find **Project API keys** section
5. Copy the **anon** key (public key, safe to use in frontend)

## Step 2: Add Variables to Railway

### Option 1: Railway Dashboard
1. Go to Railway → Your Project
2. Click **API service**
3. Go to **Variables** tab
4. Click **Raw Editor**
5. Add these lines:
   ```
   SUPABASE_URL=https://rdzanmwdqmidwifviwyr.supabase.co
   SUPABASE_ANON_KEY=<paste_your_anon_key_here>
   SUPABASE_JWKS_URL=https://rdzanmwdqmidwifviwyr.supabase.co/auth/v1/.well-known/jwks.json
   ```
6. Click **Save** → Service will auto-redeploy

### Option 2: Railway CLI
```bash
railway variables set SUPABASE_URL=https://rdzanmwdqmidwifviwyr.supabase.co --service api
railway variables set SUPABASE_ANON_KEY=<your_anon_key> --service api
railway variables set SUPABASE_JWKS_URL=https://rdzanmwdqmidwifviwyr.supabase.co/auth/v1/.well-known/jwks.json --service api
```

## Step 3: Configure Supabase Auth Settings

### Enable Email Auth in Supabase:
1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Enable **Email** provider
3. Disable **Confirm email** (for magic links to work instantly)
4. Configure **Email templates** (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize **Magic Link** template with your branding

### Configure Site URL:
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://luster-ai-production.up.railway.app`
3. Add **Redirect URLs**:
   - `https://luster-ai-production.up.railway.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for local testing)
   - `myapp://auth/callback` (for mobile deep linking)

## Step 4: Verify Deployment

After Railway redeploys, check that auth is working:

```bash
# 1. Check health endpoint
curl https://luster-ai-production.up.railway.app/health

# 2. Try to access protected endpoint (should fail with 401)
curl https://luster-ai-production.up.railway.app/shoots

# Expected: {"detail":"Not authenticated"}

# 3. Check auth endpoints are available
curl https://luster-ai-production.up.railway.app/docs
# Look for /auth/magic-link, /auth/session, /auth/me endpoints
```

## Step 5: Test Magic Link Flow

### Using curl:
```bash
# 1. Request magic link
curl -X POST https://luster-ai-production.up.railway.app/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "redirect_to": "https://luster-ai-production.up.railway.app/auth/callback"
  }'

# 2. Check your email for the magic link
# 3. Click the link (it will redirect to Supabase)
# 4. Supabase will redirect back with tokens in the URL
```

### Using the API docs:
1. Go to https://luster-ai-production.up.railway.app/docs
2. Find `POST /auth/magic-link`
3. Click **Try it out**
4. Enter your email
5. Execute and check your inbox

## Understanding the Auth Flow

### For Mobile App:

```
1. User enters email → POST /auth/magic-link
2. User receives email with magic link
3. User clicks link → Opens Supabase hosted page
4. Supabase redirects to myapp://auth/callback?access_token=...
5. Mobile app extracts access_token from deep link
6. Mobile app stores token and includes in requests:
   Authorization: Bearer <access_token>
7. API verifies token and auto-creates user if first time
```

### For Protected Endpoints:

```javascript
// Mobile app request with auth
fetch('https://luster-ai-production.up.railway.app/shoots', {
  headers: {
    'Authorization': 'Bearer ' + accessToken
  }
})
```

## What Happens Automatically

✅ **User Auto-Creation**: When a user first authenticates, the API automatically:
- Creates User record with their email
- Creates Credit record with 0 balance
- Links all future shoots/jobs to this user

✅ **Resource Ownership**: All endpoints now validate:
- Users can only see their own shoots
- Users can only upload to their own shoots
- Users can only create jobs for their own assets
- Credits are deducted from the authenticated user

✅ **Backward Compatibility**: Mobile endpoints (`/api/mobile/*`) still work without auth for testing:
- Falls back to DEFAULT_USER_ID if no token provided
- Logs warning for monitoring
- Will be removed once mobile app implements auth

## Security Notes

⚠️ **Important**:
- The `SUPABASE_ANON_KEY` is public and safe to use in frontend/mobile
- Never expose `SUPABASE_SERVICE_ROLE_KEY` (not needed for this setup)
- JWT tokens expire after 1 hour by default
- Refresh tokens handled by Supabase SDKs automatically

## Troubleshooting

### "Not authenticated" errors:
- Check `Authorization: Bearer <token>` header is included
- Verify token hasn't expired (decode at jwt.io)
- Check SUPABASE_JWKS_URL is correct in Railway

### Magic link not working:
- Check email provider isn't blocking Supabase emails
- Verify Site URL matches in Supabase settings
- Check redirect URL is in allowed list

### User not being created:
- Check Railway logs for errors
- Verify database connection is working
- Check User and Credit tables exist

## Next Steps

1. ✅ Add Supabase environment variables to Railway
2. ✅ Configure Supabase Auth settings
3. ✅ Test magic link flow
4. 🔲 Implement auth in mobile app
5. 🔲 Remove DEFAULT_USER_ID fallback from mobile endpoints
6. 🔲 Add refresh token handling in mobile app

## Documentation

See the following files for more details:
- `services/api/AUTH_IMPLEMENTATION.md` - Complete implementation guide
- `services/api/AUTH_QUICK_REFERENCE.md` - Quick reference for developers
- `services/api/AUTHENTICATION_SUMMARY.md` - Summary of what was implemented

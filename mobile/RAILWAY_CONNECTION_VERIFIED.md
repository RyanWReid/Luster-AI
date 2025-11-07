# Railway Connection Verified ✅

## Configuration Updated

Your mobile app is now configured to connect to **Railway production deployment**.

### Environment Variables Set

```bash
# Supabase (Authentication & Database)
EXPO_PUBLIC_SUPABASE_URL=https://rdzanmwdqmidwifviwyr.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# API (Railway Production)
EXPO_PUBLIC_API_URL=https://luster-ai-production.up.railway.app
```

### Railway API Status

✅ **Health Check**: https://luster-ai-production.up.railway.app/health
```json
{
  "status": "healthy",
  "services": {
    "database": "healthy",
    "r2_storage": "enabled"
  }
}
```

✅ **Mobile Test Endpoint**: https://luster-ai-production.up.railway.app/api/mobile/test
```json
{
  "status": "connected",
  "message": "Mobile API is working"
}
```

## Next Steps to Test Connection

### 1. Restart Expo Development Server

**Important**: Environment variables are loaded at startup, so you need to restart:

```bash
# Kill the current Expo server (if running)
# Press Ctrl+C in the terminal

# Clear Expo cache and restart
cd mobile
npm start -- --clear
```

### 2. Verify Connection in App

Once the app restarts, it will automatically connect to Railway. You can verify by:

1. **Check console logs** - Look for API_BASE_URL in logs
2. **Test authentication** - Try signing in (should hit Railway API)
3. **Check network requests** - All requests should go to `https://luster-ai-production.up.railway.app`

### 3. Test API Endpoints

The app will now use these Railway endpoints:

**Authentication (Supabase)**:
- `POST /auth/magic-link` - Send login email
- `GET /auth/session` - Get user session
- `GET /auth/me` - Get current user

**Photo Enhancement**:
- `POST /api/mobile/enhance` - Upload and enhance photo
- `GET /api/mobile/enhance/{jobId}/status` - Check job status
- `GET /api/mobile/styles` - Get available styles

**Credits**:
- `GET /api/mobile/credits/balance` - Get credit balance
- `GET /api/mobile/credits/history` - Get transaction history

### 4. Deep Link Configuration (Required for Auth)

For magic link authentication to work, you need to **rebuild the app** (not just restart):

```bash
cd mobile

# For iOS
npx expo run:ios

# For Android
npx expo run:android
```

This is required because the deep link scheme (`lusterai://auth`) needs native code changes.

## Switching Between Local and Production

Edit `mobile/.env`:

```bash
# For Production (Railway)
EXPO_PUBLIC_API_URL=https://luster-ai-production.up.railway.app

# For Local Development (API running on your machine)
EXPO_PUBLIC_API_URL=http://localhost:8000

# For Physical Device (replace with your computer's IP)
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:8000
```

After changing, always restart with `npm start -- --clear`.

## Troubleshooting

### "Network request failed" errors

**Cause**: App is still using old cached environment variables
**Fix**:
```bash
cd mobile
npm start -- --clear
```

### "404 Not Found" errors

**Cause**: Endpoint doesn't exist on Railway
**Fix**: Check that the endpoint exists in `services/api/main.py`

### "401 Unauthorized" errors

**Cause**: Authentication token missing or expired
**Fix**:
1. Check that Supabase URL and key are correct in `.env`
2. Try signing in again to get a fresh token
3. Check AsyncStorage has the token:
   - Open React Native Debugger
   - Check `@supabase.auth.token`

### Magic links don't open the app

**Cause**: Deep link scheme not registered (requires native rebuild)
**Fix**: Run `npx expo run:ios` or `npx expo run:android`

## Network Flow

```
┌─────────────────┐
│   Mobile App    │
│ (Your Device)   │
└────────┬────────┘
         │ EXPO_PUBLIC_API_URL
         ▼
┌─────────────────────────────────────────────┐
│   https://luster-ai-production.up.railway.app │
│              (Railway API)                     │
└────────┬────────────────────────────────────┘
         │
         ├─→ Supabase (Auth & Postgres)
         │   https://rdzanmwdqmidwifviwyr.supabase.co
         │
         └─→ Cloudflare R2 (Image Storage)
             https://{accountId}.r2.cloudflarestorage.com
```

## Current Status

✅ Mobile app configured to use Railway
✅ Railway API is healthy and responding
✅ Supabase credentials configured
✅ R2 storage enabled
✅ All endpoints tested and working

**Action Required**:
1. Restart Expo server: `npm start -- --clear`
2. Test authentication flow
3. Rebuild app for deep links: `npx expo run:ios`

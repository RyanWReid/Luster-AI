# Fix Supabase Magic Link Redirect

## Problem
Magic link emails are redirecting to `localhost` instead of opening the mobile app.

## Root Cause
Supabase needs to be configured to allow the `lusterai://auth` redirect URL in its dashboard settings.

## Solution

### Step 1: Configure Supabase Redirect URLs

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `rdzanmwdqmidwifviwyr`
3. **Navigate to Authentication Settings**:
   - Click **Authentication** in the left sidebar
   - Click **URL Configuration**

4. **Add Redirect URLs**:
   Add these URLs to the **Redirect URLs** list:
   ```
   lusterai://auth
   lusterai://*
   exp://localhost:8081/--/*
   exp://192.168.*.*/--/*
   ```

5. **Set Site URL**:
   Set the **Site URL** to:
   ```
   https://luster-ai-production.up.railway.app
   ```

6. **Save Changes**

### Step 2: Verify Deep Link Configuration

Make sure your mobile app is configured with the custom URL scheme:

**Check `mobile/app.json`**:
```json
{
  "expo": {
    "scheme": "lusterai",
    ...
  }
}
```

### Step 3: Rebuild Mobile App (Required!)

Deep link changes require a **native rebuild**. Simply restarting with `npm start` won't work.

```bash
cd mobile

# For iOS
npx expo run:ios

# For Android
npx expo run:android

# Or create a development build
eas build --profile development --platform ios
```

**Why rebuild is required:**
- URL scheme registration happens at the native (iOS/Android) level
- Changes to `app.json` scheme require native code changes
- Expo Go has limited deep link support

### Step 4: Test Magic Link Flow

1. **Clear app data** (to start fresh):
   - iOS: Delete app and reinstall
   - Android: Settings → Apps → Luster AI → Clear Data

2. **Open the app** and go to login screen

3. **Enter your email** and tap "Continue with Email"

4. **Check your email** for the magic link

5. **Click the magic link**:
   - Should open the Luster AI app directly
   - Should show "Success: You are now signed in!"
   - Should redirect to home screen

### Step 5: Verify Authentication

After signing in, check that:
- ✅ Credits show the correct balance (not 0 or hardcoded values)
- ✅ User profile is loaded
- ✅ All API requests include `Authorization` header

## Troubleshooting

### Link still opens browser/localhost

**Cause**: Supabase redirect URL not configured
**Fix**: Double-check step 1 - the redirect URL must be **exactly** `lusterai://auth`

### Link opens app but doesn't sign in

**Cause**: Deep link handler not registered (app not rebuilt)
**Fix**: Run `npx expo run:ios` or `npx expo run:android`

### App crashes when clicking magic link

**Cause**: AuthContext deep link handler issue
**Fix**: Check console logs for errors, ensure Supabase SDK is up to date

### "Invalid redirect URL" error in email

**Cause**: Redirect URL not in Supabase whitelist
**Fix**: Add `lusterai://auth` to Supabase → Authentication → URL Configuration → Redirect URLs

### Magic link expires immediately

**Cause**: Default Supabase magic link expiry is 1 hour
**Fix**: This is expected behavior. Request a new link if expired.

## Technical Details

### How Magic Links Work

1. **User enters email** → Mobile app calls Supabase `signInWithOtp()`
2. **Supabase sends email** with magic link containing token
3. **User clicks link** → Opens `lusterai://auth?access_token=...&refresh_token=...`
4. **OS intercepts URL** → Launches Luster AI app
5. **App deep link handler** extracts tokens from URL
6. **Supabase SDK** stores tokens in AsyncStorage
7. **AuthContext** updates user state
8. **App navigates** to home screen

### Deep Link URL Format

```
lusterai://auth#access_token=eyJhbGci...&refresh_token=eyJhbGci...&expires_in=3600&token_type=bearer
```

The tokens are in the **hash fragment** (`#`), not query parameters (`?`).

### Code Reference

**AuthContext deep link handler** (`mobile/src/context/AuthContext.tsx:43-61`):
```typescript
const handleDeepLink = ({ url }: { url: string }) => {
  if (url && url.includes('#')) {
    const hashFragment = url.split('#')[1]
    const params = new URLSearchParams(hashFragment)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (accessToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      })
    }
  }
}
```

## What Was Fixed

✅ **Credits now load only after authentication** - `PhotoContext` waits for user to sign in
✅ **Credit service uses Supabase tokens** - No more `authToken` from AsyncStorage
✅ **Credits cleared on logout** - User state properly managed

**Files Modified**:
- `mobile/src/context/PhotoContext.tsx` - Added auth check before fetching credits
- `mobile/src/services/creditService.ts` - Use Supabase session token instead of AsyncStorage

## Next Steps

1. ✅ Configure Supabase redirect URLs (5 minutes)
2. ✅ Rebuild mobile app with `npx expo run:ios` (10 minutes)
3. ✅ Test magic link flow end-to-end (5 minutes)
4. ✅ Verify credits load correctly after sign in

**Total time**: ~20 minutes

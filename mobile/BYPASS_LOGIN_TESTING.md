# Bypass Login - Testing Guide

## ✅ Login Bypass Enabled

You can now **bypass authentication** to test the photo enhancement flow without needing real credentials or email verification.

## How to Use

### 1. Restart the App (If Running)

```bash
cd mobile
npm start -- --clear
```

### 2. Test Login Flow

1. **Open the app** → You'll see the login screen
2. **Just press the "Login" button** → No need to enter email/password
3. **You're in!** → Mock user created with:
   - User ID: `test-user-123`
   - Email: `test@luster.ai`
   - Mock session token

**OR** press the "Register my account" button on the signup screen - works the same way!

### 3. Test Photo Enhancement

Now you can test the full photo flow:

1. **Navigate to photo upload screen**
2. **Select/take a photo**
3. **Choose a style** (Luster or Flambient)
4. **Submit for enhancement**
5. **Check job status** → Should see it processing
6. **Download enhanced photo** → When complete

## What's Bypassed

✅ **Skipped**:
- Email/password validation
- Magic link email sending
- Supabase authentication
- JWT verification (uses mock token)

✅ **Still Works**:
- App navigation
- Photo upload flow
- API calls to Railway
- Credit balance (starts at 0)
- Enhancement service

## API Connection

The app connects to your **Railway production API**:
```
https://luster-ai-production.up.railway.app
```

Test endpoints:
- `/api/mobile/test` - Connection test
- `/api/mobile/styles` - Available styles
- `/api/mobile/enhance` - Photo enhancement

## Check Console Logs

When you bypass login, you'll see:
```
🔓 Bypassed login - using mock user for testing
```

## Test Photo Enhancement API

To verify the API is working, check console logs:
```
===== CONNECTION TEST =====
✅ Connection test SUCCESSFUL

===== ENHANCE IMAGE START =====
✅ FormData method successful
```

## Troubleshooting

### "Failed to fetch credits"
**Expected**: Credits will be 0 because the mock user doesn't exist in the database. This is OK for testing uploads.

### "Not authenticated" errors
**Problem**: API endpoints require real JWT tokens
**Solution**: The mobile endpoints `/api/mobile/*` have backward compatibility and should work without auth

### Photos not uploading
**Check**:
1. API is running on Railway: https://luster-ai-production.up.railway.app/health
2. Network connection is working
3. Console logs show connection test passed

## Remove Bypass Later

When ready to use real authentication, edit these files:

**mobile/src/context/AuthContext.tsx**:
- Remove `bypassLogin()` method
- Remove from AuthContextType

**mobile/src/screens/LoginScreen.tsx**:
- Uncomment original `handleLogin()` code
- Add back email/password validation

**mobile/src/screens/AuthScreen.tsx**:
- Uncomment original `handleRegister()` code
- Add back form validation

## Testing Checklist

- [ ] Login screen → Press Login → Bypasses to home screen
- [ ] Navigate to upload screen
- [ ] Select photo from library
- [ ] Choose enhancement style
- [ ] Submit for processing
- [ ] View job status (queued → processing)
- [ ] Download enhanced result (when succeeded)
- [ ] Check console logs for errors
- [ ] Test with different photo types (JPG, HEIC, PNG)

---

**This is a TEMPORARY testing feature.**

Remove before production release! 🚀

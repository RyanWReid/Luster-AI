# Migration Guide: Mock Auth → Real Supabase Auth

## What Changed

The mobile app has been updated from **mock/bypass authentication** to **real Supabase authentication**.

### Before (Mock Auth)
```typescript
// Instantly logged in with fake token
await signInWithEmail('any@email.com')
// → Mock session created immediately
// → No email sent
// → No backend validation
```

### After (Real Supabase Auth)
```typescript
// Magic link sent to email
await signInWithEmail('user@example.com')
// → User receives email with magic link
// → User clicks link → App opens → Authenticated
// → Real JWT token → Backend validates
```

## Files Modified

### 1. `/mobile/src/context/AuthContext.tsx`
**Changed:**
- Removed mock auth bypass code (lines 42-75)
- Enabled real Supabase `signInWithOtp()` call
- Added deep link handler for magic link authentication
- Added auth state change listener with success alerts

**What it does now:**
- Sends magic link emails via Supabase
- Handles deep links when user clicks email link
- Manages real JWT tokens
- Persists sessions via AsyncStorage

### 2. `/mobile/src/lib/api.ts` (NEW)
**Created:**
- Centralized API client for backend requests
- Automatically injects `Authorization: Bearer <token>` header
- Type-safe methods: `api.get()`, `api.post()`, etc.
- Error handling with `APIError` class

**Usage:**
```typescript
import { api } from '@/lib/api'

// All requests automatically include auth token
const user = await api.get('/api/user/me')
const job = await api.post('/api/jobs', { asset_id: '...' })
```

### 3. `/mobile/app.json`
**Changed:**
- Added `"scheme": "lusterai"` for deep linking
- Added Android intent filters for deep links

**What it does:**
- Enables app to open when user clicks magic link
- URL format: `lusterai://auth#access_token=...`

## Setup Required

### 1. Update Environment Variables

Ensure your `/mobile/.env` file has valid Supabase credentials:

```bash
# Get these from Supabase Dashboard → Settings → API
EXPO_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key

# Your backend API URL
EXPO_PUBLIC_API_URL=http://localhost:8000  # or your production URL
```

### 2. Rebuild the App

**Important:** After changing `app.json`, you MUST rebuild:

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android

# NOT sufficient (won't update deep linking):
# expo start
```

### 3. Configure Supabase Email Settings

**Development:**
Supabase sends emails automatically using their SMTP.

**Production:**
Configure custom SMTP in Supabase Dashboard:
1. Go to Project Settings → Auth → Email Templates
2. Set up custom SMTP provider (SendGrid, Mailgun, etc.)
3. Customize email templates

### 4. Test the Flow

1. **Enter email** in app (LoginScreen or AuthScreen)
2. **Check your email** for magic link
   - Subject: "Confirm your signup"
   - Sender: noreply@mail.app.supabase.io (or your custom domain)
3. **Click magic link** in email
   - Should open your app automatically
   - Should see "Success, You are now signed in!" alert
4. **Verify session persistence**
   - Close app
   - Reopen app
   - Should still be signed in
5. **Test API request**
   ```typescript
   const { session } = useAuth()
   console.log('Token:', session?.access_token)

   // Make authenticated request
   const result = await api.get('/api/user/me')
   ```

## Breaking Changes

### 1. Instant Login No Longer Works
**Before:**
```typescript
await signInWithEmail('test@test.com')
// → Logged in instantly
```

**After:**
```typescript
await signInWithEmail('test@test.com')
// → User must check email and click link
```

### 2. Token is Real JWT (Not "mock-access-token")
**Before:**
```typescript
session.access_token === 'mock-access-token'
```

**After:**
```typescript
session.access_token === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
// Real JWT that backend validates
```

### 3. Backend Validation Required
**Before:**
- Backend accepted any token (or no token)

**After:**
- Backend validates JWT using Supabase JWKS
- Invalid token → 401 Unauthorized
- No token → 401 Unauthorized (for protected endpoints)

## Troubleshooting

### Issue: "Check your email" but no email arrives

**Solutions:**
1. Check spam folder
2. Verify email in Supabase Dashboard → Logs → Auth Logs
3. Check Supabase email settings (Dashboard → Auth → Email Templates)
4. Try a different email provider (some block automated emails)

### Issue: App doesn't open when clicking email link

**Solutions:**
1. Rebuild app after changing `app.json`:
   ```bash
   npx expo run:ios  # or run:android
   ```
2. Check that URL scheme in email matches `app.json`:
   - Email link should redirect to: `lusterai://auth#access_token=...`
   - `app.json` should have: `"scheme": "lusterai"`
3. Test deep link manually:
   ```bash
   # iOS Simulator
   xcrun simctl openurl booted "lusterai://auth#access_token=test"

   # Android Emulator
   adb shell am start -W -a android.intent.action.VIEW -d "lusterai://auth#access_token=test"
   ```

### Issue: 401 Unauthorized on API requests

**Solutions:**
1. Verify token exists:
   ```typescript
   const { session } = useAuth()
   console.log('Token:', session?.access_token?.substring(0, 20))
   ```
2. Check backend has correct `SUPABASE_JWKS_URL`:
   ```bash
   SUPABASE_JWKS_URL=https://[YOUR_PROJECT_ID].supabase.co/auth/v1/.well-known/jwks.json
   ```
3. Check backend logs for JWT validation errors

### Issue: Session doesn't persist after app restart

**Solutions:**
1. Verify AsyncStorage is working:
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage'

   // Test storage
   await AsyncStorage.setItem('test', 'value')
   const value = await AsyncStorage.getItem('test')
   console.log('Storage works:', value === 'value')
   ```
2. Check Supabase client config in `src/lib/supabase.ts`:
   ```typescript
   auth: {
     storage: AsyncStorage,
     autoRefreshToken: true,
     persistSession: true,  // Must be true
   }
   ```

## Testing Checklist

- [ ] App runs without errors after changes
- [ ] Can enter email in LoginScreen
- [ ] Can enter email in AuthScreen
- [ ] "Check your email" alert appears
- [ ] Magic link email arrives (check spam too)
- [ ] Clicking email link opens app
- [ ] "You are now signed in!" alert appears
- [ ] Session persists after closing/reopening app
- [ ] Can make authenticated API requests
- [ ] Backend creates user on first auth
- [ ] Can sign out successfully
- [ ] After sign out, protected endpoints return 401

## Rollback Plan (If Needed)

If you need to revert to mock auth temporarily:

1. Open `/mobile/src/context/AuthContext.tsx`
2. Comment out the real auth code
3. Uncomment the mock auth code:
   ```typescript
   const signInWithEmail = async (email: string) => {
     try {
       // TEMPORARY: Mock auth for testing
       const mockUser = { id: 'test', email } as User
       const mockSession = { access_token: 'mock-token', user: mockUser } as Session
       setUser(mockUser)
       setSession(mockSession)
       Alert.alert('Success', 'Logged in (Mock Mode)')

       // TODO: Re-enable real auth
       // const { error } = await supabase.auth.signInWithOtp({ ... })
     } catch (error: any) {
       Alert.alert('Error', error.message)
     }
   }
   ```

**Note:** This is only for emergency rollback. Real auth should be used for production.

## Next Steps

1. **Test thoroughly** using the checklist above
2. **Configure production email** in Supabase (custom SMTP)
3. **Set up Universal Links** for iOS (better UX than URL schemes)
4. **Set up App Links** for Android (better UX than URL schemes)
5. **Add social login** (Google, Apple, Facebook) - UI buttons already exist
6. **Add biometric auth** (Face ID / Touch ID) for faster re-auth

## Support

For questions or issues:
1. Check `/mobile/AUTHENTICATION.md` for detailed docs
2. Review Supabase Dashboard logs
3. Check backend API logs
4. Test with curl to isolate frontend vs backend issues

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Magic Links](https://supabase.com/docs/guides/auth/auth-magic-link)
- [Expo Deep Linking](https://docs.expo.dev/guides/linking/)
- [AsyncStorage Docs](https://react-native-async-storage.github.io/async-storage/)

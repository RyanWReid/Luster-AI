# Quick Start: Real Supabase Authentication

## 1. Setup Environment (One Time)

```bash
cd mobile
cp .env.example .env
```

Edit `.env`:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_PUBLIC_API_URL=http://localhost:8000
```

Get credentials from: [Supabase Dashboard](https://app.supabase.com) → Settings → API

## 2. Rebuild App (After app.json changes)

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android

# Important: "expo start" alone won't update deep linking
```

## 3. Test Authentication Flow

### Sign In
1. Open app
2. Tap "Login" or "Get started"
3. Enter email address
4. Tap "Login" or "Register"
5. See alert: "Check your email for the login link!"
6. Check your email inbox (and spam)
7. Click the magic link in email
8. App opens automatically
9. See alert: "You are now signed in!"

### Verify Session
```typescript
import { useAuth } from '@/context/AuthContext'

const { user, session } = useAuth()
console.log('User:', user?.email)
console.log('Token:', session?.access_token?.substring(0, 20))
```

### Make Authenticated Request
```typescript
import { api } from '@/lib/api'

// Token automatically included
const result = await api.get('/api/user/me')
console.log('User data:', result)
```

### Sign Out
```typescript
const { signOut } = useAuth()
await signOut()
// Session cleared, redirected to welcome screen
```

## 4. Troubleshooting

### No email received?
- Check spam folder
- Verify Supabase email settings: Dashboard → Auth → Email Templates
- Check Supabase logs: Dashboard → Logs → Auth Logs

### App doesn't open from email link?
- Rebuild app: `npx expo run:ios` or `npx expo run:android`
- Test deep link manually:
  ```bash
  # iOS
  xcrun simctl openurl booted "lusterai://auth"

  # Android
  adb shell am start -W -a android.intent.action.VIEW -d "lusterai://auth"
  ```

### 401 Unauthorized on API?
- Check token exists: `console.log(session?.access_token)`
- Verify backend `SUPABASE_JWKS_URL` is correct
- Check backend logs

## 5. Using the API Helper

```typescript
import { api, APIError } from '@/lib/api'

// GET
const credits = await api.get('/api/user/credits')

// POST
const job = await api.post('/api/jobs', {
  asset_id: 'uuid',
  style_preset: 'dusk'
})

// Error handling
try {
  const data = await api.get('/api/protected')
} catch (error) {
  if (error instanceof APIError) {
    console.log('Status:', error.statusCode)
    console.log('Message:', error.message)
  }
}

// Upload file
const result = await api.upload('/api/upload', fileBlob, 'photo')
```

## 6. Development Tips

### Check if user is authenticated
```typescript
const { user, loading } = useAuth()

if (loading) return <LoadingSpinner />
if (!user) return <LoginScreen />
return <MainApp />
```

### Access user info
```typescript
const { user } = useAuth()
console.log('User ID:', user?.id)
console.log('Email:', user?.email)
console.log('Created:', user?.created_at)
```

### Manual token refresh
```typescript
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase.auth.refreshSession()
```

## 7. Production Checklist

- [ ] Update `EXPO_PUBLIC_API_URL` to production URL
- [ ] Configure custom SMTP in Supabase for emails
- [ ] Set up Universal Links (iOS) / App Links (Android)
- [ ] Test on physical devices
- [ ] Verify backend JWT validation
- [ ] Enable social login (Google, Apple, Facebook)

## Documentation

- **Full Documentation**: `AUTHENTICATION.md`
- **Migration Guide**: `MIGRATION_GUIDE.md`
- **Environment Setup**: `.env.example`

## Key Files

- **Auth Logic**: `src/context/AuthContext.tsx`
- **API Client**: `src/lib/api.ts`
- **Supabase Client**: `src/lib/supabase.ts`
- **Deep Link Config**: `app.json`
- **UI Screens**: `src/screens/LoginScreen.tsx`, `src/screens/AuthScreen.tsx`

## Support Commands

```bash
# Clear Metro cache
npx expo start -c

# Reset app data (iOS Simulator)
xcrun simctl erase all

# View logs
npx expo start --dev-client

# Check dependencies
npm list @supabase/supabase-js
npm list @react-native-async-storage/async-storage
```

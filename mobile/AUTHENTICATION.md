# Mobile Authentication Integration

## Overview

The mobile app now uses **real Supabase authentication** via magic links (OTP). Users enter their email, receive a magic link, click it, and are automatically signed in.

## Architecture

### Components

1. **AuthContext** (`src/context/AuthContext.tsx`)
   - Manages authentication state (user, session, loading)
   - Handles Supabase auth state changes
   - Processes magic link deep links
   - Auto-persists sessions via AsyncStorage

2. **Supabase Client** (`src/lib/supabase.ts`)
   - Configured with AsyncStorage for session persistence
   - Auto-refreshes tokens
   - Detects sessions from URL (deep links)

3. **API Helper** (`src/lib/api.ts`)
   - Centralized HTTP client for backend requests
   - Automatically injects `Authorization: Bearer <token>` header
   - Type-safe request methods (GET, POST, PUT, PATCH, DELETE, upload)

4. **Deep Linking** (`app.json`)
   - Custom URL scheme: `lusterai://`
   - Handles magic link redirects from email

## Authentication Flow

### 1. Sign Up / Sign In (Magic Link)

```typescript
// User enters email in LoginScreen or AuthScreen
const { signInWithEmail } = useAuth()
await signInWithEmail('user@example.com')
// → Supabase sends magic link to user's email
// → User sees: "Check your email for the login link!"
```

### 2. Magic Link Click

```
User clicks link in email:
https://[YOUR_SUPABASE_PROJECT].supabase.co/auth/v1/verify?token=...&type=magiclink&redirect_to=lusterai://auth
                                                                                                    ↓
                                                                              Opens app via deep link
                                                                                                    ↓
                                                          AuthContext.handleDeepLink() extracts tokens
                                                                                                    ↓
                                                              supabase.auth.setSession({ access_token, refresh_token })
                                                                                                    ↓
                                                                    onAuthStateChange fires → user signed in!
```

### 3. Authenticated API Requests

```typescript
import { api } from '@/lib/api'

// GET request - token automatically included
const credits = await api.get('/api/user/credits')

// POST request - token automatically included
const job = await api.post('/api/jobs', {
  asset_id: 'abc123',
  style_preset: 'dusk'
})

// Error handling
try {
  const data = await api.get('/api/protected')
} catch (error) {
  if (error instanceof APIError) {
    console.log(error.statusCode) // 401, 403, etc.
    console.log(error.message)
  }
}
```

### 4. Sign Out

```typescript
const { signOut } = useAuth()
await signOut()
// → Clears session from Supabase and AsyncStorage
// → User redirected to welcome/login screen
```

## Environment Setup

### Required Environment Variables

Create `mobile/.env` with:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API URL
EXPO_PUBLIC_API_URL=http://localhost:8000  # Development
# EXPO_PUBLIC_API_URL=https://api.luster.com  # Production
```

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Backend Integration

The FastAPI backend expects the Supabase JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Backend Configuration

Ensure your backend has these environment variables:

```bash
SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWKS_URL=https://[YOUR_PROJECT_ID].supabase.co/auth/v1/.well-known/jwks.json
```

### How It Works

1. Mobile app sends request with `Authorization: Bearer <supabase_jwt>`
2. Backend middleware validates JWT using Supabase JWKS
3. Backend extracts user info from JWT (user_id, email, etc.)
4. Backend auto-creates user in database on first request
5. Backend grants access to protected endpoints

## Deep Link Configuration

### iOS (Universal Links - Future Enhancement)

For production, you'll want to configure Universal Links:

1. Add Associated Domains capability in Xcode
2. Create `apple-app-site-association` file
3. Host on your domain at `https://yourdomain.com/.well-known/apple-app-site-association`

### Android (App Links)

For production, configure Android App Links:

1. Generate signing key
2. Create `assetlinks.json`
3. Host on your domain at `https://yourdomain.com/.well-known/assetlinks.json`

### Current Setup (Development)

Currently using custom URL scheme: `lusterai://`

**Testing Deep Links:**

```bash
# iOS Simulator
xcrun simctl openurl booted "lusterai://auth#access_token=test&refresh_token=test"

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "lusterai://auth#access_token=test&refresh_token=test"
```

## Session Persistence

Sessions are automatically persisted using AsyncStorage:

- **Login once** → Stay signed in across app restarts
- **Token refresh** → Automatic background token renewal
- **Sign out** → Clears all stored session data

## Security

### Token Storage
- Access tokens stored in AsyncStorage (encrypted on iOS)
- Auto-refresh tokens before expiry
- Tokens cleared on sign out

### API Communication
- All requests use HTTPS in production
- JWT tokens verified by backend using Supabase JWKS
- No passwords stored on device

### Best Practices
1. **Never log tokens** in production
2. **Use HTTPS** for all API endpoints
3. **Validate tokens** on backend
4. **Handle token expiry** gracefully
5. **Clear sessions** on sign out

## Troubleshooting

### "Check your email" but no email received

1. **Check Supabase email settings:**
   - Dashboard → Authentication → Email Templates
   - Ensure SMTP is configured or using default Supabase email
2. **Check spam folder**
3. **Verify email in Supabase logs:**
   - Dashboard → Logs → Auth Logs

### Deep link doesn't open app

1. **Rebuild the app** after changing `app.json`:
   ```bash
   # iOS
   npx expo run:ios

   # Android
   npx expo run:android
   ```
2. **Check URL scheme** in `app.json` matches redirect URL
3. **Test deep link manually** (see testing commands above)

### "Unauthorized" (401) on API requests

1. **Check token is present:**
   ```typescript
   const { session } = useAuth()
   console.log('Token:', session?.access_token?.substring(0, 20))
   ```
2. **Verify backend SUPABASE_JWKS_URL** is correct
3. **Check backend logs** for JWT validation errors

### Session not persisting

1. **Check AsyncStorage permission** (should be automatic)
2. **Verify Supabase client config:**
   ```typescript
   auth: {
     storage: AsyncStorage,
     autoRefreshToken: true,
     persistSession: true,
   }
   ```

## Testing Checklist

- [ ] User can enter email and receive magic link
- [ ] Clicking magic link opens app
- [ ] User is signed in after clicking magic link
- [ ] Session persists across app restarts
- [ ] API requests include auth token
- [ ] Backend creates user on first auth
- [ ] Backend grants access to protected endpoints
- [ ] Sign out clears session
- [ ] Token auto-refreshes before expiry

## Future Enhancements

1. **Social Login** (Google, Apple, Facebook)
   - Already have UI buttons in place
   - Need to configure OAuth providers in Supabase

2. **Biometric Auth** (Face ID, Touch ID)
   - Store encrypted token
   - Quick unlock without magic link

3. **Universal Links / App Links**
   - Better UX than custom URL schemes
   - Fallback to web if app not installed

4. **Phone Number Auth**
   - SMS OTP alternative to email

## API Usage Examples

### Get User Profile
```typescript
const profile = await api.get('/api/user/me')
```

### Get Credit Balance
```typescript
const { balance } = await api.get('/api/user/credits')
```

### Create Processing Job
```typescript
const job = await api.post('/api/jobs', {
  asset_id: 'asset_uuid',
  style_preset: 'dusk',
  prompt_params: {}
})
```

### Upload Photo
```typescript
// Get presigned upload URL
const { upload_url, asset_id } = await api.post('/uploads/presign', {
  filename: 'photo.jpg',
  content_type: 'image/jpeg'
})

// Upload directly to R2
const response = await fetch(upload_url, {
  method: 'PUT',
  body: photoFile,
  headers: { 'Content-Type': 'image/jpeg' }
})
```

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Expo Linking Docs](https://docs.expo.dev/guides/linking/)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)

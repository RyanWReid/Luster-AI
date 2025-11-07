# Luster AI Mobile App

Beautiful mobile app for real estate photo enhancement using AI. Built with React Native (Expo), Supabase authentication, and RevenueCat payments.

## Quick Start

See [QUICK_START.md](./QUICK_START.md) for a 5-minute setup guide.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Add your credentials to `.env`:
```bash
# Supabase (get from https://app.supabase.com)
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Backend API
EXPO_PUBLIC_API_URL=http://localhost:8000

# RevenueCat (get from https://app.revenuecat.com)
EXPO_PUBLIC_REVENUECAT_IOS_KEY=your_ios_key
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=your_android_key
```

4. Rebuild app (required for deep linking):
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

## Development

### iOS Simulator
```bash
npm run ios
```

### Android Emulator
```bash
npm run android
```

### Expo Go (Physical Device)
```bash
npm start
```
Then scan the QR code with Expo Go app.

## Features

- **Magic Link Authentication**: Passwordless email authentication via Supabase (no mock auth)
- **Photo Upload**: Camera and gallery integration
- **AI Enhancement**: Apply style presets (dusk, sky replacement, lawn cleanup)
- **Credit System**: Purchase credit packs via in-app purchases (RevenueCat)
- **Shoots Management**: Organize photos by property
- **Real-time Status**: Track photo processing jobs
- **Profile**: User stats and settings

## Authentication

The app uses **real Supabase authentication** (not mock/bypass):

1. User enters email → Supabase sends magic link
2. User clicks link in email → App opens via deep link (`lusterai://auth`)
3. User authenticated with JWT token
4. Session persists across app restarts (AsyncStorage)
5. All API requests include `Authorization: Bearer <token>` header

For complete documentation, see:
- **[AUTHENTICATION.md](./AUTHENTICATION.md)** - Full authentication docs
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migration from mock auth
- **[QUICK_START.md](./QUICK_START.md)** - Quick setup guide

## Project Structure

```
mobile/
├── src/
│   ├── components/       # Reusable UI components
│   ├── context/          # React Context providers
│   │   ├── AuthContext.tsx      # Supabase authentication
│   │   └── PaymentContext.tsx   # RevenueCat payments
│   ├── lib/              # Utilities and clients
│   │   ├── api.ts               # Authenticated API client (NEW)
│   │   └── supabase.ts          # Supabase client config
│   ├── navigation/       # React Navigation setup
│   ├── screens/          # App screens
│   │   ├── WelcomeScreen.tsx    # Onboarding
│   │   ├── LoginScreen.tsx      # Login (magic link)
│   │   ├── AuthScreen.tsx       # Sign up (magic link)
│   │   ├── HomeScreen.tsx       # Photo upload
│   │   └── CreditsScreen.tsx    # Purchase credits
│   └── types/            # TypeScript type definitions
├── app.json              # Expo config (includes deep link scheme)
└── .env                  # Environment variables (not committed)
```

## API Usage

The new `api` helper automatically includes auth tokens:

```typescript
import { api, APIError } from '@/lib/api'

// GET request (token auto-included)
const credits = await api.get('/api/user/credits')

// POST request
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
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `EXPO_PUBLIC_API_URL` | Backend API base URL | Yes |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | RevenueCat iOS API key | Yes (iOS) |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | RevenueCat Android key | Yes (Android) |

## Troubleshooting

**No email received?**
- Check spam folder
- Verify Supabase email settings: Dashboard → Auth → Email Templates

**App doesn't open from email link?**
- Rebuild app: `npx expo run:ios` or `npx expo run:android`
- Test deep link: `xcrun simctl openurl booted "lusterai://auth"`

**401 Unauthorized on API?**
- Check token: `console.log(session?.access_token)`
- Verify backend `SUPABASE_JWKS_URL` is correct

For more troubleshooting, see [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

## Build

### iOS
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```
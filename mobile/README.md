# Luster AI Mobile App

React Native app for real estate photo enhancement using Expo.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Add your Supabase credentials to `.env`

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

- **Magic Link Authentication**: Email-based authentication via Supabase
- **Photo Upload**: Camera and gallery integration
- **Style Presets**: Twilight Sky, Perfect Lawn, Blue Sky, Virtual Staging
- **Credit System**: Track and purchase enhancement credits
- **Shoots Management**: Organize photos by property
- **Profile**: User stats and settings

## Project Structure

```
/src
  /context       # Auth and app context
  /navigation    # React Navigation setup
  /screens       # App screens
  /lib           # Supabase client and utilities
  /types         # TypeScript types
```

## Environment Variables

- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `EXPO_PUBLIC_API_URL`: Backend API URL

## Build

### iOS
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```
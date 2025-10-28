# Payment Setup Guide - RevenueCat Integration

This guide walks you through setting up RevenueCat for mobile payments in the Luster AI app.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [RevenueCat Account Setup](#revenuecat-account-setup)
3. [App Store Connect Setup (iOS)](#app-store-connect-setup-ios)
4. [Google Play Console Setup (Android)](#google-play-console-setup-android)
5. [Product Configuration](#product-configuration)
6. [Environment Variables](#environment-variables)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

✅ **Completed:**
- RevenueCat SDK installed (`react-native-purchases`)
- Payment service layer created ([revenueCatService.ts](src/services/revenueCatService.ts))
- Webhook handler created ([revenue_cat.py](../../services/api/revenue_cat.py))
- UI integrated with RevenueCat ([CreditsScreen.tsx](src/screens/CreditsScreen.tsx))

❌ **Required:**
- RevenueCat account (free tier available)
- Apple Developer Account ($99/year) for iOS
- Google Play Developer Account ($25 one-time) for Android
- App Store Connect access
- Google Play Console access

---

## RevenueCat Account Setup

### 1. Create RevenueCat Account

1. Go to [RevenueCat](https://www.revenuecat.com)
2. Sign up for a free account
3. Create a new project: **"Luster AI"**

### 2. Get API Keys

1. In RevenueCat dashboard, go to **Projects** → **Your Project**
2. Click **API Keys** in the left sidebar
3. Copy your API keys:
   - **iOS**: `appl_xxxxx`
   - **Android**: `goog_xxxxx`

4. Add these to your `.env` file (see [Environment Variables](#environment-variables) below)

### 3. Configure Webhook

1. In RevenueCat dashboard, go to **Integrations** → **Webhooks**
2. Add webhook URL: `https://your-api-domain.com/api/webhooks/revenuecat`
   - For local testing: Use [ngrok](https://ngrok.com) to expose your local API
3. Copy the **Webhook Secret** (you'll need this later)
4. Enable these events:
   - ✅ Initial Purchase
   - ✅ Renewal
   - ✅ Cancellation
   - ✅ Expiration
   - ✅ Non-Renewing Purchase

---

## App Store Connect Setup (iOS)

### 1. Create In-App Purchase Products

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app (or create one if you haven't)
3. Go to **Features** → **In-App Purchases**
4. Create the following products:

#### Auto-Renewable Subscriptions

| Product ID | Reference Name | Duration | Price |
|------------|---------------|----------|-------|
| `com.lusterai.trial` | Trial Subscription | 3 days | $3.99 |
| `com.lusterai.pro.monthly` | Pro Monthly | 1 month | $40.00 |

#### Consumables (Credit Bundles)

| Product ID | Reference Name | Type | Price |
|------------|---------------|------|-------|
| `com.lusterai.credits.small` | Small Bundle | Consumable | $6.25 |
| `com.lusterai.credits.medium` | Medium Bundle | Consumable | $15.00 |
| `com.lusterai.credits.large` | Large Bundle | Consumable | $25.50 |

### 2. Configure Product Metadata

For each product, set:
- **Display Name**: User-facing name (e.g., "Pro Monthly Subscription")
- **Description**: What they get (e.g., "45 photos per month with premium AI enhancements")
- **Screenshot**: Optional but recommended

### 3. Create Sandbox Testers

1. In App Store Connect, go to **Users and Access** → **Sandbox Testers**
2. Add test Apple IDs (use emails like `test+luster1@yourdomain.com`)
3. Use these accounts to test purchases without being charged

---

## Google Play Console Setup (Android)

### 1. Create In-App Products

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to **Monetize** → **In-app products** → **Subscriptions**
4. Create products matching the iOS ones:

| Product ID | Base Plan ID | Price |
|------------|-------------|-------|
| `com.lusterai.trial` | trial-3day | $3.99 |
| `com.lusterai.pro.monthly` | pro-monthly | $40.00 |

5. Go to **In-app products** → **One-time products** for credit bundles

### 2. Create License Testers

1. In Play Console, go to **Setup** → **License testing**
2. Add Gmail accounts for testing
3. These accounts can make test purchases

---

## Product Configuration

### Update RevenueCat Dashboard

1. Go to **Products** in RevenueCat
2. Click **+ New** to add products
3. For each product:
   - Select **App Store** or **Google Play**
   - Enter the **Product Identifier** (must match App Store Connect/Play Console)
   - Select **Type** (subscription or consumable)
   - Save

### Create Offerings

1. Go to **Offerings** in RevenueCat
2. Create offering: **"Default"** (this is what the app will fetch)
3. Add packages to the offering:
   - **Trial**: `com.lusterai.trial` - "3-Day Trial"
   - **Pro**: `com.lusterai.pro.monthly` - "Pro Monthly"
   - **Small**: `com.lusterai.credits.small` - "5 Credits"
   - **Medium**: `com.lusterai.credits.medium` - "15 Credits"
   - **Large**: `com.lusterai.credits.large` - "30 Credits"

### Set Up Entitlements

1. Go to **Entitlements** in RevenueCat
2. Create entitlement: **"pro"**
3. Attach products:
   - `com.lusterai.trial`
   - `com.lusterai.pro.monthly`

This allows you to check `hasEntitlement('pro')` in the app instead of checking individual products.

---

## Environment Variables

### Mobile App (`.env`)

```bash
# RevenueCat API Keys
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxxx
```

### Backend API (`services/api/.env`)

```bash
# RevenueCat Webhook Secret
REVENUECAT_WEBHOOK_SECRET=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Testing

### 1. Build and Run the App

```bash
cd mobile
npm run ios  # or npm run android
```

### 2. Test Purchase Flow

1. **Sign out** of your regular Apple ID on the device/simulator
2. **Launch the app**
3. Navigate to the Credits/Payment screen
4. Tap a subscription or bundle
5. **Sign in with a sandbox tester account** when prompted
6. Complete the purchase
7. Verify:
   - ✅ Purchase completes successfully
   - ✅ Credits added to your account
   - ✅ Webhook received by backend (check logs)
   - ✅ Database updated with new credit balance

### 3. Test Restore Purchases

1. Delete the app
2. Reinstall
3. Tap "Restore Purchases"
4. Verify subscription/purchases restored

### 4. Monitor RevenueCat Dashboard

- Go to **Dashboard** in RevenueCat
- Check **Recent Transactions**
- Verify test purchases appear

---

## Troubleshooting

### "No products found" error

**Cause**: RevenueCat can't fetch products from App Store/Play Store

**Solutions**:
1. Verify product IDs match exactly between:
   - App Store Connect → RevenueCat → Code
2. Wait 2-24 hours after creating products (App Store delay)
3. Check bundle identifier matches exactly
4. Verify agreements signed in App Store Connect

### "Purchase failed" error

**Cause**: Various issues with purchase flow

**Solutions**:
1. Check you're using a **sandbox tester account**
2. Verify product is marked as **"Ready to Submit"** in App Store Connect
3. Check device/simulator is signed out of regular Apple ID
4. For Android: Verify app is signed with the same certificate as Play Console

### Webhook not receiving events

**Cause**: RevenueCat can't reach your webhook endpoint

**Solutions**:
1. For local development:
   ```bash
   # Install ngrok
   brew install ngrok

   # Expose local API
   ngrok http 8000

   # Update webhook URL in RevenueCat dashboard
   # Use the https://xxx.ngrok.io URL
   ```
2. Verify webhook secret matches between RevenueCat and `.env`
3. Check API logs for incoming webhook requests

### Credits not added after purchase

**Cause**: Webhook received but not processed correctly

**Solutions**:
1. Check backend logs: `tail -f services/api/logs/app.log`
2. Verify product ID mapping in [revenue_cat.py:186](../../services/api/revenue_cat.py#L186)
3. Check database for credit updates:
   ```sql
   SELECT * FROM credits WHERE user_id = 'your-user-id';
   ```

### "Invalid API key" error

**Cause**: Wrong or missing RevenueCat API key

**Solutions**:
1. Verify `.env` keys match RevenueCat dashboard
2. Check you're using the correct key for platform (iOS vs Android)
3. Restart Metro bundler after changing `.env`:
   ```bash
   cd mobile
   rm -rf node_modules/.cache
   npm start -- --reset-cache
   ```

---

## Next Steps

Once payment setup is complete:

1. **Test all purchase flows** with sandbox accounts
2. **Monitor webhook events** in RevenueCat dashboard
3. **Verify credit balance** updates in database
4. **Test restore purchases** on fresh app install
5. **Add analytics** tracking for purchase events
6. **Configure App Store metadata** for submission

---

## Useful Links

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [iOS Sandbox Testing Guide](https://help.apple.com/app-store-connect/#/dev8b997bee1)
- [Google Play Testing Guide](https://developer.android.com/google/play/billing/test)
- [RevenueCat Product Setup](https://docs.revenuecat.com/docs/entitlements)

---

## Support

If you run into issues:

1. Check [RevenueCat Community](https://community.revenuecat.com/)
2. Review [App Store Connect Help](https://developer.apple.com/support/app-store-connect/)
3. Search [Stack Overflow](https://stackoverflow.com/questions/tagged/revenuecat)

---

**Last Updated**: 2025-01-21
**SDK Version**: react-native-purchases@9.5.4

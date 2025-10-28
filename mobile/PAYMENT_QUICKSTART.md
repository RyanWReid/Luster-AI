# RevenueCat Payment Setup - Quick Start

**Estimated Time**: 2-3 hours
**Last Updated**: 2025-01-21

---

## 🚀 Quick Setup Steps

### 1. Create RevenueCat Account (10 min)

1. Sign up at [revenuecat.com](https://www.revenuecat.com)
2. Create project: "Luster AI"
3. Copy API keys → Add to [mobile/.env](mobile/.env):
   ```bash
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxx
   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxx
   ```

### 2. Create App Store Connect Products (30-45 min)

Go to [App Store Connect](https://appstoreconnect.apple.com) → Your App → In-App Purchases

**Create Subscriptions:**
- `com.lusterai.trial` - $3.99 - 3 days
- `com.lusterai.pro.monthly` - $40.00 - 1 month

**Create Consumables:**
- `com.lusterai.credits.small` - $6.25
- `com.lusterai.credits.medium` - $15.00
- `com.lusterai.credits.large` - $25.50

**Create Sandbox Tester:**
- Users and Access → Sandbox → Add tester email

### 3. Link Products in RevenueCat (15 min)

In RevenueCat Dashboard:

1. **Products** → Add each product ID
2. **Offerings** → Create "Default" offering → Add all packages
3. **Entitlements** → Create "pro" → Link trial & pro.monthly

### 4. Configure Webhook (10 min)

In RevenueCat → Integrations → Webhooks:

**For Production:**
```
URL: https://api.luster.com/api/webhooks/revenuecat
```

**For Local Testing:**
```bash
# Install ngrok
brew install ngrok

# Expose local API
ngrok http 8000

# Use the https URL in RevenueCat
URL: https://xxxx.ngrok.io/api/webhooks/revenuecat
```

Copy webhook secret → Add to [services/api/.env](../../services/api/.env):
```bash
REVENUECAT_WEBHOOK_SECRET=sk_xxxxx
```

### 5. Test Purchase Flow (15 min)

```bash
# Build and run
cd mobile
npm run ios

# Test flow:
# 1. Sign out of regular Apple ID on device
# 2. Open app → Navigate to Credits screen
# 3. Tap a purchase
# 4. Sign in with sandbox tester
# 5. Complete purchase
# 6. Verify credits added
```

**Check Backend Logs:**
```bash
cd services/api
tail -f logs/app.log | grep revenuecat
```

---

## ✅ Verification Checklist

- [ ] RevenueCat SDK initialized (check app logs)
- [ ] Products visible in Credits screen
- [ ] Trial purchase works
- [ ] Pro subscription works
- [ ] Credit bundle purchase works
- [ ] Webhook receives events (check backend logs)
- [ ] Credits added to database after purchase
- [ ] Restore purchases works

---

## 🐛 Quick Troubleshooting

**"No products found"**
→ Wait 2-24 hours after creating in App Store Connect
→ Check product IDs match exactly

**"Purchase failed"**
→ Use sandbox tester account
→ Sign out of regular Apple ID first

**"Webhook not working"**
→ For local: Use ngrok
→ Check webhook secret in `.env`

**"Credits not added"**
→ Check backend logs for webhook events
→ Verify product ID mapping in [revenue_cat.py](../../services/api/revenue_cat.py)

---

## 📚 Full Documentation

- **Detailed Guide**: [PAYMENT_SETUP_GUIDE.md](PAYMENT_SETUP_GUIDE.md)
- **Product IDs**: [PRODUCT_IDS.md](PRODUCT_IDS.md)
- **Code Reference**:
  - Mobile Service: [src/services/revenueCatService.ts](src/services/revenueCatService.ts)
  - React Hook: [src/hooks/useRevenueCat.ts](src/hooks/useRevenueCat.ts)
  - Backend Webhook: [../../services/api/revenue_cat.py](../../services/api/revenue_cat.py)
  - UI Integration: [src/screens/CreditsScreen.tsx](src/screens/CreditsScreen.tsx)

---

## 🎯 Next Steps After Setup

1. Test all purchase flows thoroughly
2. Configure App Store screenshots and metadata
3. Add analytics events for purchases
4. Set up production webhook URL
5. Submit app for review

---

## 💡 Pro Tips

- **Sandbox testing is instant** - no real charges
- **Products can take 24h to appear** after creation
- **Always test restore purchases** before submission
- **Monitor RevenueCat dashboard** during testing
- **Use different sandbox accounts** for testing edge cases

---

**Need Help?**

- RevenueCat Docs: https://docs.revenuecat.com
- Community: https://community.revenuecat.com
- Apple Sandbox Guide: https://help.apple.com/app-store-connect/#/dev8b997bee1

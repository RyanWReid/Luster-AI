# Product ID Reference

## Quick Reference for RevenueCat Product Setup

This document maps your app's pricing structure to App Store/Play Store product IDs and RevenueCat packages.

---

## Product ID Naming Convention

Format: `com.lusterai.<type>.<variant>`

- **Subscriptions**: `com.lusterai.trial`, `com.lusterai.pro.monthly`
- **Consumables**: `com.lusterai.credits.<size>`

---

## Subscriptions

### Trial Subscription
- **Display Name**: "3-Day Trial"
- **Product ID**: `com.lusterai.trial`
- **Type**: Auto-Renewable Subscription
- **Duration**: 3 days
- **Price**: $3.99
- **Credits**: 10 photos
- **Notes**: Converts to Pro after trial

### Pro Monthly Subscription
- **Display Name**: "Pro Monthly"
- **Product ID**: `com.lusterai.pro.monthly`
- **Type**: Auto-Renewable Subscription
- **Duration**: 1 month
- **Price**: $40.00
- **Credits**: 45 photos/month
- **Notes**: Best value, most popular

---

## Credit Bundles (Consumables)

### Small Bundle
- **Display Name**: "Small Credit Pack"
- **Product ID**: `com.lusterai.credits.small`
- **Type**: Consumable
- **Price**: $6.25
- **Credits**: 5 photos
- **Price per Photo**: $1.25
- **Notes**: Perfect for trying out

### Medium Bundle (Best Value)
- **Display Name**: "Medium Credit Pack"
- **Product ID**: `com.lusterai.credits.medium`
- **Type**: Consumable
- **Price**: $15.00
- **Credits**: 15 photos
- **Price per Photo**: $1.00
- **Badge**: "BEST VALUE"
- **Notes**: Most popular bundle

### Large Bundle
- **Display Name**: "Large Credit Pack"
- **Product ID**: `com.lusterai.credits.large`
- **Type**: Consumable
- **Price**: $25.50
- **Credits**: 30 photos
- **Price per Photo**: $0.85
- **Notes**: Best savings, for power users

---

## Code References

### Mobile App

File: [mobile/src/screens/CreditsScreen.tsx:309-318](src/screens/CreditsScreen.tsx#L309-L318)

```typescript
const packageMap: Record<string, string> = {
  'trial': 'com.lusterai.trial',
  'pro': 'com.lusterai.pro.monthly',
  'small': 'com.lusterai.credits.small',
  'medium': 'com.lusterai.credits.medium',
  'large': 'com.lusterai.credits.large',
}
```

**⚠️ TODO**: Update these product IDs if you change them in App Store Connect

---

### Backend API

File: [services/api/revenue_cat.py:163-186](../../services/api/revenue_cat.py#L163-L186)

```python
credit_map = {
    # Subscriptions
    "com.lusterai.trial": 10,
    "com.lusterai.pro.monthly": 45,
    "com.lusterai.pro.yearly": 540,  # Optional

    # One-time credit bundles
    "com.lusterai.credits.small": 5,
    "com.lusterai.credits.medium": 15,
    "com.lusterai.credits.large": 30,
}
```

**⚠️ TODO**: Update credit amounts if you change pricing

---

## RevenueCat Configuration

### Offerings

**Offering ID**: `default` (current offering)

**Packages**:
1. `com.lusterai.trial` - Trial package
2. `com.lusterai.pro.monthly` - Pro monthly package
3. `com.lusterai.credits.small` - Small credits
4. `com.lusterai.credits.medium` - Medium credits
5. `com.lusterai.credits.large` - Large credits

### Entitlements

**Entitlement ID**: `pro`

**Products**:
- `com.lusterai.trial`
- `com.lusterai.pro.monthly`

---

## App Store Connect Metadata

### For Review Submission

**Subscription Display Name** (user-facing):
- Trial: "3-Day Trial - 10 Photos"
- Pro: "Pro Monthly - 45 Photos"

**Description**:
```
Trial: Try Luster AI with 10 photo enhancements over 3 days. Perfect for testing our premium AI.

Pro: Get 45 professional photo enhancements every month. Includes all premium styles and features.
```

**Consumable Display Names**:
- Small: "5 Photo Credits"
- Medium: "15 Photo Credits"
- Large: "30 Photo Credits"

**Description Template**:
```
Add {X} professional photo enhancement credits to your account. Credits never expire and can be used for any enhancement style.
```

---

## Price Tier Mapping (App Store Connect)

| Product | Price (USD) | Tier | Notes |
|---------|-------------|------|-------|
| Trial | $3.99 | — | Custom price point |
| Pro Monthly | $40.00 | — | Custom price point |
| Small Credits | $6.25 | — | Custom price point |
| Medium Credits | $15.00 | — | Custom price point |
| Large Credits | $25.50 | — | Custom price point |

**Note**: App Store Connect may suggest nearest tier if exact price unavailable.

---

## Testing Checklist

When you add products to App Store Connect and RevenueCat:

- [ ] Product IDs match **exactly** between App Store Connect and code
- [ ] Products marked as **"Ready to Submit"** in App Store Connect
- [ ] Products added to **RevenueCat dashboard** under Products
- [ ] Products added to **"Default" offering** in RevenueCat
- [ ] Credit amounts in backend match purchase value
- [ ] Sandbox tester can see all products
- [ ] Purchase flow works end-to-end
- [ ] Credits added to account after purchase
- [ ] Webhook receives and processes events

---

## Future Additions (Optional)

### Yearly Subscription

- **Product ID**: `com.lusterai.pro.yearly`
- **Price**: $400/year (20% discount vs monthly)
- **Credits**: 540 photos/year (45 × 12)
- **Badge**: "SAVE 20%"

### Lifetime Access (One-Time)

- **Product ID**: `com.lusterai.lifetime`
- **Type**: Non-consumable
- **Price**: $999
- **Credits**: Unlimited (or very high cap like 10,000)
- **Notes**: Premium tier for professionals

---

**Last Updated**: 2025-01-21
**Maintainer**: Update this file when changing pricing or adding products

# 🚀 Luster AI - Launch Roadmap

**Last Updated:** December 9, 2025
**Target Launch:** ~3-4 weeks from now
**Current Status:** 70% Complete - Core features working, needs configuration & App Store setup

---

## 📊 Executive Summary

**What's Working:**
- ✅ Mobile app (90% complete) - 21+ screens, full UI/UX
- ✅ Backend API (100% complete) - All 11 mobile endpoints operational
- ✅ Worker pipeline (100% complete) - Image processing infrastructure ready
- ✅ Authentication (100% complete) - Supabase magic links + social login
- ✅ Credit system (100% complete) - Server-side management with refunds
- ✅ R2 storage (100% complete) - Presigned URLs, direct uploads
- ✅ Railway deployment (100% complete) - API + Worker + Database live

**What Needs Work:**
- ⏳ OpenAI gpt-image-1 access (organization verification pending)
- ⏳ RevenueCat configuration (SDK integrated, needs API keys)
- ⏳ TestFlight setup (project exists, needs App Store Connect)
- ⏳ Legal documents (privacy policy, terms of service)
- ⏳ App Store assets (screenshots, metadata, icon)

**Blockers:**
- 🔴 OpenAI organization verification (emailed support, waiting 1-3 days)

**Timeline:**
- Week 1: Fix core functionality ✅ **DONE**
- Week 2: Beta testing (TestFlight) + Payments (RevenueCat) ⏳ **IN PROGRESS**
- Week 3: App Store prep (legal, screenshots, metadata)
- Week 4: Submit & launch

---

## ✅ What We've Completed

### **Phase 1: Deep Analysis** ✅ COMPLETE
**Completed:** December 9, 2025

**What we did:**
1. ✅ Analyzed entire codebase structure
2. ✅ Verified mobile app implementation (21+ screens)
3. ✅ Verified backend API endpoints (11 mobile endpoints)
4. ✅ Verified worker pipeline architecture
5. ✅ Verified Railway deployment configuration
6. ✅ Identified photo enhancement hanging issue

**Key Findings:**
- Mobile app is production-ready with excellent architecture
- Backend fully supports all mobile requirements
- Worker is operational and processing jobs
- Issue: OpenAI gpt-image-1 requires organization verification

**Files Analyzed:**
- `/mobile/src/` - All screens, services, contexts
- `/services/api/main.py` - All API endpoints
- `/services/worker/worker.py` - Job processing logic
- Railway configuration: `railway.toml` files

---

### **Phase 2: Issue Diagnosis** ✅ COMPLETE
**Completed:** December 9, 2025

**Problem:** Photos appearing to "hang" during enhancement

**Investigation:**
1. ✅ Checked Railway API health - **HEALTHY**
2. ✅ Checked worker service status - **RUNNING**
3. ✅ Analyzed job statistics - 0 active jobs, 3 recent failures
4. ✅ Examined recent job errors

**Root Cause Identified:**
```
Error: OpenAI processing failed: Error code: 403
Message: "Your organization must be verified to use the model gpt-image-1"
```

**Additional Issue Found:**
- Earlier jobs failing with "Input file not found" (R2 path issue - now resolved)

**Resolution Path:**
- ✅ Emailed OpenAI support for organization verification
- ⏳ Temporary workaround: Switch to DALL-E 2 (if needed)
- ⏳ Waiting for OpenAI response (1-3 business days)

**Files Examined:**
- `/services/api/openai_client.py` - Line 209: `model="gpt-image-1"`
- `/services/worker/processor.py` - Image processing logic
- Railway admin dashboard: Recent job failures

---

## 🔄 What We're Currently Doing

### **Priority 1: OpenAI Access** ⏳ IN PROGRESS
**Status:** Waiting for OpenAI support response

**Actions Taken:**
- ✅ Identified issue: Organization not verified for gpt-image-1
- ✅ Drafted improved support email with business details
- ⏳ User sending email to support@openai.com
- ⏳ Waiting for verification (ETA: 1-3 business days)

**Temporary Workaround Available:**
- Option: Switch `gpt-image-1` → `dall-e-2` in `/services/api/openai_client.py:209`
- Pros: Works immediately without verification
- Cons: Slightly lower quality, max 1024x1024 resolution
- Decision: Waiting for gpt-image-1 access first

**Next Steps:**
1. Send improved email to OpenAI support
2. Monitor for response (check daily)
3. Once verified, test image enhancement end-to-end
4. Verify credits deduct and refund properly

---

### **Priority 2: Account Isolation Testing** ⏳ PENDING
**Status:** Not started
**Estimated Time:** 30-60 minutes
**Why Critical:** Apple will reject if users can see each other's data

**What We Need to Test:**
1. Create 2 test accounts with different emails
2. Upload photos from Account A
3. Login as Account B → verify can't see Account A's photos
4. Verify credit balances are separate
5. Test device transfer:
   - Login on Device 1 → upload photo
   - Login on Device 2 with same account → verify photo appears
6. Verify R2 storage paths include `user_id` properly

**Test Checklist:**
- [ ] Account A uploads 3 photos
- [ ] Account B uploads 2 photos
- [ ] Account A sees only their 3 photos
- [ ] Account B sees only their 2 photos
- [ ] Credit deduction isolated per account
- [ ] Gallery endpoint filters by user_id
- [ ] R2 paths: `/{userId}/{shootId}/{assetId}/`
- [ ] Same account works across multiple devices

**Files to Verify:**
- `/services/api/main.py` - Lines checking `current_user.id`
- `/mobile/src/services/galleryService.ts` - API calls
- Database queries filtering by `user_id`

---

## 📋 What We're Going to Do

### **Priority 3: Set Up TestFlight** ⏳ NEXT UP
**Status:** Ready to start
**Estimated Time:** 2-3 hours
**Why Important:** Required for beta testing before production

**Prerequisites:**
- ✅ EAS project configured (ID: `11dad8dd-612b-4997-911b-9219841686bf`)
- ✅ Bundle ID set: `com.lusterai.mobile`
- ✅ `eas.json` build profiles ready
- ❓ Apple Developer Account ($99/year - confirm enrolled)

**Step-by-Step Plan:**

#### **Step 3A: Create App Store Connect Listing** (30 min)
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **"My Apps"** → **"+"** → **"New App"**
3. Fill in app information:
   - **Platform:** iOS
   - **Name:** Luster AI
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** `com.lusterai.mobile` (select from dropdown)
   - **SKU:** `luster-ai-mobile-001` (internal identifier)
   - **User Access:** Full Access
4. Click **"Create"**
5. Navigate to **"App Information"** tab
6. Set basic details (we'll fill more later)

#### **Step 3B: Build iOS App** (30-60 min)
```bash
cd mobile

# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo account
eas login

# Build for iOS (preview profile for TestFlight)
eas build --platform ios --profile preview

# This will:
# - Upload your code to Expo servers
# - Build the iOS app
# - Generate an .ipa file
# - Take ~20-30 minutes
```

**What Happens:**
- EAS reads `eas.json` preview profile
- Builds iOS app with auto-incrementing build number
- Stores build artifacts in EAS cloud
- Returns build URL when complete

#### **Step 3C: Submit to TestFlight** (15 min)
```bash
# After build completes successfully
eas submit --platform ios --latest

# This will:
# - Use the latest build from step 3B
# - Upload to App Store Connect
# - Submit for TestFlight processing
```

**App Store Connect Processing:**
- Takes ~10-20 minutes to process
- You'll see "Processing" status
- Once done, status changes to "Ready to Test"

#### **Step 3D: Set Up Internal Testing** (15 min)
1. In App Store Connect → **"TestFlight"** tab
2. Go to **"Internal Testing"** section
3. Click **"+"** to add internal testers
4. Add your email address
5. Click **"Add"**
6. You'll receive an email with TestFlight invite

#### **Step 3E: Install and Test** (30 min)
1. Install **TestFlight** app from App Store on your iPhone
2. Open the invite email on your iPhone
3. Click **"View in TestFlight"**
4. Click **"Install"**
5. Once installed, test the entire app flow:
   - [ ] Sign up with email (magic link)
   - [ ] Sign up with Apple (if configured)
   - [ ] Upload photo (camera)
   - [ ] Upload photo (photo library)
   - [ ] Select style and enhance
   - [ ] Wait for processing
   - [ ] Download result
   - [ ] Check credits deducted
   - [ ] Test logout/login
   - [ ] Test device transfer (if second device available)

**Files Modified (if needed):**
- None required - build should work as-is

**Potential Issues:**
- Build might fail on first try (missing signing certs)
- Solution: EAS handles signing automatically
- Deep linking might not work in TestFlight initially (normal)

---

### **Priority 4: Configure RevenueCat** ⏳ AFTER TESTFLIGHT
**Status:** SDK integrated, needs configuration
**Estimated Time:** 2-3 hours
**Why Important:** In-app purchases must work before public launch

**Current Status:**
- ✅ `react-native-purchases` SDK installed
- ✅ `revenueCatService.ts` fully implemented
- ✅ `useRevenueCat.ts` hook ready
- ✅ `CreditsScreen.tsx` UI complete
- ❌ API keys not configured (placeholders in code)
- ❌ Products not created in App Store Connect
- ❌ RevenueCat account not created

**Documentation Available:**
- ✅ `/mobile/PAYMENT_QUICKSTART.md` - Step-by-step setup guide
- ✅ `/mobile/PRODUCT_IDS.md` - Product configuration reference
- ✅ `/mobile/PAYMENT_SETUP_GUIDE.md` - Detailed implementation guide

**Step-by-Step Plan:**

#### **Step 4A: Create RevenueCat Account** (15 min)
1. Go to [revenuecat.com](https://www.revenuecat.com)
2. Sign up for free account
3. Create new project: **"Luster AI"**
4. Copy API keys:
   - iOS key (starts with `appl_`)
   - Android key (starts with `goog_`)
5. Add to `/mobile/.env`:
   ```bash
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxx
   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxx
   ```

#### **Step 4B: Create App Store Connect Products** (45 min)

**Subscriptions:**
1. Go to App Store Connect → Your App → **"In-App Purchases"**
2. Click **"+"** → **"Auto-Renewable Subscription"**
3. Create **"Trial"** subscription:
   - **Reference Name:** Luster AI Trial
   - **Product ID:** `com.lusterai.trial`
   - **Subscription Group:** Create new "Luster Subscriptions"
   - **Duration:** 3 days
   - **Price:** $3.99 USD
   - **Localization:** English (U.S.)
   - **Display Name:** "3-Day Trial - 10 Photos"
   - **Description:** "Try Luster AI with 10 photo enhancements"
4. Create **"Pro Monthly"** subscription:
   - **Product ID:** `com.lusterai.pro.monthly`
   - **Duration:** 1 month
   - **Price:** $40.00 USD
   - **Display Name:** "Pro Monthly - 45 Photos"
   - **Description:** "Get 45 professional photo enhancements every month"
5. Mark both as **"Ready to Submit"**

**Consumables:**
1. Click **"+"** → **"Consumable"**
2. Create **"Small Pack"**:
   - **Product ID:** `com.lusterai.credits.small`
   - **Price:** $6.25 USD
   - **Display Name:** "5 Photo Credits"
3. Create **"Medium Pack"**:
   - **Product ID:** `com.lusterai.credits.medium`
   - **Price:** $15.00 USD
   - **Display Name:** "15 Photo Credits"
4. Create **"Large Pack"**:
   - **Product ID:** `com.lusterai.credits.large`
   - **Price:** $25.50 USD
   - **Display Name:** "30 Photo Credits"
5. Mark all as **"Ready to Submit"**

**Note:** Products can take 2-24 hours to become available for testing

#### **Step 4C: Link Products in RevenueCat** (20 min)
1. In RevenueCat Dashboard → **"Products"**
2. Click **"+ New"** and add each product ID:
   - `com.lusterai.trial`
   - `com.lusterai.pro.monthly`
   - `com.lusterai.credits.small`
   - `com.lusterai.credits.medium`
   - `com.lusterai.credits.large`
3. Go to **"Offerings"** → Create **"Default"** offering
4. Add all products to the offering
5. Go to **"Entitlements"** → Create **"pro"** entitlement
6. Link trial and pro.monthly to "pro" entitlement

#### **Step 4D: Configure Webhook** (10 min)

**For Production:**
1. In RevenueCat → **"Integrations"** → **"Webhooks"**
2. Add webhook URL: `https://luster-ai-production.up.railway.app/api/webhooks/revenuecat`
3. Copy webhook secret (starts with `sk_`)
4. Add to `/services/api/.env`:
   ```bash
   REVENUECAT_WEBHOOK_SECRET=sk_xxxxxxxxxxxxx
   ```
5. Redeploy API service on Railway

**For Local Testing (Optional):**
```bash
# Install ngrok
brew install ngrok

# Start your local API
cd services/api
uvicorn main:app --reload

# In another terminal, expose it
ngrok http 8000

# Use the https URL in RevenueCat webhook
# Example: https://abc123.ngrok.io/api/webhooks/revenuecat
```

#### **Step 4E: Create Sandbox Tester** (5 min)
1. In App Store Connect → **"Users and Access"**
2. Go to **"Sandbox"** tab
3. Click **"+"** (Testers)
4. Add test account:
   - **First Name:** Test
   - **Last Name:** User
   - **Email:** `testuser+luster@yourdomain.com` (must be unique, not real Apple ID)
   - **Password:** (strong password)
   - **Country:** United States
5. Click **"Create"**

#### **Step 4F: Test Purchase Flow** (30 min)

**Important:** Sign out of your regular Apple ID first!

1. On your iPhone:
   - Settings → App Store → Sign Out
2. Open Luster AI from TestFlight
3. Navigate to Credits screen
4. Tap a purchase (e.g., "Small Pack")
5. When prompted, sign in with sandbox tester account
6. Complete purchase (it's free in sandbox)
7. Verify:
   - [ ] Purchase succeeds
   - [ ] Credits added to account (check backend)
   - [ ] Backend webhook received event (check Railway logs)
   - [ ] Credits balance updates in app
8. Test "Restore Purchases" button
9. Test subscription purchase
10. Test all 5 products

**Check Backend Logs:**
```bash
# In Railway dashboard
# Go to API service → Deployments → Logs
# Filter for "revenuecat"
# Should see webhook events
```

**Files Modified:**
- `/mobile/.env` - Add RevenueCat API keys
- `/services/api/.env` - Add webhook secret

---

### **Priority 5: Apple App Store Requirements** ⏳ AFTER PAYMENTS
**Status:** Not started
**Estimated Time:** 4-6 hours
**Why Important:** Required for App Store submission approval

**What We Need:**

#### **Step 5A: Privacy Policy** (1-2 hours)

**Create privacy policy covering:**
1. **Data Collection:**
   - Email addresses (for authentication)
   - Photos (uploaded for enhancement, stored in R2)
   - Usage analytics (optional - if implemented)
   - Payment information (via RevenueCat/Apple)
   - Device information (standard mobile app data)

2. **Data Usage:**
   - Photos sent to OpenAI for AI processing
   - Email for account management and magic links
   - Payment data for billing (processed by Apple/Stripe)

3. **Data Storage:**
   - Photos stored in Cloudflare R2 (encrypted)
   - User data in Supabase (PostgreSQL)
   - Credit purchase records retained for accounting

4. **Data Deletion:**
   - How users can request data deletion
   - Contact email: privacy@yourcompany.com
   - Timeframe: Within 30 days

5. **Third-Party Services:**
   - Supabase (authentication, database)
   - OpenAI (image processing)
   - Cloudflare R2 (storage)
   - RevenueCat (payment processing)
   - Apple/Google (payment processing)

**Options to Create:**
- **Option A:** Use a template generator like [getterms.io](https://getterms.io) or [termly.io](https://termly.io)
- **Option B:** Hire a lawyer (expensive but thorough)
- **Option C:** Adapt from competitor's policy (verify accuracy)

**Where to Host:**
- Create at: `yourdomain.com/privacy-policy`
- OR use GitHub Pages: `evilgeniuslabs.github.io/luster-privacy`
- Add URL to App Store Connect

#### **Step 5B: Terms of Service** (1 hour)

**Key Sections:**
1. Service description
2. User responsibilities
3. Payment terms and refund policy
4. Prohibited uses
5. Limitation of liability
6. Termination clause
7. Governing law

**Where to Host:**
- `yourdomain.com/terms`
- Add URL to App Store Connect

#### **Step 5C: Support URL** (30 min)

**Create simple support page:**
- Contact email: support@yourcompany.com
- FAQ section (optional):
  - How to use the app
  - How credits work
  - How to request refund
  - How to delete account
  - Troubleshooting common issues

**Where to Host:**
- `yourdomain.com/support`
- Add URL to App Store Connect

#### **Step 5D: App Store Screenshots** (2-3 hours)

**Required Sizes:**
- iPhone 6.7" (iPhone 15 Pro Max, 14 Pro Max): **1290 x 2796 pixels**
- iPhone 6.5" (iPhone 11 Pro Max, XS Max): **1242 x 2688 pixels**
- iPad Pro 12.9" (if supporting iPad): **2048 x 2732 pixels**

**Number of Screenshots:**
- Minimum: 3 per device size
- Maximum: 10 per device size
- Recommended: 5-6 per device size

**What to Show:**
1. **Welcome/Onboarding** - First impression
2. **Photo Upload** - Main feature
3. **Style Selection** - Enhancement options
4. **Processing/Results** - Before/after
5. **Credits/Pricing** - Monetization (optional but recommended)
6. **Gallery/Dashboard** - User's enhanced photos

**Tools to Create Screenshots:**
- Use iOS simulator to capture screens
- Use [Screenshot Builder](https://www.shotbot.io/) or similar
- Add text overlays explaining features
- Use your brand colors (#yourcolors)

**Current Assets Available:**
- `/mobile/assets/` - App icons, logos

#### **Step 5E: App Store Metadata** (1 hour)

**Required Information:**

1. **App Name:**
   - `Luster AI - Real Estate Photos`
   - Max 30 characters

2. **Subtitle:**
   - `Professional Photo Enhancement`
   - Max 30 characters

3. **Description:** (4000 characters max)
   ```
   Transform your real estate photos into professional-quality images with AI-powered enhancement.

   FEATURES:
   • Professional photo enhancement in seconds
   • Multiple style presets (Luster, Flambient, Dusk, Sky Replacement)
   • Architectural accuracy preserved
   • Before/after comparison
   • Unlimited storage for enhanced images
   • Credit-based pricing - no subscriptions required

   PERFECT FOR:
   • Real estate agents
   • Property managers
   • Homeowners selling properties
   • Photographers
   • Staging professionals

   HOW IT WORKS:
   1. Upload a photo from your library or camera
   2. Choose an enhancement style
   3. Get professional results in seconds
   4. Download and share

   PRICING:
   • Trial: 10 photos for $3.99
   • Small pack: 5 photos for $6.25
   • Medium pack: 15 photos for $15.00
   • Large pack: 30 photos for $25.50
   • Pro subscription: 45 photos/month for $40.00

   [Add more compelling copy here]
   ```

4. **Keywords:** (100 characters max, comma-separated)
   ```
   real estate,photos,AI,enhancement,property,photography,staging,editing,professional,camera
   ```

5. **Category:**
   - **Primary:** Photo & Video
   - **Secondary:** Business

6. **Age Rating:** 4+ (no restricted content)

7. **Contact Information:**
   - Support URL: `yourdomain.com/support`
   - Marketing URL: `lusterai.com` (optional)
   - Privacy Policy URL: `yourdomain.com/privacy`

8. **App Icon:**
   - ✅ Already exists: `/mobile/assets/icon.png` (1024x1024)
   - Verify: No transparency, no rounded corners (Apple adds those)

**Where to Add:**
- App Store Connect → Your App → **"App Information"** tab

---

### **Priority 6: Final Testing & Review Prep** ⏳ BEFORE SUBMISSION
**Status:** Not started
**Estimated Time:** 3-4 hours
**Why Important:** Catch bugs before Apple reviewers do

#### **Step 6A: Comprehensive Test Checklist** (2 hours)

**Authentication:**
- [ ] Sign up with email (magic link works)
- [ ] Sign up with Apple (redirects and completes)
- [ ] Sign up with Google (redirects and completes)
- [ ] Sign up with Facebook (redirects and completes)
- [ ] Logout preserves no sensitive data
- [ ] Login persists across app restarts
- [ ] Deep linking from magic link email works
- [ ] Session expires after 7 days (or configured time)

**Photo Upload:**
- [ ] Camera access permission prompt shows
- [ ] Camera works and captures photo
- [ ] Photo library access permission shows
- [ ] Photo library opens and allows selection
- [ ] HEIC files upload successfully
- [ ] JPG files upload successfully
- [ ] Large photos (10MB+) upload successfully
- [ ] Upload progress shows correctly
- [ ] Upload errors handled gracefully

**Enhancement:**
- [ ] Style selection screen shows all presets
- [ ] Each style triggers correct prompt
- [ ] Processing screen shows status
- [ ] Polling updates every 2 seconds
- [ ] Success shows enhanced image
- [ ] Failure shows error message
- [ ] Credits deducted on job creation
- [ ] Credits refunded on job failure
- [ ] Can download enhanced image
- [ ] Downloaded image saves to photo library
- [ ] Image quality is acceptable

**Credits:**
- [ ] Credit balance displays correctly
- [ ] Balance updates after enhancement
- [ ] Balance updates after purchase
- [ ] Insufficient credits shows error
- [ ] Can navigate to purchase screen
- [ ] Credits screen loads products
- [ ] All 5 products display correctly
- [ ] Prices show in local currency

**Purchases (Sandbox):**
- [ ] Trial purchase works ($3.99)
- [ ] Pro subscription purchase works ($40.00)
- [ ] Small pack purchase works ($6.25)
- [ ] Medium pack purchase works ($15.00)
- [ ] Large pack purchase works ($25.50)
- [ ] Credits added to account immediately
- [ ] Webhook received on backend
- [ ] Restore purchases works
- [ ] Purchase cancellation handled
- [ ] Receipt validation works

**Account Isolation:**
- [ ] Account A can't see Account B's photos
- [ ] Credits are separate per account
- [ ] Jobs are isolated per user
- [ ] R2 storage paths include user_id

**Device Transfer:**
- [ ] Login on Device 2 shows Account A's data
- [ ] Photos uploaded on Device 1 appear on Device 2
- [ ] Credit balance syncs across devices
- [ ] Logout on Device 1 doesn't affect Device 2

**Edge Cases:**
- [ ] Airplane mode shows helpful error
- [ ] No internet connection handled gracefully
- [ ] Background app doesn't crash
- [ ] Force quit and reopen preserves state
- [ ] Low battery doesn't cause issues
- [ ] Low storage handled gracefully
- [ ] Simultaneous uploads handled
- [ ] App doesn't crash on iOS 15, 16, 17, 18

**Performance:**
- [ ] App launches in < 3 seconds
- [ ] Screens transition smoothly (60fps)
- [ ] Images load quickly
- [ ] No memory leaks (test with Instruments)
- [ ] Battery usage is reasonable

**UI/UX:**
- [ ] All text is readable
- [ ] Buttons are tappable (44x44pt minimum)
- [ ] No layout issues on iPhone SE (small screen)
- [ ] No layout issues on iPhone 15 Pro Max (large screen)
- [ ] Dark mode looks good (if supported)
- [ ] Keyboard doesn't cover inputs
- [ ] Tab bar navigation works
- [ ] Back navigation works correctly

#### **Step 6B: Prepare for App Review** (1 hour)

**Create Demo Account:**
- Create a test account with credits pre-loaded
- Add email/password to App Review Information in App Store Connect
- Ensure this account has:
  - 50+ credits
  - Sample photos already enhanced
  - Active subscription (if testing subscriptions)

**Write Review Notes:**
```
DEMO ACCOUNT:
Email: demo@lusterai.com
Password: [secure password]

HOW TO TEST THE APP:
1. Sign in with the demo account above
2. Tap "Upload Photo" on the home screen
3. Select "Photo Library" and choose any property photo
4. Choose "Luster" style preset
5. Tap "Enhance Photo"
6. Wait ~15-20 seconds for processing
7. View the enhanced result and tap "Download"

SPECIAL FEATURES:
• Credit system: Demo account has 50 credits pre-loaded
• In-app purchases: Test with sandbox account (sandbox_test@example.com / TestPass123)
• Multiple styles: Try "Flambient", "Dusk", or "Sky Replacement"

NOTES:
• This is a real estate photo enhancement app for professionals
• All AI processing happens server-side via OpenAI
• Photos are stored securely in Cloudflare R2
• Payment processing via RevenueCat + Apple In-App Purchases
```

**Add to App Store Connect:**
- Go to **"App Review Information"**
- Add demo credentials
- Add review notes
- Add contact information

#### **Step 6C: Apple Guidelines Compliance Check** (1 hour)

**Review Apple's Guidelines:**
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

**Key Areas to Verify:**

**2.1 App Completeness:**
- [ ] App doesn't crash on launch
- [ ] All features work as described
- [ ] No placeholders or "Lorem ipsum"
- [ ] No broken links

**2.3 Accurate Metadata:**
- [ ] Screenshots match actual app
- [ ] Description accurately represents features
- [ ] App name isn't misleading

**3.1 Payments:**
- [ ] All purchases use Apple In-App Purchase
- [ ] "Restore Purchases" button exists ✅ (in RevenueCat service)
- [ ] Subscription terms clearly displayed
- [ ] No external payment links

**4.0 Design:**
- [ ] App looks like an iOS app (native feel)
- [ ] Uses iOS design patterns
- [ ] No broken UI elements

**5.1 Privacy:**
- [ ] Privacy policy linked ✅ (will add)
- [ ] Permission requests explain why
- [ ] No unauthorized data collection
- [ ] User can delete account

**Specific Checks:**

**Camera/Photo Library Access:**
```swift
// Verify in Info.plist (already configured):
NSCameraUsageDescription: "We need access to your camera to take photos for enhancement"
NSPhotoLibraryUsageDescription: "We need access to your photos to enhance real estate images"
NSPhotoLibraryAddUsageDescription: "We need access to save enhanced photos"
```

**Restore Purchases:**
```typescript
// Verify exists in CreditsScreen.tsx:
<Button onPress={handleRestore}>Restore Purchases</Button>
```

**Subscription Terms:**
- [ ] Trial duration clearly stated (3 days)
- [ ] Auto-renewal clearly stated
- [ ] Price clearly displayed
- [ ] How to cancel subscription explained

---

### **Priority 7: Submit to App Store** 🎉 FINAL STEP
**Status:** Not started
**Estimated Time:** 30 minutes
**Why Important:** This is what we've been working toward!

#### **Pre-Submission Checklist:**
- [ ] TestFlight build tested thoroughly
- [ ] All features working (auth, upload, enhance, purchase)
- [ ] No crashes or major bugs
- [ ] Account isolation verified
- [ ] Payments working (sandbox tested)
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Support URL active
- [ ] Screenshots uploaded (all required sizes)
- [ ] App Store metadata complete
- [ ] Demo account created
- [ ] Review notes written
- [ ] Age rating set (4+)
- [ ] Categories selected
- [ ] Keywords added
- [ ] Icon uploaded (1024x1024)

#### **Submission Steps:**

1. **Build Production Version:**
   ```bash
   cd mobile
   eas build --platform ios --profile production
   ```

2. **Submit to App Store:**
   ```bash
   eas submit --platform ios --latest
   ```

3. **In App Store Connect:**
   - Go to your app
   - Click **"+ Version"** if creating new version
   - Version: `1.0.0` (first release)
   - Fill in "What's New in This Version":
     ```
     Initial release of Luster AI!

     Features:
     • Professional AI-powered photo enhancement
     • Multiple style presets for real estate photography
     • Instant results in 15-20 seconds
     • Credit-based pricing with flexible packs
     • Secure cloud storage for your enhanced photos
     ```
   - Select the build (uploaded via EAS)
   - Click **"Save"**
   - Click **"Submit for Review"**

4. **Choose Release Options:**
   - **Manual release** (you control when it goes live)
   - OR **Automatic release** (goes live as soon as approved)
   - Recommended: **Manual** for first release

5. **Confirm Submission:**
   - Review export compliance (answer No if no encryption beyond standard)
   - Review advertising identifier (answer No if not using ads)
   - Click **"Submit"**

#### **After Submission:**

**Status Timeline:**
- **"Waiting for Review"** - Can take 24-72 hours
- **"In Review"** - Usually takes 1-24 hours
- **"Pending Developer Release"** (if manual release selected)
- **"Ready for Sale"** - Live in App Store! 🎉

**Possible Outcomes:**

**✅ Approved:**
- Congratulations! 🎉
- If manual release: Click "Release This Version" when ready
- If automatic: Live in ~24 hours
- Monitor for crashes/bugs (use Sentry or similar)

**❌ Rejected:**
- Don't panic - very common on first submission
- Read rejection reason carefully
- Fix the issues
- Resubmit (usually faster 2nd time)
- Common reasons:
  - Crashes during review
  - Missing privacy policy
  - In-app purchase issues
  - Misleading screenshots/description
  - Demo account doesn't work

#### **Post-Launch Monitoring:**

**First 24 Hours:**
- [ ] Monitor crash reports
- [ ] Check backend logs for errors
- [ ] Verify payments working
- [ ] Respond to any user reviews
- [ ] Check download numbers

**First Week:**
- [ ] Collect user feedback
- [ ] Fix critical bugs quickly (submit 1.0.1 if needed)
- [ ] Monitor server costs (Railway usage)
- [ ] Check OpenAI API usage
- [ ] Monitor RevenueCat analytics

---

## 🗓️ Timeline Summary

### **Week 1: Core Functionality** ✅ DONE
- **Day 1-2:** Deep codebase analysis ✅
- **Day 3:** Diagnose photo enhancement issue ✅
- **Result:** Issue identified, solution in progress

### **Week 2: Beta Testing & Payments** ⏳ IN PROGRESS
- **Day 1:** OpenAI verification (waiting for response) ⏳
- **Day 2:** Test account isolation (30 min)
- **Day 2-3:** Set up TestFlight (2-3 hours)
- **Day 4:** Configure RevenueCat (2-3 hours)
- **Day 5:** Test payments end-to-end (1 hour)
- **Result:** Full beta testing with payments working

### **Week 3: App Store Prep**
- **Day 1-2:** Create privacy policy & terms (2-3 hours)
- **Day 3-4:** Create app screenshots (2-3 hours)
- **Day 5:** Write App Store metadata (1-2 hours)
- **Day 6-7:** Final testing & bug fixes (3-4 hours)
- **Result:** Ready for submission

### **Week 4: Submission & Launch** 🎉
- **Day 1:** Submit to App Store (30 min)
- **Day 2-4:** Wait for review (Apple's timeline)
- **Day 5+:** Launch! Monitor and iterate
- **Result:** Live in App Store

---

## 📁 Key Files Reference

### **Mobile App:**
- `/mobile/app.json` - Expo configuration, bundle ID
- `/mobile/eas.json` - Build profiles for EAS
- `/mobile/.env` - Environment variables (not committed)
- `/mobile/src/services/revenueCatService.ts` - Payment SDK
- `/mobile/src/services/enhancementService.ts` - Photo enhancement API
- `/mobile/src/context/AuthContext.tsx` - Authentication state
- `/mobile/PAYMENT_QUICKSTART.md` - RevenueCat setup guide
- `/mobile/PRODUCT_IDS.md` - Product configuration

### **Backend:**
- `/services/api/main.py` - All API endpoints
- `/services/api/openai_client.py` - OpenAI integration (line 209: model)
- `/services/api/revenue_cat.py` - Payment webhook handler
- `/services/worker/worker.py` - Job processing logic
- `/services/worker/processor.py` - Image enhancement
- `/services/api/railway.toml` - API deployment config
- `/services/worker/railway.toml` - Worker deployment config

### **Documentation:**
- `/CLAUDE.md` - Project overview & guidelines
- `/RAILWAY_SETUP_CHECKLIST.md` - Railway deployment guide
- `/LAUNCH_ROADMAP.md` - This file!

### **External Resources:**
- Railway API: `https://luster-ai-production.up.railway.app`
- Admin Dashboard: `https://luster-ai-production.up.railway.app/admin/dashboard`
- Supabase: `https://rdzanmwdqmidwifviwyr.supabase.co`
- App Store Connect: `https://appstoreconnect.apple.com`
- RevenueCat Dashboard: `https://app.revenuecat.com`
- OpenAI Platform: `https://platform.openai.com`

---

## 🚨 Current Blockers

### **Critical:**
1. **OpenAI gpt-image-1 Access** 🔴
   - **Issue:** Organization not verified for gpt-image-1 model
   - **Status:** Email sent to support@openai.com
   - **ETA:** 1-3 business days
   - **Workaround:** Switch to DALL-E 2 temporarily (if needed)
   - **Impact:** Photos can't be enhanced until resolved

### **High Priority:**
2. **Apple Developer Account** ⚠️
   - **Issue:** Need to confirm enrollment ($99/year)
   - **Impact:** Can't submit to App Store without it
   - **Action:** Verify account status

3. **RevenueCat API Keys** ⚠️
   - **Issue:** Placeholders in code, need actual keys
   - **Impact:** In-app purchases won't work
   - **Action:** Create RevenueCat account (15 min)

### **Medium Priority:**
4. **Legal Documents** ⚠️
   - **Issue:** Privacy policy & terms not created
   - **Impact:** App Store will reject without them
   - **Action:** Create or use template (1-2 hours)

5. **App Store Assets** ⚠️
   - **Issue:** Screenshots not created
   - **Impact:** Can't submit without them
   - **Action:** Create screenshots (2-3 hours)

### **Low Priority:**
6. **Android Setup** 📱
   - **Issue:** Android not tested or configured
   - **Impact:** iOS-only launch is fine
   - **Action:** Defer to post-launch

---

## 💰 Estimated Costs

### **One-Time:**
- Apple Developer Account: **$99/year**
- RevenueCat: **Free** (up to $2.5k monthly revenue)
- Domain (if needed): **$10-15/year**

### **Monthly (Ongoing):**
- Railway (API + Worker + DB): **$20-50/month**
- Supabase: **Free tier** (upgrade at $25/month if needed)
- Cloudflare R2: **$0.015/GB storage** (~$5-10/month estimated)
- OpenAI API: **$0.020/image** (variable, depends on usage)

### **Per-User Costs:**
- Image enhancement: **~$0.02/photo** (OpenAI)
- R2 storage: **~$0.001/photo** (storage + bandwidth)
- Total: **~$0.02/photo**

### **Revenue (If Using Suggested Pricing):**
- Small pack: **$6.25** (5 photos = $1.25/photo)
- Medium pack: **$15.00** (15 photos = $1.00/photo)
- Large pack: **$25.50** (30 photos = $0.85/photo)
- **Margin:** ~$0.83-$1.23 per photo

---

## 📊 Success Metrics

### **Launch Targets (First Month):**
- [ ] 100+ app downloads
- [ ] 50+ registered users
- [ ] 25+ paying customers
- [ ] 500+ photos enhanced
- [ ] < 1% crash rate
- [ ] 4.0+ star rating

### **Quality Metrics:**
- [ ] 99%+ API uptime
- [ ] < 30 second enhancement time
- [ ] < 2% job failure rate
- [ ] 90%+ user retention (7 days)

---

## 🎯 Next Actions (In Order)

1. **TODAY:**
   - [ ] Send improved email to OpenAI support
   - [ ] Monitor for OpenAI response
   - [ ] Choose next priority to tackle

2. **THIS WEEK:**
   - [ ] Test account isolation (30 min)
   - [ ] Set up TestFlight (2-3 hours)
   - [ ] Configure RevenueCat (2-3 hours)
   - [ ] Test purchases end-to-end

3. **NEXT WEEK:**
   - [ ] Create privacy policy & terms
   - [ ] Create app screenshots
   - [ ] Fill App Store metadata
   - [ ] Final testing

4. **WEEK 3-4:**
   - [ ] Submit to App Store
   - [ ] Wait for approval
   - [ ] Launch! 🚀

---

## 📞 Support & Resources

**If You Get Stuck:**
- Check `/mobile/PAYMENT_QUICKSTART.md` for RevenueCat setup
- Check `/RAILWAY_SETUP_CHECKLIST.md` for deployment issues
- Check Apple Developer Forums for App Store questions
- Check RevenueCat Community for payment issues
- Email OpenAI support for API access questions

**Useful Links:**
- [Apple Developer](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)
- [RevenueCat Docs](https://docs.revenuecat.com)
- [Expo EAS Docs](https://docs.expo.dev/build/introduction/)
- [Railway Docs](https://docs.railway.app)
- [OpenAI Platform](https://platform.openai.com/docs)

---

**Last Updated:** December 9, 2025
**Status:** 70% complete - Core features working, needs configuration
**Next Milestone:** TestFlight beta testing
**Estimated Launch:** ~3-4 weeks from now

**You've got this! 🚀**

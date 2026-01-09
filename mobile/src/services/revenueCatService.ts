import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  PurchasesError,
} from 'react-native-purchases'
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui'
import { Platform } from 'react-native'

// RevenueCat API Keys from environment
const REVENUECAT_API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '',
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',
})

// Entitlement identifiers - must match RevenueCat dashboard
export const ENTITLEMENTS = {
  PRO: 'Luster AI Pro',
} as const

// Product identifiers - must match App Store Connect / Google Play
export const PRODUCT_IDS = {
  // Consumable credit packs
  CREDITS_10: 'com.lusterai.credits.10',
  CREDITS_30: 'com.lusterai.credits.30',
  CREDITS_60: 'com.lusterai.credits.60',
  // Subscriptions
  PRO_MONTHLY: 'com.lusterai.pro.monthly',
  PRO_YEARLY: 'com.lusterai.pro.yearly',
} as const

// Credit amounts per product (for consumables)
export const CREDIT_AMOUNTS: Record<string, number> = {
  [PRODUCT_IDS.CREDITS_10]: 10,
  [PRODUCT_IDS.CREDITS_30]: 30,
  [PRODUCT_IDS.CREDITS_60]: 60,
}

export interface PurchaseResult {
  success: boolean
  customerInfo?: CustomerInfo
  error?: string
  errorCode?: PURCHASES_ERROR_CODE
  userCancelled?: boolean
}

export interface PaywallResult {
  result: PAYWALL_RESULT
  customerInfo?: CustomerInfo
  purchased: boolean
  restored: boolean
}

class RevenueCatService {
  private initialized = false
  private currentUserId: string | null = null

  /**
   * Initialize RevenueCat SDK
   * Call this once when the app starts or user logs in
   */
  async initialize(userId?: string): Promise<void> {
    if (!REVENUECAT_API_KEY) {
      console.warn('RevenueCat API key not configured')
      return
    }

    try {
      // Enable debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG)
      }

      if (!this.initialized) {
        // First-time configuration
        Purchases.configure({
          apiKey: REVENUECAT_API_KEY,
          appUserID: userId || undefined,
        })
        this.initialized = true
        this.currentUserId = userId || null
        console.log('✅ RevenueCat initialized successfully')
      } else if (userId && userId !== this.currentUserId) {
        // User changed - log in with new user ID
        await this.login(userId)
      }

      // Log initial customer info
      const customerInfo = await Purchases.getCustomerInfo()
      console.log('📦 RevenueCat Customer Info:', {
        userId: customerInfo.originalAppUserId,
        activeSubscriptions: customerInfo.activeSubscriptions,
        entitlements: Object.keys(customerInfo.entitlements.active),
      })
    } catch (error) {
      console.error('❌ Failed to initialize RevenueCat:', error)
      throw error
    }
  }

  /**
   * Login user to RevenueCat
   * Links purchases to your user ID
   */
  async login(userId: string): Promise<CustomerInfo> {
    try {
      const { customerInfo } = await Purchases.logIn(userId)
      this.currentUserId = userId
      console.log('✅ RevenueCat user logged in:', userId)
      return customerInfo
    } catch (error) {
      console.error('❌ RevenueCat login error:', error)
      throw error
    }
  }

  /**
   * Logout user from RevenueCat
   */
  async logout(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.logOut()
      this.currentUserId = null
      console.log('✅ RevenueCat user logged out')
      return customerInfo
    } catch (error) {
      console.error('❌ RevenueCat logout error:', error)
      throw error
    }
  }

  /**
   * Get available offerings (products) from RevenueCat
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings()

      if (offerings.current) {
        console.log('📦 Current offering:', offerings.current.identifier)
        console.log('📦 Available packages:', offerings.current.availablePackages.map(p => ({
          identifier: p.identifier,
          productId: p.product.identifier,
          price: p.product.priceString,
        })))
        return offerings.current
      }

      console.log('⚠️ No current offering found')
      return null
    } catch (error) {
      console.error('❌ Error fetching offerings:', error)
      return null
    }
  }

  /**
   * Get all offerings
   */
  async getAllOfferings(): Promise<Record<string, PurchasesOffering>> {
    try {
      const offerings = await Purchases.getOfferings()
      return offerings.all
    } catch (error) {
      console.error('❌ Error fetching all offerings:', error)
      return {}
    }
  }

  /**
   * Purchase a package
   */
  async purchasePackage(packageToBuy: PurchasesPackage): Promise<PurchaseResult> {
    try {
      console.log('💳 Purchasing package:', packageToBuy.identifier)
      const { customerInfo } = await Purchases.purchasePackage(packageToBuy)

      console.log('✅ Purchase successful:', {
        activeSubscriptions: customerInfo.activeSubscriptions,
        entitlements: Object.keys(customerInfo.entitlements.active),
      })

      return { success: true, customerInfo }
    } catch (error) {
      return this.handlePurchaseError(error)
    }
  }

  /**
   * Purchase a product by identifier
   */
  async purchaseProduct(productIdentifier: string): Promise<PurchaseResult> {
    try {
      console.log('💳 Purchasing product:', productIdentifier)

      const offerings = await Purchases.getOfferings()
      let packageToBuy: PurchasesPackage | undefined

      for (const offering of Object.values(offerings.all)) {
        packageToBuy = offering.availablePackages.find(
          pkg => pkg.product.identifier === productIdentifier
        )
        if (packageToBuy) break
      }

      if (!packageToBuy) {
        return { success: false, error: `Product not found: ${productIdentifier}` }
      }

      return this.purchasePackage(packageToBuy)
    } catch (error) {
      return this.handlePurchaseError(error)
    }
  }

  /**
   * Handle purchase errors
   */
  private handlePurchaseError(error: unknown): PurchaseResult {
    const purchaseError = error as PurchasesError
    console.error('❌ Purchase error:', purchaseError)

    if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { success: false, userCancelled: true, error: 'Purchase cancelled', errorCode: purchaseError.code }
    }

    if (purchaseError.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
      return { success: false, error: 'Payment is pending approval', errorCode: purchaseError.code }
    }

    if (purchaseError.code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
      return { success: false, error: 'You already own this product', errorCode: purchaseError.code }
    }

    return { success: false, error: purchaseError.message || 'Purchase failed', errorCode: purchaseError.code }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<PurchaseResult> {
    try {
      console.log('🔄 Restoring purchases...')
      const customerInfo = await Purchases.restorePurchases()

      console.log('✅ Restore result:', {
        activeSubscriptions: customerInfo.activeSubscriptions,
        entitlements: Object.keys(customerInfo.entitlements.active),
      })

      return { success: true, customerInfo }
    } catch (error) {
      return this.handlePurchaseError(error)
    }
  }

  /**
   * Get current customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.getCustomerInfo()
    } catch (error) {
      console.error('❌ Error getting customer info:', error)
      return null
    }
  }

  /**
   * Check if user has Pro entitlement
   */
  async hasProAccess(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo()
      return customerInfo.entitlements.active[ENTITLEMENTS.PRO] !== undefined
    } catch (error) {
      console.error('❌ Error checking pro access:', error)
      return false
    }
  }

  /**
   * Check if user has any active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo()
      return customerInfo.activeSubscriptions.length > 0
    } catch (error) {
      console.error('❌ Error checking subscription:', error)
      return false
    }
  }

  /**
   * Check specific entitlement
   */
  async hasEntitlement(entitlementId: string): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo()
      return customerInfo.entitlements.active[entitlementId] !== undefined
    } catch (error) {
      console.error('❌ Error checking entitlement:', error)
      return false
    }
  }

  /**
   * Get Pro subscription expiration date
   */
  async getSubscriptionExpirationDate(): Promise<Date | null> {
    try {
      const customerInfo = await Purchases.getCustomerInfo()
      const proEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO]
      return proEntitlement?.expirationDate ? new Date(proEntitlement.expirationDate) : null
    } catch (error) {
      console.error('❌ Error getting expiration date:', error)
      return null
    }
  }

  // ============================================
  // PAYWALL METHODS (RevenueCat UI)
  // ============================================

  /**
   * Present the RevenueCat Paywall
   * This uses the paywall configured in RevenueCat dashboard
   */
  async presentPaywall(offeringIdentifier?: string): Promise<PaywallResult> {
    try {
      console.log('💰 Presenting paywall...', offeringIdentifier ? `(Offering: ${offeringIdentifier})` : '')

      const result = await RevenueCatUI.presentPaywall({
        offering: offeringIdentifier ? await this.getOfferingById(offeringIdentifier) : undefined,
      })

      const customerInfo = await Purchases.getCustomerInfo()

      const paywallResult: PaywallResult = {
        result,
        customerInfo,
        purchased: result === PAYWALL_RESULT.PURCHASED,
        restored: result === PAYWALL_RESULT.RESTORED,
      }

      console.log('💰 Paywall result:', {
        result: PAYWALL_RESULT[result],
        purchased: paywallResult.purchased,
        restored: paywallResult.restored,
      })

      return paywallResult
    } catch (error) {
      console.error('❌ Paywall error:', error)
      return { result: PAYWALL_RESULT.ERROR, purchased: false, restored: false }
    }
  }

  /**
   * Present paywall only if user doesn't have required entitlement
   */
  async presentPaywallIfNeeded(requiredEntitlement: string = ENTITLEMENTS.PRO): Promise<PaywallResult> {
    try {
      console.log('💰 Presenting paywall if needed for:', requiredEntitlement)

      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: requiredEntitlement,
      })

      const customerInfo = await Purchases.getCustomerInfo()

      return {
        result,
        customerInfo,
        purchased: result === PAYWALL_RESULT.PURCHASED,
        restored: result === PAYWALL_RESULT.RESTORED,
      }
    } catch (error) {
      console.error('❌ Paywall if needed error:', error)
      return { result: PAYWALL_RESULT.ERROR, purchased: false, restored: false }
    }
  }

  /**
   * Get offering by identifier
   */
  private async getOfferingById(identifier: string): Promise<PurchasesOffering | undefined> {
    const offerings = await Purchases.getOfferings()
    return offerings.all[identifier]
  }

  // ============================================
  // CUSTOMER CENTER (Subscription Management)
  // ============================================

  /**
   * Present Customer Center for subscription management
   * Users can manage subscriptions, view history, request support
   */
  async presentCustomerCenter(): Promise<void> {
    try {
      console.log('👤 Presenting Customer Center...')
      await RevenueCatUI.presentCustomerCenter()
      console.log('👤 Customer Center closed')
    } catch (error) {
      console.error('❌ Customer Center error:', error)
      throw error
    }
  }

  // ============================================
  // USER ATTRIBUTES
  // ============================================

  /**
   * Set user attributes for analytics
   */
  async setUserAttributes(attributes: {
    email?: string
    displayName?: string
    phoneNumber?: string
    [key: string]: string | undefined
  }): Promise<void> {
    try {
      if (attributes.email) Purchases.setEmail(attributes.email)
      if (attributes.displayName) Purchases.setDisplayName(attributes.displayName)
      if (attributes.phoneNumber) Purchases.setPhoneNumber(attributes.phoneNumber)

      const customAttributes: Record<string, string> = {}
      for (const [key, value] of Object.entries(attributes)) {
        if (!['email', 'displayName', 'phoneNumber'].includes(key) && value) {
          customAttributes[key] = value
        }
      }

      if (Object.keys(customAttributes).length > 0) {
        await Purchases.setAttributes(customAttributes)
      }

      console.log('✅ User attributes set')
    } catch (error) {
      console.error('❌ Error setting attributes:', error)
    }
  }

  /**
   * Sync purchases with stores
   */
  async syncPurchases(): Promise<CustomerInfo | null> {
    try {
      const customerInfo = await Purchases.syncPurchases()
      console.log('✅ Purchases synced')
      return customerInfo
    } catch (error) {
      console.error('❌ Error syncing purchases:', error)
      return null
    }
  }

  /**
   * Get credit amount for a product
   */
  getCreditsForProduct(productId: string): number {
    return CREDIT_AMOUNTS[productId] || 0
  }

  /**
   * Check if SDK is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId
  }
}

// Export PAYWALL_RESULT for use in components
export { PAYWALL_RESULT }

export default new RevenueCatService()

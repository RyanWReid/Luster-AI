import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  PurchasesStoreProduct,
  LOG_LEVEL,
} from 'react-native-purchases'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// TODO: Replace with your actual RevenueCat API keys
// Get these from https://app.revenuecat.com/projects
const REVENUECAT_API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || 'your_ios_key_here',
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || 'your_android_key_here',
})

export interface SubscriptionPackage {
  identifier: string
  packageType: string
  product: {
    identifier: string
    description: string
    title: string
    price: number
    priceString: string
    currencyCode: string
    introPrice?: {
      price: number
      priceString: string
      period: string
    }
  }
}

export interface PurchaseResult {
  success: boolean
  customerInfo?: CustomerInfo
  error?: string
}

class RevenueCatService {
  private initialized = false

  /**
   * Initialize RevenueCat SDK
   * Call this once when the app starts
   */
  async initialize(userId?: string): Promise<void> {
    if (this.initialized) {
      console.log('RevenueCat already initialized')
      return
    }

    try {
      // Enable debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG)
      }

      // Configure SDK
      if (REVENUECAT_API_KEY) {
        Purchases.configure({
          apiKey: REVENUECAT_API_KEY,
          appUserID: userId, // Optional: link to your user ID
        })

        this.initialized = true
        console.log('RevenueCat initialized successfully')

        // Get initial customer info
        const customerInfo = await Purchases.getCustomerInfo()
        console.log('Customer info:', {
          activeSubscriptions: customerInfo.activeSubscriptions,
          entitlements: Object.keys(customerInfo.entitlements.active),
        })
      } else {
        console.warn('RevenueCat API key not found. Set EXPO_PUBLIC_REVENUECAT_IOS_KEY or EXPO_PUBLIC_REVENUECAT_ANDROID_KEY')
      }
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error)
      throw error
    }
  }

  /**
   * Get available offerings (products) from RevenueCat
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings()

      if (offerings.current !== null) {
        console.log('Current offering:', offerings.current.identifier)
        console.log('Available packages:', offerings.current.availablePackages.map(p => ({
          identifier: p.identifier,
          price: p.product.priceString,
        })))
        return offerings.current
      } else {
        console.log('No current offering found')
        return null
      }
    } catch (error) {
      console.error('Error fetching offerings:', error)
      return null
    }
  }

  /**
   * Purchase a package (subscription or one-time)
   */
  async purchasePackage(packageToBuy: PurchasesPackage): Promise<PurchaseResult> {
    try {
      console.log('Attempting to purchase:', packageToBuy.identifier)

      const { customerInfo } = await Purchases.purchasePackage(packageToBuy)

      console.log('Purchase successful:', {
        activeSubscriptions: customerInfo.activeSubscriptions,
        entitlements: Object.keys(customerInfo.entitlements.active),
      })

      return {
        success: true,
        customerInfo,
      }
    } catch (error: any) {
      console.error('Purchase error:', error)

      // Handle user cancellation gracefully
      if (error.userCancelled) {
        return {
          success: false,
          error: 'Purchase cancelled',
        }
      }

      return {
        success: false,
        error: error.message || 'Purchase failed',
      }
    }
  }

  /**
   * Purchase a product by identifier
   */
  async purchaseProduct(productIdentifier: string): Promise<PurchaseResult> {
    try {
      console.log('Attempting to purchase product:', productIdentifier)

      const { customerInfo } = await Purchases.purchaseStoreProduct(productIdentifier)

      console.log('Purchase successful:', {
        activeSubscriptions: customerInfo.activeSubscriptions,
        entitlements: Object.keys(customerInfo.entitlements.active),
      })

      return {
        success: true,
        customerInfo,
      }
    } catch (error: any) {
      console.error('Purchase error:', error)

      if (error.userCancelled) {
        return {
          success: false,
          error: 'Purchase cancelled',
        }
      }

      return {
        success: false,
        error: error.message || 'Purchase failed',
      }
    }
  }

  /**
   * Restore previous purchases
   * Required by Apple App Store guidelines
   */
  async restorePurchases(): Promise<PurchaseResult> {
    try {
      console.log('Restoring purchases...')

      const customerInfo = await Purchases.restorePurchases()

      console.log('Restore successful:', {
        activeSubscriptions: customerInfo.activeSubscriptions,
        entitlements: Object.keys(customerInfo.entitlements.active),
      })

      return {
        success: true,
        customerInfo,
      }
    } catch (error: any) {
      console.error('Restore error:', error)
      return {
        success: false,
        error: error.message || 'Restore failed',
      }
    }
  }

  /**
   * Get current customer info (entitlements, subscriptions)
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      const customerInfo = await Purchases.getCustomerInfo()
      return customerInfo
    } catch (error) {
      console.error('Error getting customer info:', error)
      return null
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo()

      // Check if user has any active entitlements
      const hasActive = Object.keys(customerInfo.entitlements.active).length > 0

      console.log('Active subscription check:', {
        hasActive,
        entitlements: Object.keys(customerInfo.entitlements.active),
      })

      return hasActive
    } catch (error) {
      console.error('Error checking subscription:', error)
      return false
    }
  }

  /**
   * Check if user has specific entitlement
   */
  async hasEntitlement(entitlementId: string): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo()
      return customerInfo.entitlements.active[entitlementId] !== undefined
    } catch (error) {
      console.error('Error checking entitlement:', error)
      return false
    }
  }

  /**
   * Get user ID from RevenueCat
   */
  async getUserId(): Promise<string | null> {
    try {
      const appUserID = await Purchases.getAppUserID()
      return appUserID
    } catch (error) {
      console.error('Error getting user ID:', error)
      return null
    }
  }

  /**
   * Set custom user attributes for analytics
   */
  async setAttributes(attributes: Record<string, string | null>): Promise<void> {
    try {
      await Purchases.setAttributes(attributes)
      console.log('Attributes set:', attributes)
    } catch (error) {
      console.error('Error setting attributes:', error)
    }
  }

  /**
   * Logout user from RevenueCat
   */
  async logout(): Promise<void> {
    try {
      await Purchases.logOut()
      console.log('User logged out from RevenueCat')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  /**
   * Login user to RevenueCat with app user ID
   */
  async login(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId)
      console.log('User logged in to RevenueCat:', userId)
    } catch (error) {
      console.error('Error logging in:', error)
      throw error
    }
  }
}

export default new RevenueCatService()

/**
 * Custom hook for RevenueCat integration
 *
 * Provides easy access to subscription and purchase functionality
 */

import { useState, useEffect, useCallback } from 'react'
import { PurchasesOffering, PurchasesPackage } from 'react-native-purchases'
import { Alert } from 'react-native'
import revenueCatService from '../services/revenueCatService'
import hapticFeedback from '../utils/haptics'

export interface UseRevenueCatOptions {
  userId?: string
  onCreditsUpdated?: () => Promise<void>
}

export interface UseRevenueCatResult {
  // State
  offerings: PurchasesOffering | null
  loading: boolean
  hasActiveSubscription: boolean

  // Actions
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>
  restorePurchases: () => Promise<boolean>
  refresh: () => Promise<void>
}

export function useRevenueCat(options: UseRevenueCatOptions = {}): UseRevenueCatResult {
  const { userId, onCreditsUpdated } = options
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  // Initialize RevenueCat and fetch offerings
  const refresh = useCallback(async () => {
    try {
      setLoading(true)

      // Initialize SDK
      await revenueCatService.initialize(userId)

      // Fetch available offerings
      const fetchedOfferings = await revenueCatService.getOfferings()
      setOfferings(fetchedOfferings)

      // Check subscription status
      const hasActive = await revenueCatService.hasActiveSubscription()
      setHasActiveSubscription(hasActive)

    } catch (error) {
      console.error('Error initializing RevenueCat:', error)
      Alert.alert(
        'Error',
        'Unable to load payment options. Please try again later.'
      )
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Initialize on mount
  useEffect(() => {
    refresh()
  }, [refresh])

  // Purchase a package
  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      hapticFeedback.medium()

      const result = await revenueCatService.purchasePackage(pkg)

      if (result.success) {
        hapticFeedback.notification('success')

        // Refresh subscription status
        const hasActive = await revenueCatService.hasActiveSubscription()
        setHasActiveSubscription(hasActive)

        // CRITICAL: Refresh credits from backend after successful purchase
        // RevenueCat webhook will have added credits, so we need to fetch the new balance
        if (onCreditsUpdated) {
          try {
            await onCreditsUpdated()
            console.log('💰 Credits refreshed after purchase')
          } catch (error) {
            console.error('Failed to refresh credits after purchase:', error)
          }
        }

        Alert.alert(
          'Success!',
          'Your purchase was successful. Credits have been added to your account.',
          [{ text: 'OK', onPress: () => hapticFeedback.light() }]
        )

        return true
      } else {
        // Only show error if not cancelled by user
        if (result.error && result.error !== 'Purchase cancelled') {
          hapticFeedback.notification('error')
          Alert.alert(
            'Purchase Failed',
            result.error || 'Unable to complete purchase. Please try again.',
            [{ text: 'OK', onPress: () => hapticFeedback.light() }]
          )
        }
        return false
      }
    } catch (error) {
      hapticFeedback.notification('error')
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK', onPress: () => hapticFeedback.light() }]
      )
      return false
    }
  }, [])

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      hapticFeedback.medium()

      const result = await revenueCatService.restorePurchases()

      if (result.success) {
        // Check if any entitlements were restored
        const hasActive = await revenueCatService.hasActiveSubscription()
        setHasActiveSubscription(hasActive)

        if (hasActive) {
          hapticFeedback.notification('success')
          Alert.alert(
            'Restored!',
            'Your purchases have been restored successfully.',
            [{ text: 'OK', onPress: () => hapticFeedback.light() }]
          )
          return true
        } else {
          hapticFeedback.notification('warning')
          Alert.alert(
            'No Purchases Found',
            'We couldn\'t find any purchases to restore for this account.',
            [{ text: 'OK', onPress: () => hapticFeedback.light() }]
          )
          return false
        }
      } else {
        hapticFeedback.notification('error')
        Alert.alert(
          'Restore Failed',
          result.error || 'Unable to restore purchases. Please try again.',
          [{ text: 'OK', onPress: () => hapticFeedback.light() }]
        )
        return false
      }
    } catch (error) {
      hapticFeedback.notification('error')
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK', onPress: () => hapticFeedback.light() }]
      )
      return false
    }
  }, [])

  return {
    offerings,
    loading,
    hasActiveSubscription,
    purchasePackage,
    restorePurchases,
    refresh,
  }
}

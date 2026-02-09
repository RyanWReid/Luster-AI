import React, { useCallback, useRef } from 'react'
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import revenueCatService, { PAYWALL_RESULT } from '../services/revenueCatService'
import { useAuth } from '../context/AuthContext'
import hapticFeedback from '../utils/haptics'

/**
 * CreditsScreen - RevenueCat Paywall
 *
 * This screen presents the RevenueCat paywall configured in your dashboard.
 * Configure your paywall design, copy, and products at: https://app.revenuecat.com
 *
 * Benefits of RevenueCat Paywall:
 * - A/B testing without app updates
 * - Remote configuration of prices and copy
 * - Built-in localization
 * - Analytics and conversion tracking
 */
export default function CreditsScreen() {
  const navigation = useNavigation()
  const { user, refreshCredits } = useAuth()
  const hasShownPaywall = useRef(false)

  // Present paywall when screen mounts
  useFocusEffect(
    useCallback(() => {
      let isActive = true

      const showPaywall = async () => {
        // Only show paywall once per screen mount
        if (hasShownPaywall.current) {
          if (navigation.canGoBack()) {
            navigation.goBack()
          }
          return
        }
        hasShownPaywall.current = true

        try {
          // Initialize RevenueCat with user ID
          if (user?.id) {
            await revenueCatService.initialize(user.id)
          }

          // Present the RevenueCat paywall
          const result = await revenueCatService.presentPaywall()

          if (!isActive) return

          // Handle result
          if (result.purchased || result.restored) {
            hapticFeedback.notification('success')
            // Refresh credits from backend after successful purchase
            await refreshCredits()
          }

          // Go back after paywall closes
          if (navigation.canGoBack()) {
            navigation.goBack()
          }
        } catch (error) {
          console.error('Paywall error:', error)
          if (isActive && navigation.canGoBack()) {
            navigation.goBack()
          }
        }
      }

      showPaywall()

      return () => {
        isActive = false
      }
    }, [user?.id, refreshCredits, navigation])
  )

  // Show loading while paywall initializes
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FEFEFE', '#F8F6FF', '#F6FAFF', '#FFFBF6']}
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <ActivityIndicator size="large" color="#D4AF37" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

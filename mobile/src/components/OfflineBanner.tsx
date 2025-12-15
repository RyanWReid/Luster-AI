import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useIsOffline, useNetwork } from '../context/NetworkContext'

interface OfflineBannerProps {
  /** Custom message to display when offline */
  message?: string
  /** Whether to show retry button */
  showRetry?: boolean
}

/**
 * Banner component that appears at the top of the screen when offline.
 * Automatically animates in/out based on network status.
 *
 * Usage:
 * <OfflineBanner />
 *
 * Place at the top of your screen layout, it will show/hide automatically.
 */
export function OfflineBanner({
  message = "You're offline. Some features may be unavailable.",
  showRetry = true,
}: OfflineBannerProps) {
  const isOffline = useIsOffline()
  const { checkConnection } = useNetwork()
  const insets = useSafeAreaInsets()
  const slideAnim = useRef(new Animated.Value(-100)).current

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOffline ? 0 : -100,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start()
  }, [isOffline, slideAnim])

  // Don't render if not offline (but keep for animation)
  if (!isOffline) {
    return null
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={20} color="#fbbf24" />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        {showRetry && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={checkConnection}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="refresh" size={18} color="#fbbf24" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#fbbf24',
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#fbbf24',
    fontWeight: '500',
  },
  retryButton: {
    padding: 4,
  },
})

export default OfflineBanner

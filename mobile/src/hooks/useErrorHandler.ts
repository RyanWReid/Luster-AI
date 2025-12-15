/**
 * useErrorHandler Hook
 *
 * Provides consistent error handling with automatic:
 * - User-friendly alerts
 * - Navigation to login on auth errors
 * - Navigation to credits screen on payment errors
 * - Logging for debugging
 */

import { useCallback } from 'react'
import { Alert } from 'react-native'
import { useNavigation, CommonActions } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import {
  getErrorInfo,
  formatErrorForLogging,
  ErrorInfo,
  ErrorAction,
} from '../lib/errorHandler'

interface ErrorHandlerOptions {
  /** Custom title override */
  title?: string
  /** Custom message override */
  message?: string
  /** Callback when user taps retry */
  onRetry?: () => void
  /** Callback after error is handled */
  onHandled?: (info: ErrorInfo) => void
  /** Whether to show alert (default: true) */
  showAlert?: boolean
  /** Whether to log error (default: true) */
  logError?: boolean
}

interface ErrorHandlerResult {
  /** Handle an error with automatic UI and navigation */
  handleError: (error: unknown, options?: ErrorHandlerOptions) => ErrorInfo
  /** Get error info without handling (for custom UI) */
  getInfo: (error: unknown) => ErrorInfo
}

/**
 * Hook for consistent error handling across the app
 *
 * Usage:
 * const { handleError } = useErrorHandler()
 *
 * try {
 *   await api.post('/enhance', data)
 * } catch (error) {
 *   handleError(error, { onRetry: () => enhance() })
 * }
 */
export function useErrorHandler(): ErrorHandlerResult {
  const navigation = useNavigation()
  const { signOut } = useAuth()

  const handleAction = useCallback(
    (action: ErrorAction, options?: ErrorHandlerOptions) => {
      switch (action) {
        case 'login':
          // Sign out and navigate to auth screen
          signOut()
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Auth' as never }],
            })
          )
          break

        case 'purchase':
          // Navigate to credits/purchase screen
          try {
            navigation.navigate('Credits' as never)
          } catch {
            // If Credits screen doesn't exist in current navigator
            console.log('Credits screen not available in current navigator')
          }
          break

        case 'retry':
          if (options?.onRetry) {
            options.onRetry()
          }
          break

        case 'go_back':
          if (navigation.canGoBack()) {
            navigation.goBack()
          }
          break

        case 'wait':
        case 'dismiss':
        case 'contact_support':
        default:
          // No automatic action needed
          break
      }
    },
    [navigation, signOut]
  )

  const showErrorAlert = useCallback(
    (info: ErrorInfo, options?: ErrorHandlerOptions) => {
      const title = options?.title || info.title
      const message = options?.message || info.message

      // Build alert buttons based on action type
      const buttons: Array<{
        text: string
        onPress?: () => void
        style?: 'default' | 'cancel' | 'destructive'
      }> = []

      switch (info.action) {
        case 'login':
          buttons.push({
            text: 'Sign In',
            onPress: () => handleAction('login', options),
          })
          break

        case 'purchase':
          buttons.push({
            text: 'Not Now',
            style: 'cancel',
          })
          buttons.push({
            text: 'Get Credits',
            onPress: () => handleAction('purchase', options),
          })
          break

        case 'retry':
          if (options?.onRetry) {
            buttons.push({
              text: 'Cancel',
              style: 'cancel',
            })
            buttons.push({
              text: 'Retry',
              onPress: () => handleAction('retry', options),
            })
          } else {
            buttons.push({ text: 'OK' })
          }
          break

        case 'wait':
          buttons.push({
            text: info.retryAfter ? `Wait ${info.retryAfter}s` : 'OK',
          })
          break

        case 'go_back':
          buttons.push({
            text: 'Go Back',
            onPress: () => handleAction('go_back', options),
          })
          break

        default:
          buttons.push({ text: 'OK' })
      }

      Alert.alert(title, message, buttons)
    },
    [handleAction]
  )

  const handleError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}): ErrorInfo => {
      const { showAlert = true, logError = true, onHandled } = options

      // Get error info
      const info = getErrorInfo(error)

      // Log error
      if (logError) {
        console.error(formatErrorForLogging(error))
        if (__DEV__ && info.details) {
          console.error('Details:', info.details)
        }
      }

      // Show alert
      if (showAlert) {
        showErrorAlert(info, options)
      }

      // Call handled callback
      if (onHandled) {
        onHandled(info)
      }

      return info
    },
    [showErrorAlert]
  )

  const getInfo = useCallback((error: unknown): ErrorInfo => {
    return getErrorInfo(error)
  }, [])

  return { handleError, getInfo }
}

export default useErrorHandler

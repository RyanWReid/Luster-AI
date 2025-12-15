/**
 * Centralized Error Handler
 *
 * Provides consistent error handling across the app with:
 * - Type guards for specific error types
 * - User-friendly messages
 * - Suggested actions for each error type
 */

import { APIError } from './api'

// =============================================================================
// Error Types
// =============================================================================

export type ErrorType =
  | 'rate_limit'      // 429 - Too many requests
  | 'timeout'         // 408 - Request timed out
  | 'auth_expired'    // 401 - Authentication expired
  | 'forbidden'       // 403 - Access denied
  | 'insufficient_credits' // 402 - Payment required
  | 'validation'      // 422 - Validation error
  | 'not_found'       // 404 - Resource not found
  | 'server_error'    // 5xx - Server error
  | 'network'         // No connection
  | 'unknown'         // Unknown error

export type ErrorAction =
  | 'retry'           // User can retry the action
  | 'wait'            // User should wait before retrying
  | 'login'           // User needs to re-authenticate
  | 'purchase'        // User needs to purchase credits
  | 'contact_support' // User should contact support
  | 'dismiss'         // Just dismiss the error
  | 'go_back'         // Navigate back

export interface ErrorInfo {
  type: ErrorType
  title: string
  message: string
  action: ErrorAction
  retryAfter?: number  // Seconds to wait (for rate limits)
  details?: string     // Technical details (for dev mode)
}

// =============================================================================
// Type Guards
// =============================================================================

export function isAuthError(error: unknown): error is APIError {
  return error instanceof APIError && error.statusCode === 401
}

export function isForbiddenError(error: unknown): error is APIError {
  return error instanceof APIError && error.statusCode === 403
}

export function isInsufficientCreditsError(error: unknown): error is APIError {
  return error instanceof APIError && error.statusCode === 402
}

export function isValidationError(error: unknown): error is APIError {
  return error instanceof APIError && error.statusCode === 422
}

export function isNotFoundError(error: unknown): error is APIError {
  return error instanceof APIError && error.statusCode === 404
}

export function isServerError(error: unknown): error is APIError {
  return (
    error instanceof APIError &&
    error.statusCode !== undefined &&
    error.statusCode >= 500 &&
    error.statusCode < 600
  )
}

export function isRateLimitError(error: unknown): error is APIError {
  return error instanceof APIError && error.statusCode === 429
}

export function isTimeoutError(error: unknown): error is APIError {
  return error instanceof APIError && error.statusCode === 408
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof APIError && !error.statusCode) {
    return true
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection')
    )
  }
  return false
}

// =============================================================================
// Error Classification
// =============================================================================

/**
 * Classify an error into a known error type
 */
export function classifyError(error: unknown): ErrorType {
  if (isRateLimitError(error)) return 'rate_limit'
  if (isTimeoutError(error)) return 'timeout'
  if (isAuthError(error)) return 'auth_expired'
  if (isForbiddenError(error)) return 'forbidden'
  if (isInsufficientCreditsError(error)) return 'insufficient_credits'
  if (isValidationError(error)) return 'validation'
  if (isNotFoundError(error)) return 'not_found'
  if (isServerError(error)) return 'server_error'
  if (isNetworkError(error)) return 'network'
  return 'unknown'
}

// =============================================================================
// User-Friendly Messages
// =============================================================================

const ERROR_MESSAGES: Record<ErrorType, { title: string; message: string; action: ErrorAction }> = {
  rate_limit: {
    title: 'Slow Down',
    message: 'You\'re making requests too quickly. Please wait a moment.',
    action: 'wait',
  },
  timeout: {
    title: 'Request Timed Out',
    message: 'The server took too long to respond. Please check your connection and try again.',
    action: 'retry',
  },
  auth_expired: {
    title: 'Session Expired',
    message: 'Your session has expired. Please sign in again to continue.',
    action: 'login',
  },
  forbidden: {
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action.',
    action: 'go_back',
  },
  insufficient_credits: {
    title: 'Out of Credits',
    message: 'You need more credits to enhance photos. Would you like to purchase more?',
    action: 'purchase',
  },
  validation: {
    title: 'Invalid Input',
    message: 'Please check your input and try again.',
    action: 'dismiss',
  },
  not_found: {
    title: 'Not Found',
    message: 'The requested item could not be found. It may have been deleted.',
    action: 'go_back',
  },
  server_error: {
    title: 'Server Error',
    message: 'Our servers are having trouble right now. Please try again in a few minutes.',
    action: 'retry',
  },
  network: {
    title: 'Connection Error',
    message: 'Unable to connect. Please check your internet connection and try again.',
    action: 'retry',
  },
  unknown: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    action: 'retry',
  },
}

// =============================================================================
// Main Error Handler
// =============================================================================

/**
 * Get comprehensive error information for display
 */
export function getErrorInfo(error: unknown): ErrorInfo {
  const type = classifyError(error)
  const baseInfo = ERROR_MESSAGES[type]

  const info: ErrorInfo = {
    type,
    ...baseInfo,
  }

  // Add specific details based on error type
  if (error instanceof APIError) {
    // Add retry-after for rate limits
    if (type === 'rate_limit' && error.retryAfter) {
      info.retryAfter = error.retryAfter
      info.message = `Please wait ${error.retryAfter} seconds before trying again.`
    }

    // Add validation details
    if (type === 'validation' && error.data?.detail) {
      const details = Array.isArray(error.data.detail)
        ? error.data.detail.map((d: any) => d.msg || d.message).join(', ')
        : error.data.detail
      info.message = details || info.message
    }

    // Add technical details for dev mode
    if (__DEV__) {
      info.details = `${error.statusCode || 'N/A'}: ${error.message}`
    }
  } else if (error instanceof Error) {
    if (__DEV__) {
      info.details = error.message
    }
  }

  return info
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: unknown): string {
  if (error instanceof APIError) {
    return `[APIError ${error.statusCode || 'N/A'}] ${error.message}`
  }
  if (error instanceof Error) {
    return `[${error.name}] ${error.message}`
  }
  return `[Unknown] ${String(error)}`
}

// =============================================================================
// Re-export type guards from api.ts for convenience
// =============================================================================

export {
  APIError,
  getRateLimitMessage,
  getTimeoutMessage,
} from './api'

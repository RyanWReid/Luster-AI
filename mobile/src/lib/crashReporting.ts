/**
 * Crash Reporting & Error Tracking
 *
 * Abstraction layer for error tracking that:
 * - Logs errors in development
 * - Ready for Sentry/Bugsnag integration in production
 * - Captures user context and breadcrumbs
 * - Filters sensitive data
 *
 * To enable Sentry:
 * 1. npm install @sentry/react-native
 * 2. Set SENTRY_DSN in environment
 * 3. Uncomment Sentry code below
 */

// import * as Sentry from '@sentry/react-native'

// =============================================================================
// Configuration
// =============================================================================

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || ''
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const ENABLED = IS_PRODUCTION && !!SENTRY_DSN

// Sensitive keys to filter from error context
const SENSITIVE_KEYS = [
  'password',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'secret',
  'authorization',
  'credit_card',
  'ssn',
]

// =============================================================================
// Types
// =============================================================================

export type Severity = 'fatal' | 'error' | 'warning' | 'info' | 'debug'

export interface UserContext {
  id?: string
  email?: string
  username?: string
  [key: string]: string | undefined
}

export interface ErrorContext {
  [key: string]: any
}

export interface Breadcrumb {
  category: string
  message: string
  level?: Severity
  data?: Record<string, any>
}

// =============================================================================
// Initialization
// =============================================================================

let isInitialized = false

/**
 * Initialize crash reporting
 * Call this early in app startup (App.tsx)
 */
export function initCrashReporting(): void {
  if (isInitialized) return

  if (ENABLED) {
    // Uncomment when Sentry is installed:
    // Sentry.init({
    //   dsn: SENTRY_DSN,
    //   environment: IS_PRODUCTION ? 'production' : 'development',
    //   enableAutoSessionTracking: true,
    //   sessionTrackingIntervalMillis: 30000,
    //   beforeSend(event) {
    //     // Filter sensitive data
    //     return filterSensitiveData(event)
    //   },
    // })
    console.log('[CrashReporting] Sentry ready (DSN configured)')
  } else {
    console.log('[CrashReporting] Development mode - logging to console')
  }

  isInitialized = true
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Filter sensitive data from objects
 */
function filterSensitiveData<T extends object>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj

  const filtered = { ...obj }

  for (const key of Object.keys(filtered)) {
    const lowerKey = key.toLowerCase()
    if (SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk))) {
      (filtered as any)[key] = '[FILTERED]'
    } else if (typeof (filtered as any)[key] === 'object') {
      (filtered as any)[key] = filterSensitiveData((filtered as any)[key])
    }
  }

  return filtered
}

/**
 * Format error for logging
 */
function formatError(error: Error, context?: ErrorContext): string {
  const lines = [
    `[${error.name}] ${error.message}`,
    error.stack || '',
  ]

  if (context) {
    lines.push('Context:', JSON.stringify(filterSensitiveData(context), null, 2))
  }

  return lines.join('\n')
}

// =============================================================================
// User Context
// =============================================================================

let currentUser: UserContext | null = null

/**
 * Set user context for error reports
 * Call after user signs in
 */
export function setUser(user: UserContext | null): void {
  currentUser = user ? filterSensitiveData(user) : null

  if (ENABLED) {
    // Sentry.setUser(currentUser)
  }

  if (__DEV__) {
    console.log('[CrashReporting] User set:', currentUser?.id || 'null')
  }
}

/**
 * Clear user context
 * Call after user signs out
 */
export function clearUser(): void {
  setUser(null)
}

// =============================================================================
// Breadcrumbs
// =============================================================================

const breadcrumbs: Breadcrumb[] = []
const MAX_BREADCRUMBS = 50

/**
 * Add a breadcrumb for debugging context
 */
export function addBreadcrumb(breadcrumb: Breadcrumb): void {
  const crumb: Breadcrumb = {
    ...breadcrumb,
    level: breadcrumb.level || 'info',
    data: breadcrumb.data ? filterSensitiveData(breadcrumb.data) : undefined,
  }

  breadcrumbs.push(crumb)

  // Keep only last N breadcrumbs
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift()
  }

  if (ENABLED) {
    // Sentry.addBreadcrumb({
    //   category: crumb.category,
    //   message: crumb.message,
    //   level: crumb.level,
    //   data: crumb.data,
    // })
  }
}

/**
 * Common breadcrumb helpers
 */
export const breadcrumb = {
  navigation: (screen: string) =>
    addBreadcrumb({ category: 'navigation', message: `Navigate to ${screen}` }),

  action: (action: string, data?: Record<string, any>) =>
    addBreadcrumb({ category: 'action', message: action, data }),

  api: (method: string, endpoint: string, status?: number) =>
    addBreadcrumb({
      category: 'api',
      message: `${method} ${endpoint}`,
      data: status ? { status } : undefined,
    }),

  error: (message: string, data?: Record<string, any>) =>
    addBreadcrumb({ category: 'error', message, level: 'error', data }),
}

// =============================================================================
// Error Capture
// =============================================================================

/**
 * Capture an exception
 */
export function captureException(
  error: Error,
  context?: ErrorContext
): string {
  const eventId = `local-${Date.now()}`

  // Add user context
  const fullContext: ErrorContext = {
    ...filterSensitiveData(context || {}),
    user: currentUser,
    breadcrumbs: breadcrumbs.slice(-10), // Last 10 breadcrumbs
  }

  if (ENABLED) {
    // return Sentry.captureException(error, {
    //   extra: fullContext,
    // })
  }

  // Development: log to console
  console.error(formatError(error, fullContext))
  return eventId
}

/**
 * Capture a message (non-exception)
 */
export function captureMessage(
  message: string,
  level: Severity = 'info',
  context?: ErrorContext
): string {
  const eventId = `local-${Date.now()}`

  if (ENABLED) {
    // return Sentry.captureMessage(message, {
    //   level,
    //   extra: filterSensitiveData(context || {}),
    // })
  }

  // Development: log to console
  const logFn = level === 'error' || level === 'fatal'
    ? console.error
    : level === 'warning'
    ? console.warn
    : console.log

  logFn(`[${level.toUpperCase()}] ${message}`, context || '')
  return eventId
}

// =============================================================================
// Error Boundary Integration
// =============================================================================

/**
 * Handle error from ErrorBoundary
 */
export function handleBoundaryError(
  error: Error,
  errorInfo: { componentStack: string }
): void {
  captureException(error, {
    componentStack: errorInfo.componentStack,
    source: 'ErrorBoundary',
  })
}

// =============================================================================
// Exports
// =============================================================================

export default {
  init: initCrashReporting,
  setUser,
  clearUser,
  addBreadcrumb,
  breadcrumb,
  captureException,
  captureMessage,
  handleBoundaryError,
}

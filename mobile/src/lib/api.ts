import { supabase } from './supabase'

/**
 * API Configuration
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * API Error class for better error handling
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public data?: any,
    public retryAfter?: number // Seconds until retry allowed (for 429)
  ) {
    super(message)
    this.name = 'APIError'
  }

  /**
   * Check if this is a rate limit error (429)
   */
  isRateLimited(): boolean {
    return this.statusCode === 429
  }
}

/**
 * Helper to check if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): error is APIError {
  return error instanceof APIError && error.statusCode === 429
}

/**
 * Get a user-friendly message for rate limit errors
 */
export function getRateLimitMessage(error: APIError): string {
  if (error.retryAfter && error.retryAfter > 0) {
    return `Please wait ${error.retryAfter} seconds before trying again`
  }
  return 'You\'re doing that too fast. Please wait a moment and try again.'
}

/**
 * Helper to check if an error is a timeout error
 */
export function isTimeoutError(error: unknown): error is APIError {
  return error instanceof APIError && error.statusCode === 408
}

/**
 * Get a user-friendly message for timeout errors
 */
export function getTimeoutMessage(_error: APIError): string {
  return 'The request took too long. Please check your connection and try again.'
}

// =============================================================================
// Retry with Exponential Backoff
// =============================================================================

/**
 * Configuration options for retry behavior
 */
export interface RetryConfig {
  maxRetries: number      // Maximum number of retry attempts
  baseDelayMs: number     // Initial delay before first retry
  maxDelayMs: number      // Maximum delay cap
  jitterFactor: number    // Random jitter (0-1) to prevent thundering herd
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,    // 1 second
  maxDelayMs: 10000,    // 10 seconds max
  jitterFactor: 0.2,    // ±20% jitter
}

/**
 * Check if an error is retryable (transient errors only)
 * - Network errors (no status code)
 * - 5xx server errors
 * - NOT 4xx client errors (won't succeed on retry)
 * - NOT 429 rate limits (handled separately with Retry-After)
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof APIError)) {
    // Network errors or other non-API errors are retryable
    return true
  }

  // No status code = network error, retryable
  if (!error.statusCode) {
    return true
  }

  // 5xx server errors are retryable
  if (error.statusCode >= 500 && error.statusCode < 600) {
    return true
  }

  // 4xx errors (including 429) are not retryable via backoff
  return false
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt)

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs)

  // Add jitter (±jitterFactor)
  const jitter = cappedDelay * config.jitterFactor * (Math.random() * 2 - 1)

  return Math.max(0, cappedDelay + jitter)
}

/**
 * Execute a function with retry and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry if it's not a retryable error
      if (!isRetryableError(error)) {
        throw error
      }

      // Don't retry if we've exhausted attempts
      if (attempt === finalConfig.maxRetries) {
        break
      }

      // Calculate and wait for backoff delay
      const delay = calculateBackoffDelay(attempt, finalConfig)
      console.log(`[API Retry] Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`)
      await sleep(delay)
    }
  }

  // All retries exhausted
  throw lastError
}

/**
 * Get the current auth token from Supabase session
 * Exported for use by services that need direct token access
 */
export async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.access_token) {
    // Decode JWT payload to log user ID (for debugging)
    try {
      const payload = JSON.parse(atob(session.access_token.split('.')[1]))
      console.log(`🔑 API Request - User ID: ${payload.sub}, Email: ${payload.email}`)
    } catch (e) {
      console.log('🔑 API Request - Token present but could not decode')
    }
  } else {
    console.log('🔑 API Request - No auth token')
  }

  return session?.access_token || null
}

/**
 * Default timeout for API requests (30 seconds)
 */
export const DEFAULT_TIMEOUT_MS = 30000

/**
 * Extended options for API requests
 */
export interface APIRequestOptions extends RequestInit {
  retry?: boolean | Partial<RetryConfig>  // Enable retry with optional config
  timeoutMs?: number                       // Request timeout in milliseconds
}

/**
 * Make an authenticated API request
 * Automatically includes Authorization header with Supabase JWT token
 * Supports automatic retry with exponential backoff for transient errors
 * Supports configurable timeouts (default 30s)
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: APIRequestOptions = {}
): Promise<T> {
  const { retry, timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options

  // Core request logic (extracted for retry wrapper)
  const executeRequest = async (): Promise<T> => {
    // Get auth token
    const token = await getAuthToken()

    // Build headers (use Record for type-safe indexing)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string> || {}),
    }

    // Add auth header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Build URL
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE_URL}${endpoint}`

    // Set up timeout with AbortController
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      // Make request with timeout signal
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      })

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type')
      const isJson = contentType?.includes('application/json')

      // Parse response
      const data = isJson ? await response.json() : await response.text()

      // Handle errors
      if (!response.ok) {
        // Extract Retry-After header for rate limit errors
        let retryAfter: number | undefined
        if (response.status === 429) {
          const retryHeader = response.headers.get('Retry-After')
          if (retryHeader) {
            retryAfter = parseInt(retryHeader, 10)
          }
          // Also check response body for retry_after
          if (!retryAfter && data?.retry_after) {
            retryAfter = data.retry_after
          }
        }

        throw new APIError(
          data?.message || data?.detail || 'API request failed',
          response.status,
          data,
          retryAfter
        )
      }

      return data
    } catch (error) {
      // Handle timeout abort
      if (error instanceof Error && error.name === 'AbortError') {
        throw new APIError(
          `Request timed out after ${timeoutMs}ms`,
          408, // Request Timeout status code
          { timeout: true, timeoutMs }
        )
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  try {
    // Execute with or without retry
    if (retry) {
      const retryConfig = typeof retry === 'object' ? retry : {}
      return await withRetry(executeRequest, retryConfig)
    }
    return await executeRequest()
  } catch (error) {
    // Re-throw APIError as-is
    if (error instanceof APIError) {
      throw error
    }

    // Wrap other errors
    throw new APIError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      undefined,
      error
    )
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  /**
   * GET request (retry enabled by default for read operations)
   */
  get: <T = any>(endpoint: string, options?: APIRequestOptions) =>
    apiRequest<T>(endpoint, { retry: true, ...options, method: 'GET' }),

  /**
   * POST request
   */
  post: <T = any>(endpoint: string, body?: any, options?: APIRequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  /**
   * PUT request
   */
  put: <T = any>(endpoint: string, body?: any, options?: APIRequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  /**
   * PATCH request
   */
  patch: <T = any>(endpoint: string, body?: any, options?: APIRequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  /**
   * DELETE request
   */
  delete: <T = any>(endpoint: string, options?: APIRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  /**
   * Upload file (multipart/form-data) with optional retry
   */
  upload: async <T = any>(
    endpoint: string,
    file: File | Blob,
    fieldName: string = 'file',
    additionalFields?: Record<string, string>,
    retryConfig?: boolean | Partial<RetryConfig>
  ) => {
    const executeUpload = async (): Promise<T> => {
      const token = await getAuthToken()
      const formData = new FormData()

      formData.append(fieldName, file)

      if (additionalFields) {
        Object.entries(additionalFields).forEach(([key, value]) => {
          formData.append(key, value)
        })
      }

      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const url = endpoint.startsWith('http')
        ? endpoint
        : `${API_BASE_URL}${endpoint}`

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        // Extract Retry-After header for rate limit errors
        let retryAfter: number | undefined
        if (response.status === 429) {
          const retryHeader = response.headers.get('Retry-After')
          if (retryHeader) {
            retryAfter = parseInt(retryHeader, 10)
          }
          if (!retryAfter && data?.retry_after) {
            retryAfter = data.retry_after
          }
        }

        throw new APIError(
          data?.message || data?.detail || 'Upload failed',
          response.status,
          data,
          retryAfter
        )
      }

      return data as T
    }

    // Execute with or without retry
    if (retryConfig) {
      const config = typeof retryConfig === 'object' ? retryConfig : {}
      return withRetry(executeUpload, config)
    }
    return executeUpload()
  },
}

/**
 * Example usage:
 *
 * // Simple GET request (retry enabled by default)
 * const user = await api.get('/api/user/me')
 *
 * // GET without retry
 * const data = await api.get('/api/data', { retry: false })
 *
 * // POST with retry enabled for important operations
 * const result = await api.post('/api/jobs', {
 *   asset_id: 'abc123',
 *   style_preset: 'dusk'
 * }, { retry: true })
 *
 * // POST with custom retry config
 * const critical = await api.post('/api/critical', payload, {
 *   retry: { maxRetries: 5, baseDelayMs: 2000 }
 * })
 *
 * // Handle errors (rate limits handled specially)
 * try {
 *   await api.get('/api/protected')
 * } catch (error) {
 *   if (isRateLimitError(error)) {
 *     console.log(getRateLimitMessage(error))
 *   } else if (error instanceof APIError) {
 *     console.log(error.statusCode) // 401, 403, 500, etc.
 *     console.log(error.message)
 *   }
 * }
 */

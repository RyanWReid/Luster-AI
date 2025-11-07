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
    public data?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Get the current auth token from Supabase session
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

/**
 * Make an authenticated API request
 * Automatically includes Authorization header with Supabase JWT token
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    // Get auth token
    const token = await getAuthToken()

    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Add auth header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Build URL
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE_URL}${endpoint}`

    // Make request
    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')

    // Parse response
    const data = isJson ? await response.json() : await response.text()

    // Handle errors
    if (!response.ok) {
      throw new APIError(
        data?.message || data?.detail || 'API request failed',
        response.status,
        data
      )
    }

    return data
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
   * GET request
   */
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  /**
   * POST request
   */
  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  /**
   * PUT request
   */
  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  /**
   * PATCH request
   */
  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  /**
   * DELETE request
   */
  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  /**
   * Upload file (multipart/form-data)
   */
  upload: async <T = any>(
    endpoint: string,
    file: File | Blob,
    fieldName: string = 'file',
    additionalFields?: Record<string, string>
  ) => {
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
      throw new APIError(
        data?.message || data?.detail || 'Upload failed',
        response.status,
        data
      )
    }

    return data as T
  },
}

/**
 * Example usage:
 *
 * // Simple GET request
 * const user = await api.get('/api/user/me')
 *
 * // POST with body
 * const result = await api.post('/api/jobs', {
 *   asset_id: 'abc123',
 *   style_preset: 'dusk'
 * })
 *
 * // Handle errors
 * try {
 *   await api.get('/api/protected')
 * } catch (error) {
 *   if (error instanceof APIError) {
 *     console.log(error.statusCode) // 401, 403, etc.
 *     console.log(error.message)
 *   }
 * }
 */

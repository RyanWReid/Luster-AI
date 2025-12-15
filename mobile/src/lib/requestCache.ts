/**
 * Request Deduplication & Caching
 *
 * Prevents duplicate API calls by:
 * - Deduplicating in-flight requests (same request returns same promise)
 * - Optional response caching with TTL
 * - Automatic cache invalidation
 */

// =============================================================================
// Types
// =============================================================================

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
}

interface CacheOptions {
  /** Time-to-live in milliseconds (default: 0 = no caching) */
  ttl?: number
  /** Force fresh request, ignoring cache */
  fresh?: boolean
}

// =============================================================================
// Request Cache Class
// =============================================================================

class RequestCache {
  /** Cache for completed responses */
  private cache: Map<string, CacheEntry<any>> = new Map()

  /** Map of in-flight requests */
  private pending: Map<string, PendingRequest<any>> = new Map()

  /** Default TTL in milliseconds */
  private defaultTTL: number = 0

  /**
   * Generate a cache key from request parameters
   */
  private generateKey(endpoint: string, options?: RequestInit): string {
    const method = options?.method || 'GET'
    const body = options?.body ? String(options.body) : ''
    return `${method}:${endpoint}:${body}`
  }

  /**
   * Check if a cache entry is still valid
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() < entry.expiresAt
  }

  /**
   * Get cached response if available and valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (entry && this.isValid(entry)) {
      console.log(`[Cache] Hit: ${key.substring(0, 50)}...`)
      return entry.data as T
    }
    if (entry) {
      // Clean up expired entry
      this.cache.delete(key)
    }
    return null
  }

  /**
   * Store response in cache
   */
  set<T>(key: string, data: T, ttl: number): void {
    if (ttl <= 0) return // Don't cache if TTL is 0

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    })
    console.log(`[Cache] Stored: ${key.substring(0, 50)}... (TTL: ${ttl}ms)`)
  }

  /**
   * Get pending request promise if exists
   */
  getPending<T>(key: string): Promise<T> | null {
    const pending = this.pending.get(key)
    if (pending) {
      console.log(`[Cache] Deduped: ${key.substring(0, 50)}...`)
      return pending.promise as Promise<T>
    }
    return null
  }

  /**
   * Register a pending request
   */
  setPending<T>(key: string, promise: Promise<T>): void {
    this.pending.set(key, {
      promise,
      timestamp: Date.now(),
    })

    // Clean up when complete - catch errors to prevent unhandled rejection
    promise
      .catch(() => {
        // Error is handled by the caller, just ignore here
      })
      .finally(() => {
        this.pending.delete(key)
      })
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidate(pattern: string | RegExp): number {
    let count = 0
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        count++
      }
    }

    console.log(`[Cache] Invalidated ${count} entries matching: ${pattern}`)
    return count
  }

  /**
   * Clear all cache entries and pending requests
   */
  clear(): void {
    const cacheCount = this.cache.size
    const pendingCount = this.pending.size
    this.cache.clear()
    this.pending.clear()
    console.log(`[Cache] Cleared ${cacheCount} cache entries and ${pendingCount} pending requests`)
  }

  /**
   * Execute a request with deduplication and optional caching
   */
  async execute<T>(
    key: string,
    request: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = this.defaultTTL, fresh = false } = options

    // Check cache first (unless fresh is requested)
    if (!fresh && ttl > 0) {
      const cached = this.get<T>(key)
      if (cached !== null) {
        return cached
      }
    }

    // Check for pending request (deduplication)
    const pending = this.getPending<T>(key)
    if (pending) {
      return pending
    }

    // Execute new request
    const promise = request()
    this.setPending(key, promise)

    try {
      const result = await promise
      // Cache successful result
      if (ttl > 0) {
        this.set(key, result, ttl)
      }
      return result
    } catch (error) {
      // Don't cache errors
      throw error
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { cacheSize: number; pendingCount: number } {
    return {
      cacheSize: this.cache.size,
      pendingCount: this.pending.size,
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const requestCache = new RequestCache()

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a cache key from endpoint and options
 */
export function createCacheKey(
  endpoint: string,
  method: string = 'GET',
  body?: string
): string {
  return `${method}:${endpoint}:${body || ''}`
}

/**
 * Decorator for caching API responses
 *
 * Usage:
 * const data = await cachedRequest(
 *   '/api/styles',
 *   () => api.get('/api/styles'),
 *   { ttl: 60000 } // Cache for 1 minute
 * )
 */
export async function cachedRequest<T>(
  key: string,
  request: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  return requestCache.execute(key, request, options)
}

/**
 * Invalidate cache for specific endpoints
 *
 * Usage:
 * // After successful mutation
 * invalidateCache('/api/credits') // Invalidate exact match
 * invalidateCache(/\/api\/jobs/) // Invalidate pattern
 */
export function invalidateCache(pattern: string | RegExp): number {
  return requestCache.invalidate(pattern)
}

/**
 * Clear entire cache
 */
export function clearCache(): void {
  requestCache.clear()
}

export default requestCache

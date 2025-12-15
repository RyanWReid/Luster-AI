/**
 * Request Cache Tests
 *
 * Tests for request deduplication and caching functionality
 */

import {
  requestCache,
  createCacheKey,
  cachedRequest,
  invalidateCache,
  clearCache,
} from '../lib/requestCache'

// Helper to create delays in tests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('Request Cache', () => {
  beforeEach(async () => {
    // Clear cache before each test
    clearCache()
    // Wait a tick to ensure any stray promises from previous tests settle
    await new Promise(resolve => setTimeout(resolve, 10))
  })

  afterEach(async () => {
    // Ensure complete cleanup after each test
    clearCache()
    await new Promise(resolve => setTimeout(resolve, 10))
  })

  // ==========================================================================
  // createCacheKey
  // ==========================================================================
  describe('createCacheKey', () => {
    it('should create key with GET method by default', () => {
      const key = createCacheKey('/api/users')
      expect(key).toBe('GET:/api/users:')
    })

    it('should create key with specified method', () => {
      const key = createCacheKey('/api/users', 'POST')
      expect(key).toBe('POST:/api/users:')
    })

    it('should include body in key', () => {
      const key = createCacheKey('/api/users', 'POST', '{"name":"test"}')
      expect(key).toBe('POST:/api/users:{"name":"test"}')
    })

    it('should create unique keys for different endpoints', () => {
      const key1 = createCacheKey('/api/users')
      const key2 = createCacheKey('/api/posts')
      expect(key1).not.toBe(key2)
    })

    it('should create unique keys for different methods', () => {
      const key1 = createCacheKey('/api/users', 'GET')
      const key2 = createCacheKey('/api/users', 'POST')
      expect(key1).not.toBe(key2)
    })
  })

  // ==========================================================================
  // Request Deduplication
  // ==========================================================================
  describe('Request Deduplication', () => {
    it('should deduplicate concurrent identical requests', async () => {
      let callCount = 0

      const mockRequest = async () => {
        callCount++
        await delay(50) // Simulate network delay
        return { data: 'result' }
      }

      // Fire 3 requests simultaneously
      const results = await Promise.all([
        requestCache.execute('test-key', mockRequest),
        requestCache.execute('test-key', mockRequest),
        requestCache.execute('test-key', mockRequest),
      ])

      // Should only call the function once
      expect(callCount).toBe(1)

      // All results should be identical
      expect(results[0]).toEqual({ data: 'result' })
      expect(results[1]).toEqual({ data: 'result' })
      expect(results[2]).toEqual({ data: 'result' })
    })

    it('should not deduplicate sequential requests', async () => {
      let callCount = 0

      const mockRequest = async () => {
        callCount++
        return { data: 'result' }
      }

      await requestCache.execute('test-key', mockRequest)
      await requestCache.execute('test-key', mockRequest)

      // Without TTL caching, sequential requests should each execute
      expect(callCount).toBe(2)
    })

    it('should deduplicate only matching keys', async () => {
      let callCount = 0

      const mockRequest = async () => {
        callCount++
        await delay(50)
        return { data: 'result' }
      }

      await Promise.all([
        requestCache.execute('key-1', mockRequest),
        requestCache.execute('key-2', mockRequest),
        requestCache.execute('key-1', mockRequest), // Should dedupe with first
      ])

      // key-1 and key-2 are different, so 2 calls
      expect(callCount).toBe(2)
    })
  })

  // ==========================================================================
  // Response Caching with TTL
  // ==========================================================================
  describe('Response Caching with TTL', () => {
    it('should cache responses when TTL is specified', async () => {
      let callCount = 0

      const mockRequest = async () => {
        callCount++
        return { data: 'cached-result' }
      }

      // First request - should execute
      const result1 = await requestCache.execute('cache-key', mockRequest, { ttl: 5000 })
      expect(callCount).toBe(1)
      expect(result1).toEqual({ data: 'cached-result' })

      // Second request - should return cached
      const result2 = await requestCache.execute('cache-key', mockRequest, { ttl: 5000 })
      expect(callCount).toBe(1) // Still 1 - used cache
      expect(result2).toEqual({ data: 'cached-result' })
    })

    it('should not cache when TTL is 0', async () => {
      let callCount = 0

      const mockRequest = async () => {
        callCount++
        return { data: 'result' }
      }

      await requestCache.execute('no-cache-key', mockRequest, { ttl: 0 })
      await requestCache.execute('no-cache-key', mockRequest, { ttl: 0 })

      expect(callCount).toBe(2)
    })

    it('should bypass cache when fresh option is true', async () => {
      let callCount = 0

      const mockRequest = async () => {
        callCount++
        return { data: `result-${callCount}` }
      }

      // First request - populates cache
      await requestCache.execute('fresh-key', mockRequest, { ttl: 5000 })
      expect(callCount).toBe(1)

      // Second request with fresh - should bypass cache
      const result = await requestCache.execute('fresh-key', mockRequest, { ttl: 5000, fresh: true })
      expect(callCount).toBe(2)
      expect(result).toEqual({ data: 'result-2' })
    })

    it('should expire cache after TTL', async () => {
      let callCount = 0

      const mockRequest = async () => {
        callCount++
        return { data: 'result' }
      }

      // First request with very short TTL
      await requestCache.execute('expire-key', mockRequest, { ttl: 50 })
      expect(callCount).toBe(1)

      // Wait for TTL to expire
      await delay(100)

      // Second request - cache should be expired
      await requestCache.execute('expire-key', mockRequest, { ttl: 50 })
      expect(callCount).toBe(2)
    })
  })

  // ==========================================================================
  // Error Handling
  // ==========================================================================
  describe('Error Handling', () => {
    it('should not cache errors', async () => {
      let callCount = 0

      const mockRequest = async () => {
        callCount++
        if (callCount === 1) {
          throw new Error('First request failed')
        }
        return { data: 'success' }
      }

      // First request fails
      let firstError: Error | null = null
      try {
        await requestCache.execute('error-key-1', mockRequest, { ttl: 5000 })
      } catch (e) {
        firstError = e as Error
      }

      expect(firstError).not.toBeNull()
      expect(firstError?.message).toBe('First request failed')
      expect(callCount).toBe(1)

      // Second request should try again (error not cached)
      const result = await requestCache.execute('error-key-1', mockRequest, { ttl: 5000 })
      expect(result).toEqual({ data: 'success' })
      expect(callCount).toBe(2)
    })

    it('should propagate errors to all deduped requests', async () => {
      // Use unique key to avoid any cache interference
      const uniqueKey = `fail-key-${Date.now()}`
      let callCount = 0

      const mockRequest = async (): Promise<{ data: string }> => {
        callCount++
        await delay(50)
        throw new Error('Propagated error')
      }

      // Fire all requests concurrently
      const promise1 = requestCache.execute(uniqueKey, mockRequest).catch(e => ({ error: e }))
      const promise2 = requestCache.execute(uniqueKey, mockRequest).catch(e => ({ error: e }))
      const promise3 = requestCache.execute(uniqueKey, mockRequest).catch(e => ({ error: e }))

      // Wait for all to complete
      const results = await Promise.all([promise1, promise2, promise3])

      // Should only have called the function once (deduplication)
      expect(callCount).toBe(1)

      // All should have caught the same error
      results.forEach(result => {
        expect('error' in result).toBe(true)
        if ('error' in result) {
          expect((result.error as Error).message).toBe('Propagated error')
        }
      })
    })
  })

  // ==========================================================================
  // Cache Invalidation
  // ==========================================================================
  describe('Cache Invalidation', () => {
    it('should invalidate cache by exact string', async () => {
      const mockRequest = async () => ({ data: 'result' })

      // Populate cache
      await requestCache.execute('GET:/api/users:', mockRequest, { ttl: 5000 })

      // Invalidate
      const count = invalidateCache('GET:/api/users:')
      expect(count).toBe(1)

      // Verify stats show empty cache
      expect(requestCache.getStats().cacheSize).toBe(0)
    })

    it('should invalidate cache by regex pattern', async () => {
      const mockRequest = async () => ({ data: 'result' })

      // Populate multiple cache entries
      await requestCache.execute('GET:/api/users:1', mockRequest, { ttl: 5000 })
      await requestCache.execute('GET:/api/users:2', mockRequest, { ttl: 5000 })
      await requestCache.execute('GET:/api/posts:1', mockRequest, { ttl: 5000 })

      // Invalidate all user entries
      const count = invalidateCache(/\/api\/users/)
      expect(count).toBe(2)

      // Posts should still be cached
      expect(requestCache.getStats().cacheSize).toBe(1)
    })
  })

  // ==========================================================================
  // cachedRequest helper
  // ==========================================================================
  describe('cachedRequest helper', () => {
    it('should work as a convenience wrapper', async () => {
      let callCount = 0

      const result = await cachedRequest(
        'helper-key',
        async () => {
          callCount++
          return { data: 'helper-result' }
        },
        { ttl: 5000 }
      )

      expect(result).toEqual({ data: 'helper-result' })
      expect(callCount).toBe(1)

      // Second call should use cache
      await cachedRequest(
        'helper-key',
        async () => {
          callCount++
          return { data: 'new-result' }
        },
        { ttl: 5000 }
      )

      expect(callCount).toBe(1) // Still 1
    })
  })

  // ==========================================================================
  // getStats
  // ==========================================================================
  describe('getStats', () => {
    it('should return accurate cache statistics', async () => {
      // Use unique key for this test
      const uniqueKey = `stats-key-${Date.now()}`

      const mockRequest = async () => {
        await delay(50)
        return { data: 'result' }
      }

      // Initially empty (after clearCache in beforeEach)
      const initialStats = requestCache.getStats()
      expect(initialStats.cacheSize).toBe(0)
      expect(initialStats.pendingCount).toBe(0)

      // Start a pending request
      const promise = requestCache.execute(uniqueKey, mockRequest, { ttl: 5000 })

      // Should have 1 pending
      expect(requestCache.getStats().pendingCount).toBe(1)

      // Wait for completion
      await promise

      // Should have 1 cached, 0 pending
      const finalStats = requestCache.getStats()
      expect(finalStats.cacheSize).toBe(1)
      expect(finalStats.pendingCount).toBe(0)
    })
  })
})

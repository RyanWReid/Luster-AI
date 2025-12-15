/**
 * API Utilities Tests
 *
 * Tests for retry logic, timeout handling, and error creation
 */

import {
  APIError,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_TIMEOUT_MS,
  isRetryableError,
  isRateLimitError,
  isTimeoutError,
  getRateLimitMessage,
  getTimeoutMessage,
  withRetry,
} from '../lib/api'

// Helper to create delays in tests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('API Utilities', () => {
  // ==========================================================================
  // APIError Class
  // ==========================================================================
  describe('APIError', () => {
    it('should create an error with message only', () => {
      const error = new APIError('Something went wrong')
      expect(error.message).toBe('Something went wrong')
      expect(error.name).toBe('APIError')
      expect(error.statusCode).toBeUndefined()
      expect(error.data).toBeUndefined()
    })

    it('should create an error with status code', () => {
      const error = new APIError('Not found', 404)
      expect(error.message).toBe('Not found')
      expect(error.statusCode).toBe(404)
    })

    it('should create an error with data', () => {
      const error = new APIError('Validation failed', 422, { field: 'email' })
      expect(error.data).toEqual({ field: 'email' })
    })

    it('should create an error with retryAfter', () => {
      const error = new APIError('Too many requests', 429, null, 60)
      expect(error.retryAfter).toBe(60)
    })

    it('should check if rate limited via isRateLimited()', () => {
      const rateLimit = new APIError('Too fast', 429)
      const notFound = new APIError('Not found', 404)

      expect(rateLimit.isRateLimited()).toBe(true)
      expect(notFound.isRateLimited()).toBe(false)
    })

    it('should be an instance of Error', () => {
      const error = new APIError('Test')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(APIError)
    })
  })

  // ==========================================================================
  // Error Type Helpers
  // ==========================================================================
  describe('Error Type Helpers', () => {
    describe('isRateLimitError', () => {
      it('should return true for 429 APIError', () => {
        const error = new APIError('Rate limited', 429)
        expect(isRateLimitError(error)).toBe(true)
      })

      it('should return false for other status codes', () => {
        expect(isRateLimitError(new APIError('Error', 400))).toBe(false)
        expect(isRateLimitError(new APIError('Error', 500))).toBe(false)
      })

      it('should return false for non-APIError', () => {
        expect(isRateLimitError(new Error('Error'))).toBe(false)
        expect(isRateLimitError(null)).toBe(false)
      })
    })

    describe('isTimeoutError', () => {
      it('should return true for 408 APIError', () => {
        const error = new APIError('Timeout', 408)
        expect(isTimeoutError(error)).toBe(true)
      })

      it('should return false for other status codes', () => {
        expect(isTimeoutError(new APIError('Error', 429))).toBe(false)
      })
    })
  })

  // ==========================================================================
  // Message Helpers
  // ==========================================================================
  describe('Message Helpers', () => {
    describe('getRateLimitMessage', () => {
      it('should return message with retry time when retryAfter is set', () => {
        const error = new APIError('Rate limited', 429, null, 30)
        const message = getRateLimitMessage(error)
        expect(message).toContain('30 seconds')
      })

      it('should return default message when retryAfter is not set', () => {
        const error = new APIError('Rate limited', 429)
        const message = getRateLimitMessage(error)
        expect(message).toContain('too fast')
      })
    })

    describe('getTimeoutMessage', () => {
      it('should return timeout message', () => {
        const error = new APIError('Timeout', 408)
        const message = getTimeoutMessage(error)
        expect(message).toContain('took too long')
      })
    })
  })

  // ==========================================================================
  // Default Constants
  // ==========================================================================
  describe('Default Constants', () => {
    it('should have correct DEFAULT_TIMEOUT_MS', () => {
      expect(DEFAULT_TIMEOUT_MS).toBe(30000) // 30 seconds
    })

    it('should have correct DEFAULT_RETRY_CONFIG', () => {
      expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3)
      expect(DEFAULT_RETRY_CONFIG.baseDelayMs).toBe(1000)
      expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBe(10000)
      expect(DEFAULT_RETRY_CONFIG.jitterFactor).toBe(0.2)
    })
  })

  // ==========================================================================
  // isRetryableError
  // ==========================================================================
  describe('isRetryableError', () => {
    it('should return true for network errors (no status code)', () => {
      const error = new APIError('Network failed')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for 5xx server errors', () => {
      expect(isRetryableError(new APIError('Internal error', 500))).toBe(true)
      expect(isRetryableError(new APIError('Bad gateway', 502))).toBe(true)
      expect(isRetryableError(new APIError('Service unavailable', 503))).toBe(true)
    })

    it('should return false for 4xx client errors', () => {
      expect(isRetryableError(new APIError('Bad request', 400))).toBe(false)
      expect(isRetryableError(new APIError('Unauthorized', 401))).toBe(false)
      expect(isRetryableError(new APIError('Not found', 404))).toBe(false)
      expect(isRetryableError(new APIError('Rate limited', 429))).toBe(false)
    })

    it('should return true for non-APIError errors', () => {
      expect(isRetryableError(new Error('Generic error'))).toBe(true)
      expect(isRetryableError(new TypeError('Type error'))).toBe(true)
    })
  })

  // ==========================================================================
  // withRetry
  // ==========================================================================
  describe('withRetry', () => {
    it('should return result on first success', async () => {
      const fn = jest.fn().mockResolvedValue('success')

      const result = await withRetry(fn)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on retryable errors', async () => {
      let callCount = 0
      const fn = jest.fn().mockImplementation(async () => {
        callCount++
        if (callCount < 3) {
          throw new APIError('Server error', 500)
        }
        return 'success'
      })

      const result = await withRetry(fn, {
        baseDelayMs: 10, // Use small delays for fast tests
        maxDelayMs: 20,
      })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should not retry on non-retryable errors (4xx)', async () => {
      const fn = jest.fn().mockRejectedValue(new APIError('Unauthorized', 401))

      await expect(withRetry(fn)).rejects.toThrow('Unauthorized')
      expect(fn).toHaveBeenCalledTimes(1) // No retries
    })

    it('should throw after max retries exhausted', async () => {
      const fn = jest.fn().mockRejectedValue(new APIError('Server error', 500))

      await expect(
        withRetry(fn, {
          maxRetries: 2,
          baseDelayMs: 10,
          maxDelayMs: 20,
        })
      ).rejects.toThrow('Server error')

      // Initial + 2 retries = 3 calls
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should use custom retry config', async () => {
      const fn = jest.fn().mockRejectedValue(new APIError('Server error', 500))

      await expect(
        withRetry(fn, {
          maxRetries: 1,
          baseDelayMs: 5,
          maxDelayMs: 10,
          jitterFactor: 0,
        })
      ).rejects.toThrow()

      // Initial + 1 retry = 2 calls
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should retry network errors', async () => {
      let callCount = 0
      const fn = jest.fn().mockImplementation(async () => {
        callCount++
        if (callCount < 2) {
          throw new Error('Network request failed')
        }
        return 'success'
      })

      const result = await withRetry(fn, { baseDelayMs: 10, maxDelayMs: 20 })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should apply exponential backoff delays', async () => {
      const startTimes: number[] = []
      const fn = jest.fn().mockImplementation(async () => {
        startTimes.push(Date.now())
        if (startTimes.length < 3) {
          throw new APIError('Server error', 500)
        }
        return 'success'
      })

      await withRetry(fn, {
        maxRetries: 3,
        baseDelayMs: 50,
        maxDelayMs: 500,
        jitterFactor: 0, // No jitter for predictable delays
      })

      // Check delays are exponential-ish (with some tolerance)
      const delay1 = startTimes[1] - startTimes[0]
      const delay2 = startTimes[2] - startTimes[1]

      // First delay should be ~50ms (baseDelayMs * 2^0)
      expect(delay1).toBeGreaterThanOrEqual(40)
      expect(delay1).toBeLessThan(100)

      // Second delay should be ~100ms (baseDelayMs * 2^1)
      expect(delay2).toBeGreaterThanOrEqual(80)
      expect(delay2).toBeLessThan(200)
    })
  })
})

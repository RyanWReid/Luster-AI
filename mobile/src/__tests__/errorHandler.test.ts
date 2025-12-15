/**
 * Error Handler Tests
 *
 * Tests for centralized error classification and messaging
 */

import { APIError } from '../lib/api'
import {
  classifyError,
  getErrorInfo,
  isAuthError,
  isForbiddenError,
  isInsufficientCreditsError,
  isNetworkError,
  isNotFoundError,
  isRateLimitError,
  isServerError,
  isTimeoutError,
  isValidationError,
  formatErrorForLogging,
  ErrorType,
} from '../lib/errorHandler'

describe('Error Handler', () => {
  // ==========================================================================
  // Type Guards
  // ==========================================================================
  describe('Type Guards', () => {
    describe('isAuthError', () => {
      it('should return true for 401 APIError', () => {
        const error = new APIError('Unauthorized', 401)
        expect(isAuthError(error)).toBe(true)
      })

      it('should return false for other status codes', () => {
        expect(isAuthError(new APIError('Forbidden', 403))).toBe(false)
        expect(isAuthError(new APIError('Not found', 404))).toBe(false)
        expect(isAuthError(new APIError('Server error', 500))).toBe(false)
      })

      it('should return false for non-APIError', () => {
        expect(isAuthError(new Error('Generic error'))).toBe(false)
        expect(isAuthError('string error')).toBe(false)
        expect(isAuthError(null)).toBe(false)
      })
    })

    describe('isForbiddenError', () => {
      it('should return true for 403 APIError', () => {
        const error = new APIError('Forbidden', 403)
        expect(isForbiddenError(error)).toBe(true)
      })

      it('should return false for other status codes', () => {
        expect(isForbiddenError(new APIError('Unauthorized', 401))).toBe(false)
      })
    })

    describe('isInsufficientCreditsError', () => {
      it('should return true for 402 APIError', () => {
        const error = new APIError('Payment required', 402)
        expect(isInsufficientCreditsError(error)).toBe(true)
      })

      it('should return false for other status codes', () => {
        expect(isInsufficientCreditsError(new APIError('Unauthorized', 401))).toBe(false)
      })
    })

    describe('isValidationError', () => {
      it('should return true for 422 APIError', () => {
        const error = new APIError('Validation failed', 422)
        expect(isValidationError(error)).toBe(true)
      })
    })

    describe('isNotFoundError', () => {
      it('should return true for 404 APIError', () => {
        const error = new APIError('Not found', 404)
        expect(isNotFoundError(error)).toBe(true)
      })
    })

    describe('isServerError', () => {
      it('should return true for 5xx APIErrors', () => {
        expect(isServerError(new APIError('Internal error', 500))).toBe(true)
        expect(isServerError(new APIError('Bad gateway', 502))).toBe(true)
        expect(isServerError(new APIError('Service unavailable', 503))).toBe(true)
      })

      it('should return false for 4xx errors', () => {
        expect(isServerError(new APIError('Not found', 404))).toBe(false)
        expect(isServerError(new APIError('Unauthorized', 401))).toBe(false)
      })
    })

    describe('isRateLimitError', () => {
      it('should return true for 429 APIError', () => {
        const error = new APIError('Too many requests', 429, null, 60)
        expect(isRateLimitError(error)).toBe(true)
      })

      it('should return false for other status codes', () => {
        expect(isRateLimitError(new APIError('Server error', 500))).toBe(false)
      })
    })

    describe('isTimeoutError', () => {
      it('should return true for 408 APIError', () => {
        const error = new APIError('Request timeout', 408)
        expect(isTimeoutError(error)).toBe(true)
      })
    })

    describe('isNetworkError', () => {
      it('should return true for APIError without status code', () => {
        const error = new APIError('Network error')
        expect(isNetworkError(error)).toBe(true)
      })

      it('should return true for Error with network-related message', () => {
        expect(isNetworkError(new Error('Network request failed'))).toBe(true)
        expect(isNetworkError(new Error('Failed to fetch'))).toBe(true)
        expect(isNetworkError(new Error('Connection refused'))).toBe(true)
      })

      it('should return false for other errors', () => {
        expect(isNetworkError(new APIError('Not found', 404))).toBe(false)
        expect(isNetworkError(new Error('Something went wrong'))).toBe(false)
      })
    })
  })

  // ==========================================================================
  // classifyError
  // ==========================================================================
  describe('classifyError', () => {
    it('should classify rate limit errors', () => {
      expect(classifyError(new APIError('Too fast', 429))).toBe('rate_limit')
    })

    it('should classify timeout errors', () => {
      expect(classifyError(new APIError('Timeout', 408))).toBe('timeout')
    })

    it('should classify auth errors', () => {
      expect(classifyError(new APIError('Unauthorized', 401))).toBe('auth_expired')
    })

    it('should classify forbidden errors', () => {
      expect(classifyError(new APIError('Forbidden', 403))).toBe('forbidden')
    })

    it('should classify payment errors', () => {
      expect(classifyError(new APIError('Payment required', 402))).toBe('insufficient_credits')
    })

    it('should classify validation errors', () => {
      expect(classifyError(new APIError('Validation failed', 422))).toBe('validation')
    })

    it('should classify not found errors', () => {
      expect(classifyError(new APIError('Not found', 404))).toBe('not_found')
    })

    it('should classify server errors', () => {
      expect(classifyError(new APIError('Internal error', 500))).toBe('server_error')
      expect(classifyError(new APIError('Bad gateway', 502))).toBe('server_error')
    })

    it('should classify network errors', () => {
      expect(classifyError(new APIError('Network failed'))).toBe('network')
      expect(classifyError(new Error('Failed to fetch'))).toBe('network')
    })

    it('should classify unknown errors', () => {
      expect(classifyError(new Error('Some weird error'))).toBe('unknown')
      expect(classifyError('string error')).toBe('unknown')
      expect(classifyError(null)).toBe('unknown')
    })
  })

  // ==========================================================================
  // getErrorInfo
  // ==========================================================================
  describe('getErrorInfo', () => {
    it('should return proper error info for auth errors', () => {
      const error = new APIError('Token expired', 401)
      const info = getErrorInfo(error)

      expect(info.type).toBe('auth_expired')
      expect(info.title).toBe('Session Expired')
      expect(info.action).toBe('login')
    })

    it('should return proper error info for insufficient credits', () => {
      const error = new APIError('No credits', 402)
      const info = getErrorInfo(error)

      expect(info.type).toBe('insufficient_credits')
      expect(info.title).toBe('Out of Credits')
      expect(info.action).toBe('purchase')
    })

    it('should include retryAfter for rate limit errors', () => {
      const error = new APIError('Too fast', 429, null, 30)
      const info = getErrorInfo(error)

      expect(info.type).toBe('rate_limit')
      expect(info.retryAfter).toBe(30)
      expect(info.message).toContain('30 seconds')
    })

    it('should include validation details when available', () => {
      const error = new APIError('Validation failed', 422, {
        detail: [{ msg: 'Invalid email format' }],
      })
      const info = getErrorInfo(error)

      expect(info.type).toBe('validation')
      expect(info.message).toBe('Invalid email format')
    })

    it('should include technical details in dev mode', () => {
      const error = new APIError('Server error', 500)
      const info = getErrorInfo(error)

      // __DEV__ is set to true in jest.setup.js
      expect(info.details).toBeDefined()
      expect(info.details).toContain('500')
    })

    it('should handle server errors with retry action', () => {
      const error = new APIError('Internal error', 500)
      const info = getErrorInfo(error)

      expect(info.type).toBe('server_error')
      expect(info.action).toBe('retry')
    })

    it('should handle network errors', () => {
      const error = new APIError('Network failed')
      const info = getErrorInfo(error)

      expect(info.type).toBe('network')
      expect(info.action).toBe('retry')
    })

    it('should handle unknown errors gracefully', () => {
      const error = new Error('Unknown error')
      const info = getErrorInfo(error)

      expect(info.type).toBe('unknown')
      expect(info.action).toBe('retry')
      expect(info.title).toBe('Something Went Wrong')
    })
  })

  // ==========================================================================
  // formatErrorForLogging
  // ==========================================================================
  describe('formatErrorForLogging', () => {
    it('should format APIError with status code', () => {
      const error = new APIError('Not found', 404)
      const result = formatErrorForLogging(error)
      expect(result).toBe('[APIError 404] Not found')
    })

    it('should format APIError without status code', () => {
      const error = new APIError('Network error')
      const result = formatErrorForLogging(error)
      expect(result).toBe('[APIError N/A] Network error')
    })

    it('should format regular Error', () => {
      const error = new Error('Something went wrong')
      const result = formatErrorForLogging(error)
      expect(result).toBe('[Error] Something went wrong')
    })

    it('should format non-Error values', () => {
      expect(formatErrorForLogging('string error')).toBe('[Unknown] string error')
      expect(formatErrorForLogging(null)).toBe('[Unknown] null')
      expect(formatErrorForLogging(123)).toBe('[Unknown] 123')
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shootsApi, assetsApi, jobsApi, creditsApi, isApiError, withRetry } from '@/app/lib/api'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    // Clear localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(() => null),
      },
      writable: true,
    })
  })

  describe('shootsApi', () => {
    it('should create a shoot', async () => {
      const mockResponse = { id: '123', name: 'Test Shoot' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: { get: () => 'application/json' },
      })

      const result = await shootsApi.create('Test Shoot')
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/shoots',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should get shoot assets', async () => {
      const mockResponse = {
        shoot: { id: '123', name: 'Test Shoot' },
        assets: [],
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: { get: () => 'application/json' },
      })

      const result = await shootsApi.getAssets('123')
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/shoots/123/assets',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('assetsApi', () => {
    it('should upload an asset', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockResponse = { id: 'asset-123', filename: 'test.jpg', size: 1000 }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: { get: () => 'application/json' },
      })

      const result = await assetsApi.upload('shoot-123', mockFile)
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/uploads',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('jobsApi', () => {
    it('should create a job', async () => {
      const mockResponse = {
        id: 'job-123',
        status: 'queued',
        asset_id: 'asset-123',
        prompt: 'enhance this image',
        credits_used: 2,
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: { get: () => 'application/json' },
      })

      const result = await jobsApi.createEnhanced('asset-123', 'neutral', 'premium')
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/jobs',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should get job status', async () => {
      const mockResponse = {
        id: 'job-123',
        status: 'succeeded',
        output_url: '/outputs/job-123.jpg',
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: { get: () => 'application/json' },
      })

      const result = await jobsApi.get('job-123')
      
      expect(result).toEqual(mockResponse)
    })
  })

  describe('creditsApi', () => {
    it('should get credit balance', async () => {
      const mockResponse = { balance: 50 }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: { get: () => 'application/json' },
      })

      const result = await creditsApi.get()
      
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Error handling', () => {
    it('should handle 404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ detail: 'Resource not found' }),
      })

      await expect(shootsApi.get('nonexistent')).rejects.toThrow('Resource not found')
    })

    it('should handle 402 insufficient credits error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 402,
        statusText: 'Payment Required',
        json: async () => ({ detail: 'Insufficient credits' }),
      })

      try {
        await jobsApi.create('asset-123', 'test prompt')
      } catch (error) {
        expect(isApiError(error)).toBe(true)
        expect((error as any).status).toBe(402)
      }
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(creditsApi.get()).rejects.toThrow('Network error')
    })
  })

  describe('Retry logic', () => {
    it('should retry failed requests', async () => {
      const mockApiCall = vi.fn()
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValueOnce('success')

      const result = await withRetry(mockApiCall, 2, 10)

      expect(mockApiCall).toHaveBeenCalledTimes(2)
      expect(result).toBe('success')
    })

    it('should not retry client errors', async () => {
      const mockApiCall = vi.fn()
        .mockRejectedValue({ status: 400, message: 'Bad Request' })

      await expect(withRetry(mockApiCall, 2)).rejects.toMatchObject({
        status: 400,
        message: 'Bad Request',
      })

      expect(mockApiCall).toHaveBeenCalledTimes(1)
    })
  })
})
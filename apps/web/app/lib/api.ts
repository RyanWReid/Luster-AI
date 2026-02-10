import { ApiResponse, Asset, Job, Shoot, Credit, PaginatedResponse } from '@/app/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // Add auth token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('supabase.auth.token')
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }
    }
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      let errorCode: string | undefined
      
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.message || errorMessage
        errorCode = errorData.code
      } catch {
        // If JSON parsing fails, use the default error message
      }
      
      throw new ApiError(errorMessage, response.status, errorCode)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }
    
    return response as any
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    )
  }
}

// Shoots API
export const shootsApi = {
  create: (name: string): Promise<Shoot> => {
    const formData = new FormData()
    formData.append('name', name)
    
    return apiRequest('/shoots', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set boundary for FormData
      body: formData,
    })
  },

  get: (id: string): Promise<Shoot> => 
    apiRequest(`/shoots/${id}`),

  list: (): Promise<{ shoots: Shoot[] }> =>
    apiRequest('/shoots'),

  delete: (id: string): Promise<void> => 
    apiRequest(`/shoots/${id}`, { method: 'DELETE' }),

  getAssets: (id: string): Promise<{ shoot: Shoot; assets: Asset[] }> =>
    apiRequest(`/shoots/${id}/assets`),
}

// Assets API
export const assetsApi = {
  upload: (shootId: string, file: File): Promise<Asset> => {
    const formData = new FormData()
    formData.append('shoot_id', shootId)
    formData.append('file', file)
    
    return apiRequest('/uploads', {
      method: 'POST',
      headers: {}, // Remove Content-Type for FormData
      body: formData,
    })
  },

  get: (id: string): Promise<Asset> => 
    apiRequest(`/assets/${id}`),

  delete: (id: string): Promise<void> => 
    apiRequest(`/assets/${id}`, { method: 'DELETE' }),
}

// Jobs API
export const jobsApi = {
  create: (assetId: string, prompt: string): Promise<Job> => {
    const formData = new FormData()
    formData.append('asset_id', assetId)
    formData.append('prompt', prompt)
    
    return apiRequest('/jobs', {
      method: 'POST',
      headers: {}, // Remove Content-Type for FormData
      body: formData,
    })
  },

  // Enhanced job creation with tier and prompt name
  createEnhanced: (
    assetId: string, 
    promptName: string, 
    tier: 'free' | 'premium'
  ): Promise<Job> => {
    const formData = new FormData()
    formData.append('asset_id', assetId)
    formData.append('prompt', promptName) // Style key: "neutral", "bright", or "warm"
    formData.append('tier', tier)
    
    return apiRequest('/jobs', {
      method: 'POST',
      headers: {}, // Remove Content-Type for FormData
      body: formData,
    })
  },

  get: (id: string): Promise<Job> => 
    apiRequest(`/jobs/${id}`),

  list: (params?: {
    asset_id?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<PaginatedResponse<Job>> => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    const query = searchParams.toString()
    return apiRequest(`/jobs${query ? `?${query}` : ''}`)
  },

  cancel: (id: string): Promise<Job> => 
    apiRequest(`/jobs/${id}/cancel`, { method: 'POST' }),

  retry: (id: string): Promise<Job> => 
    apiRequest(`/jobs/${id}/retry`, { method: 'POST' }),
}

// Credits API
export const creditsApi = {
  get: (): Promise<Credit> => 
    apiRequest('/credits'),

  purchase: (amount: number): Promise<{ checkout_url: string }> =>
    apiRequest('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  history: (limit?: number): Promise<PaginatedResponse<any>> => {
    const query = limit ? `?limit=${limit}` : ''
    return apiRequest(`/credits/history${query}`)
  },
}

// Health check
export const healthApi = {
  check: (): Promise<{ status: string }> => 
    apiRequest('/health'),
}

// Presigned URL API (for direct uploads to R2)
export const uploadsApi = {
  getPresignedUrl: (
    filename: string,
    contentType: string,
    shootId: string
  ): Promise<{
    upload_url: string
    asset_id: string
    fields: Record<string, string>
  }> =>
    apiRequest('/uploads/presign', {
      method: 'POST',
      body: JSON.stringify({
        filename,
        content_type: contentType,
        shoot_id: shootId,
      }),
    }),
}

// File serving endpoints
export const getFileUrl = (path: string): string => {
  return `${API_BASE_URL}${path}`
}

export const getUploadUrl = (filename: string): string => {
  return `${API_BASE_URL}/uploads/${filename}`
}

export const getOutputUrl = (filename: string): string => {
  return `${API_BASE_URL}/outputs/${filename}`
}

// Error handling utilities
export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError
}

export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

export const isInsufficientCreditsError = (error: unknown): boolean => {
  return isApiError(error) && error.status === 402
}

export const isNotFoundError = (error: unknown): boolean => {
  return isApiError(error) && error.status === 404
}

export const isUnauthorizedError = (error: unknown): boolean => {
  return isApiError(error) && error.status === 401
}

// Retry logic for failed requests
export const withRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: unknown
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall()
    } catch (error) {
      lastError = error
      
      // Don't retry client errors (4xx) except 429 (rate limit)
      if (isApiError(error) && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api, getAuthToken } from '../lib/api'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'

// Custom error for insufficient credits
export class InsufficientCreditsError extends Error {
  constructor(message: string = 'Insufficient credits') {
    super(message)
    this.name = 'InsufficientCreditsError'
  }
}

interface EnhanceImageParams {
  imageUrl: string
  style: 'luster' | 'flambient'
  projectName?: string  // Name for new project (auto-generated if not provided)
  shootId?: string      // Existing shoot ID (to add photos to existing project)
  creditCost?: number   // Credit cost per photo (default 1, for flexible pricing)
}

interface EnhanceResponse {
  job_id: string
  shoot_id: string      // Backend shoot UUID
  asset_id: string      // Backend asset UUID
  project_name: string  // Actual project name used
  status: string
}

interface JobStatusResponse {
  job_id: string
  status: 'queued' | 'processing' | 'succeeded' | 'failed'
  enhanced_image_url?: string
  error?: string
  created_at: string
  updated_at: string
}

interface StyleInfo {
  id: string
  name: string
  description: string
}

interface CreditBalanceResponse {
  balance: number
  user_id: string
}

class EnhancementService {
  /**
   * Convert a URI to a Blob for upload
   */
  private async uriToBlob(uri: string): Promise<Blob> {
    const response = await fetch(uri)
    const blob = await response.blob()
    return blob
  }
  
  /**
   * Convert URI to base64 string
   */
  private async uriToBase64(uri: string): Promise<string> {
    const response = await fetch(uri)
    const blob = await response.blob()
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        // Remove the data:image/xxx;base64, prefix
        const base64Data = base64.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
  
  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('===== CONNECTION TEST =====')
      console.log('API Base URL:', API_BASE_URL)
      console.log('Test endpoint:', `${API_BASE_URL}/api/mobile/test`)
      console.log('Environment:', {
        EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
        NODE_ENV: process.env.NODE_ENV,
      })
      
      const startTime = Date.now()
      const response = await fetch(`${API_BASE_URL}/api/mobile/test`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })
      const responseTime = Date.now() - startTime
      
      console.log('Response received in', responseTime, 'ms')
      console.log('Response status:', response.status)
      console.log('Response headers:', {
        'content-type': response.headers.get('content-type'),
        'server': response.headers.get('server'),
      })
      
      const responseText = await response.text()
      console.log('Raw response:', responseText)
      
      try {
        const data = JSON.parse(responseText)
        console.log('Parsed response:', data)
        
        if (response.ok && data.status === 'connected') {
          console.log('✅ Connection test SUCCESSFUL')
          return true
        } else {
          console.log('❌ Connection test FAILED - unexpected response')
          return false
        }
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError)
        console.log('Response was not valid JSON:', responseText)
        return false
      }
    } catch (error: unknown) {
      console.error('===== CONNECTION TEST ERROR =====')
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('Error type:', err.constructor.name)
      console.error('Error message:', err.message)
      console.error('Error stack:', err.stack)

      // Check for common network errors
      if (err.message.includes('Network request failed')) {
        console.error('🔴 Network request failed - server may be down or unreachable')
        console.error('Possible causes:')
        console.error('1. API server is not running')
        console.error('2. Incorrect IP address or port')
        console.error('3. Firewall blocking the connection')
        console.error('4. Mobile device not on same network')
      } else if (err.message.includes('JSON Parse error')) {
        console.error('🔴 Server responded with non-JSON content')
      }

      return false
    }
  }
  
  /**
   * Start image enhancement job
   */
  async enhanceImage(params: EnhanceImageParams): Promise<EnhanceResponse> {
    try {
      console.log('===== ENHANCE IMAGE START =====')
      console.log('Parameters:', {
        imageUrl: params.imageUrl.substring(0, 50) + '...',
        style: params.style,
      })
      console.log('API Base URL:', API_BASE_URL)
      console.log('Target endpoint:', `${API_BASE_URL}/api/mobile/enhance`)
      
      // First test connection
      console.log('Testing connection before enhancement...')
      const isConnected = await this.testConnection()
      if (!isConnected) {
        console.error('❌ Connection test failed - cannot proceed with enhancement')
        console.error('Please ensure:')
        console.error('1. API server is running (cd services/api && uvicorn main:app --reload --host 0.0.0.0)')
        console.error('2. Mobile device is on same network as server')
        console.error('3. Environment variable EXPO_PUBLIC_API_URL is set correctly')
        throw new Error('Cannot connect to API server. Please check your network and server status.')
      }
      console.log('✅ Connection test passed')
      
      // Get auth token
      const token = await getAuthToken()
      if (!token) {
        throw new Error('Not authenticated. Please sign in to enhance images.')
      }

      // Try both methods: FormData with blob and base64
      try {
        // Method 1: FormData with proper file object
        console.log('===== METHOD 1: FormData =====')
        const formData = new FormData()

        // Create a proper file object for React Native
        const file: any = {
          uri: params.imageUrl,
          type: 'image/jpeg',
          name: 'photo.jpg',
        }

        console.log('Image file object created:', file)

        formData.append('image', file as any)
        formData.append('style', params.style)
        // Pass shoot_id to group photos in same project
        if (params.shootId) {
          formData.append('shoot_id', params.shootId)
          console.log('Adding to existing project:', params.shootId)
        }
        // Pass project_name for new projects
        if (params.projectName) {
          formData.append('project_name', params.projectName)
        }
        // Pass credit_cost for flexible pricing (default 1)
        const creditCost = params.creditCost ?? 1
        formData.append('credit_cost', creditCost.toString())
        console.log('FormData prepared with image, style, project info, and credit_cost:', creditCost)

        console.log('Sending FormData request to:', `${API_BASE_URL}/api/mobile/enhance`)
        const startTime = Date.now()
        const response = await fetch(`${API_BASE_URL}/api/mobile/enhance`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        })
        const responseTime = Date.now() - startTime
        
        console.log('FormData response received:', {
          status: response.status,
          statusText: response.statusText,
          responseTime: `${responseTime}ms`,
          headers: {
            'content-type': response.headers.get('content-type'),
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ FormData method successful:', data)
          return data
        }

        const errorText = await response.text()
        console.log('❌ FormData method failed:', {
          status: response.status,
          error: errorText,
        })

        // Check for insufficient credits - don't fallback, throw immediately
        if (response.status === 402) {
          console.log('💰 Insufficient credits detected')
          throw new InsufficientCreditsError('You need more credits to enhance photos')
        }

        console.log('Falling back to base64 method...')
      } catch (formError: unknown) {
        // Re-throw InsufficientCreditsError - don't fallback to base64
        if (formError instanceof InsufficientCreditsError) {
          throw formError
        }

        const err = formError instanceof Error ? formError : new Error(String(formError))
        console.error('❌ FormData method exception:', {
          name: err.name,
          message: err.message,
          stack: err.stack,
        })
      }
      
      // Method 2: Send as base64 (works better on Android)
      console.log('===== METHOD 2: Base64 =====')
      console.log('Converting image to base64...')
      const base64Image = await this.uriToBase64(params.imageUrl)
      console.log('Base64 conversion complete:', {
        length: base64Image.length,
        preview: base64Image.substring(0, 50) + '...',
      })
      
      const requestBody = {
        image: base64Image,
        style: params.style,
        project_name: params.projectName,
        shoot_id: params.shootId,
        credit_cost: params.creditCost ?? 1,
      }
      console.log('Request body prepared:', {
        imageLength: requestBody.image.length,
        style: requestBody.style,
        project_name: requestBody.project_name,
        shoot_id: requestBody.shoot_id,
        credit_cost: requestBody.credit_cost,
      })
      
      console.log('Sending base64 request to:', `${API_BASE_URL}/api/mobile/enhance-base64`)

      // Token already fetched at the top of the function

      const startTime = Date.now()
      const response = await fetch(`${API_BASE_URL}/api/mobile/enhance-base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })
      const responseTime = Date.now() - startTime

      console.log('Base64 response received:', {
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        headers: {
          'content-type': response.headers.get('content-type'),
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Base64 method failed:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
        })

        // Check for insufficient credits
        if (response.status === 402) {
          console.log('💰 Insufficient credits detected')
          throw new InsufficientCreditsError('You need more credits to enhance photos')
        }

        try {
          const errorData = JSON.parse(errorText)
          console.error('Parsed error:', errorData)
          throw new Error(errorData.detail || `Failed to start enhancement: ${response.status}`)
        } catch (e: unknown) {
          const err = e instanceof Error ? e : new Error(String(e))
          if (err.message.includes('Failed to start enhancement')) {
            throw err
          }
          console.error('Could not parse error response as JSON')
          throw new Error(`Failed to start enhancement: ${response.status} - ${errorText}`)
        }
      }

      const data = await response.json()
      console.log('✅ Base64 method successful:', data)
      return data
    } catch (error) {
      console.error('Enhancement error:', error)
      throw error
    }
  }

  /**
   * Poll job status until completion
   */
  async pollJobStatus(
    jobId: string, 
    onProgress?: (status: string) => void,
    maxAttempts: number = 150,  // Increased to 5 minutes
    intervalMs: number = 2000
  ): Promise<JobStatusResponse> {
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const status = await this.getJobStatus(jobId)
        
        if (onProgress) {
          onProgress(status.status)
        }

        if (status.status === 'succeeded' || status.status === 'failed') {
          return status
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, intervalMs))
        attempts++
      } catch (error) {
        console.error('Polling error:', error)
        attempts++
        await new Promise(resolve => setTimeout(resolve, intervalMs))
      }
    }

    throw new Error('Enhancement timeout - job took too long to complete')
  }

  /**
   * Get current job status (uses retry for transient network errors)
   */
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    // Use the api client which has built-in retry for GET requests
    return api.get<JobStatusResponse>(`/api/mobile/enhance/${jobId}/status`)
  }

  /**
   * Get available enhancement styles (uses retry for transient network errors)
   */
  async getAvailableStyles(): Promise<StyleInfo[]> {
    try {
      const data = await api.get<{ styles: StyleInfo[] }>('/api/mobile/styles')
      return data.styles
    } catch (error) {
      console.error('Failed to get styles:', error)
      // Return default styles as fallback
      return [
        {
          id: 'luster',
          name: 'Luster',
          description: 'Luster AI signature style - luxury editorial real estate photography'
        },
        {
          id: 'flambient',
          name: 'Flambient',
          description: 'Bright, airy interior with crisp whites and flambient lighting'
        }
      ]
    }
  }

  /**
   * Process multiple images with the same style
   */
  async enhanceMultipleImages(
    imageUrls: string[], 
    style: 'luster' | 'flambient',
    onProgress?: (completed: number, total: number, currentStatus: string) => void
  ): Promise<string[]> {
    const enhancedUrls: string[] = []
    const total = imageUrls.length

    // Start all jobs in parallel (use allSettled so one failure doesn't stop all)
    const jobResults = await Promise.allSettled(
      imageUrls.map(url => this.enhanceImage({ imageUrl: url, style }))
    )

    // Extract successful job IDs, track failed indices
    const jobIds: (string | null)[] = jobResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value.job_id
      } else {
        console.error(`Failed to create job for image ${index}:`, result.reason)
        return null
      }
    })

    // Poll all jobs for completion
    for (let i = 0; i < jobIds.length; i++) {
      const jobId = jobIds[i]

      // Skip jobs that failed to create
      if (jobId === null) {
        enhancedUrls.push('') // Push empty string for failed jobs
        if (onProgress) {
          onProgress(i + 1, total, 'failed')
        }
        continue
      }

      try {
        const result = await this.pollJobStatus(
          jobId,
          (status) => {
            if (onProgress) {
              onProgress(i, total, status)
            }
          }
        )

        if (result.status === 'succeeded' && result.enhanced_image_url) {
          // Convert relative URL to absolute URL
          const fullUrl = result.enhanced_image_url.startsWith('http')
            ? result.enhanced_image_url
            : `${API_BASE_URL}${result.enhanced_image_url}`
          console.log(`Enhanced image URL for job ${jobId}: ${fullUrl}`)
          enhancedUrls.push(fullUrl)
        } else {
          console.error(`Job ${jobId} failed:`, result.error)
          enhancedUrls.push('') // Push empty string for failed jobs
        }

        if (onProgress) {
          onProgress(i + 1, total, 'completed')
        }
      } catch (error) {
        console.error(`Failed to process image ${i}:`, error)
        enhancedUrls.push('') // Push empty string for failed jobs
      }
    }

    return enhancedUrls
  }

  /**
   * Cache enhancement result
   */
  async cacheEnhancementResult(originalUrl: string, enhancedUrl: string, style: string): Promise<void> {
    try {
      const key = `enhancement_${originalUrl}_${style}`
      const value = {
        enhancedUrl,
        timestamp: Date.now(),
        style
      }
      await AsyncStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to cache enhancement:', error)
    }
  }

  /**
   * Get cached enhancement if available
   */
  async getCachedEnhancement(originalUrl: string, style: string): Promise<string | null> {
    try {
      const key = `enhancement_${originalUrl}_${style}`
      const cached = await AsyncStorage.getItem(key)
      
      if (cached) {
        const data = JSON.parse(cached)
        // Check if cache is less than 24 hours old
        if (Date.now() - data.timestamp < 86400000) {
          return data.enhancedUrl
        }
      }
    } catch (error) {
      console.error('Failed to get cached enhancement:', error)
    }
    
    return null
  }

  /**
   * Get user credit balance (uses retry for transient network errors)
   */
  async getCreditBalance(): Promise<number> {
    try {
      const data = await api.get<CreditBalanceResponse>('/api/mobile/credits')
      return data.balance
    } catch (error) {
      console.error('Error fetching credit balance:', error)
      throw error
    }
  }
}

export default new EnhancementService()
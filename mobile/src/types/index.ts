/**
 * Shared types for the Luster mobile app
 * Single source of truth for type definitions
 */

// =============================================================================
// Enhancement Styles
// =============================================================================

/**
 * Valid enhancement styles supported by the backend
 */
export type EnhancementStyle = 'luster' | 'flambient'

/**
 * Type guard to validate enhancement style
 */
export function isValidStyle(style: unknown): style is EnhancementStyle {
  return style === 'luster' || style === 'flambient'
}

// =============================================================================
// Image Types
// =============================================================================

/**
 * Image source types for React Native
 * - number: Local asset from require('./image.png')
 * - ImageURISource: Remote URL or base64 data URI
 */
export interface ImageURISource {
  uri: string
  width?: number
  height?: number
  scale?: number
  headers?: Record<string, string>
  cache?: 'default' | 'reload' | 'force-cache' | 'only-if-cached'
}

export type ImageSource = number | ImageURISource

/**
 * Photo object used throughout the app
 */
export interface Photo {
  uri: string
  width?: number
  height?: number
  type?: string // MIME type like 'image/jpeg'
  fileName?: string
}

/**
 * Photo can be either a Photo object or a URI string
 */
export type PhotoInput = Photo | string

/**
 * Extract URI from a photo (handles both Photo objects and string URIs)
 */
export function getPhotoUri(photo: PhotoInput): string {
  return typeof photo === 'string' ? photo : photo.uri
}

// =============================================================================
// Property/Listing Types
// =============================================================================

export type PropertyStatus = 'processing' | 'ready' | 'completed' | 'failed'

export interface PropertyListing {
  id: string
  backendShootId?: string
  address: string
  price: string
  beds: number
  baths: number
  image: ImageSource
  images?: ImageSource[]
  originalImages?: ImageSource[]
  isEnhanced?: boolean
  status: PropertyStatus
  error?: string
  createdAt: Date
}

// =============================================================================
// Navigation Params
// =============================================================================

/**
 * Type-safe navigation parameters for all screens
 */
export type RootStackParamList = {
  // Auth screens
  Welcome: undefined
  Auth: undefined
  Login: undefined

  // Main app
  Main: undefined

  // Photo flow
  NewListing: undefined
  StyleSelection: {
    photos?: Photo[]
  }
  Confirmation: {
    style: EnhancementStyle
    photoCount: number
  }
  Processing: {
    propertyId?: string
    style?: EnhancementStyle
    photos?: Photo[] | string[]  // Can be Photo objects or URI strings
    photoCount?: number
    creditPerPhoto?: number  // Credit cost per photo (for flexible pricing)
  }
  Result: {
    propertyId?: string
    enhancedPhotos?: string[]
    originalPhotos?: Photo[] | string[]  // Can be Photo objects or URI strings
  }

  // Property screens
  Project: {
    property?: PropertyListing
  }
  AllProperties: undefined

  // Settings
  Credits: undefined
  PrivacySecurity: undefined
  AccountSettings: undefined
}

// =============================================================================
// API Response Types
// =============================================================================

export interface EnhanceResponse {
  job_id: string
  shoot_id: string
  asset_id: string
  project_name: string
  status: 'queued' | 'processing' | 'succeeded' | 'failed'
  message?: string
}

export interface JobStatusResponse {
  status: 'queued' | 'processing' | 'succeeded' | 'failed'
  enhanced_image_url?: string
  error?: string
  progress?: number
}

export interface CreditBalanceResponse {
  balance: number
}

export interface StyleInfo {
  id: EnhancementStyle
  name: string
  description: string
  preview_url?: string
}

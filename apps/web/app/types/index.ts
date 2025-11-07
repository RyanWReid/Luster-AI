export type User = {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export type Credit = {
  id: string
  user_id: string
  balance: number
  created_at: string
  updated_at: string
}

export type Shoot = {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
  asset_count?: number
  job_statuses?: {
    queued: number
    processing: number
    succeeded: number
    failed: number
  }
  status?: 'draft' | 'in_progress' | 'completed' | 'failed'
}

export type Asset = {
  id: string
  shoot_id: string
  user_id: string
  original_filename: string
  file_path: string
  file_size: number
  mime_type: string
  created_at: string
  updated_at: string
  jobs: Job[]
  upload_url?: string
  thumb_url?: string
}

export type JobStatus = 'queued' | 'processing' | 'succeeded' | 'failed'

export type Job = {
  id: string
  asset_id: string
  user_id: string
  prompt: string
  status: JobStatus
  output_path?: string
  output_url?: string
  error_message?: string
  credits_used: number
  created_at: string
  updated_at: string
  started_at?: string
  completed_at?: string
}

export type JobEvent = {
  id: string
  job_id: string
  event_type: string
  details?: Record<string, any>
  created_at: string
}

// UI-specific types
export type UploadProgress = {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
  asset_id?: string
}

export type StylePreset = {
  id: string
  name: string
  description: string
  prompt: string
  preview_image: string
  category: 'interior' | 'exterior' | 'staging' | 'enhancement'
  tags: string[]
}

// Enhanced Project types for new structure
export type Project = {
  id: string
  user_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  assets: ProjectAsset[]
  share_link?: string
  is_shared: boolean
  asset_count: number
  status?: 'draft' | 'in_progress' | 'completed' | 'failed'
  job_statuses?: {
    queued: number
    processing: number
    succeeded: number
    failed: number
  }
}

export type ProjectAsset = {
  id: string
  project_id: string
  asset_id: string
  position: number
  added_at: string
  asset: Asset
}

// Enhancement Flow types
export type EnhancementSession = {
  id: string
  user_id: string
  project_name?: string
  selected_photos: SelectedPhoto[]
  style_preset?: StylePreset
  status: 'selecting_photos' | 'selecting_style' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export type SelectedPhoto = {
  id: string
  file: File
  preview_url: string
  uploaded: boolean
  asset_id?: string
  position: number
}

export type EnhancementStep = 'photo_selection' | 'style_selection' | 'processing' | 'results'

// User Profile types for Settings
export type UserProfile = {
  id: string
  user_id: string
  full_name?: string
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type UserPlan = {
  id: string
  user_id: string
  plan_type: 'free' | 'pro' | 'enterprise'
  credits_included: number
  price_monthly?: number
  features: string[]
  active: boolean
  expires_at?: string
  created_at: string
}

export type ReferralCode = {
  id: string
  user_id: string
  code: string
  credits_reward: number
  uses_count: number
  max_uses: number
  active: boolean
  created_at: string
  expires_at?: string
}

// Share link types
export type ShareLink = {
  id: string
  project_id: string
  token: string
  expires_at?: string
  password_protected: boolean
  view_count: number
  created_at: string
}

// Google Drive integration types
export type DriveIntegration = {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  folder_id?: string
  auto_sync: boolean
  created_at: string
  updated_at: string
}

export type ProjectFilter = {
  status?: JobStatus[]
  date_range?: {
    start: Date
    end: Date
  }
  search?: string
}

export type NotificationLevel = 'info' | 'success' | 'warning' | 'error'

export type Notification = {
  id: string
  title: string
  message: string
  level: NotificationLevel
  created_at: Date
  read: boolean
  action?: {
    label: string
    href: string
  }
}

// API Response types
export type ApiResponse<T = any> = {
  data: T
  error?: string
  message?: string
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

// Form types
export type ContactForm = {
  name: string
  email: string
  subject: string
  message: string
}

export type FeedbackForm = {
  type: 'bug' | 'feature' | 'general'
  title: string
  description: string
  rating?: number
}

// Onboarding types
export type OnboardingStep = {
  id: string
  title: string
  description: string
  image: string
  cta: string
  features?: string[]
}

export type OnboardingScreen = {
  id: string
  title: string
  subtitle: string
  description: string
  image: string
  features: string[]
  cta_text: string
}

// Navigation types
export type NavItem = {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
}

// Mobile-specific types
export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

export type TouchGesture = {
  startX: number
  startY: number
  currentX: number
  currentY: number
  direction?: SwipeDirection
  distance: number
}

// Component prop types
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

export type CardVariant = 'default' | 'elevated' | 'interactive'

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral'

// State management types
export type AppState = {
  user: User | null
  credits: Credit | null
  currentShoot: Shoot | null
  uploads: UploadProgress[]
  notifications: Notification[]
}

// Hook return types
export type UseApiReturn<T> = {
  data: T | null
  error: string | null
  loading: boolean
  mutate: () => void
}

export type UseUploadReturn = {
  uploads: UploadProgress[]
  uploadFiles: (files: File[], shootId: string) => Promise<void>
  removeUpload: (index: number) => void
  clearCompleted: () => void
}

// Error types
export type ApiError = {
  message: string
  code?: string | number
  details?: Record<string, any>
}
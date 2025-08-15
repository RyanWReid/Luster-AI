'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DesktopLayout } from '@/app/components/features/desktop-layout'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { ToastProvider, useErrorToast, useSuccessToast } from '@/app/components/ui/toast'
import {
  Share2,
  Download,
  Edit3,
  Check,
  X,
  FolderOpen,
  ExternalLink,
  Copy,
  Star,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'
import type { StylePreset, Asset, Job, Shoot } from '@/app/types'
import { shootsApi, getFileUrl } from '@/app/lib/api'

interface EnhancedImage {
  id: string
  original_url: string
  enhanced_url: string
  filename: string
  processing_time: number
}

interface ResultsScreenProps {}

function ResultsScreen({}: ResultsScreenProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<any[]>([])
  const [selectedStyle, setSelectedStyle] = useState<StylePreset | null>(null)
  const [enhancedImages, setEnhancedImages] = useState<EnhancedImage[]>([])
  const [projectName, setProjectName] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [isShared, setIsShared] = useState(false)
  const [viewMode, setViewMode] = useState<'enhanced' | 'comparison'>('enhanced')
  const [jobs, setJobs] = useState<Job[]>([])
  const [shoot, setShoot] = useState<Shoot | null>(null)
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()
  const errorToast = useErrorToast()
  const successToast = useSuccessToast()

  // Mock enhanced images data
  const mockEnhancedImages: EnhancedImage[] = [
    {
      id: '1',
      original_url: '/demo/original1.jpg',
      enhanced_url: '/demo/enhanced1.jpg',
      filename: 'living-room.jpg',
      processing_time: 45
    },
    {
      id: '2',
      original_url: '/demo/original2.jpg', 
      enhanced_url: '/demo/enhanced2.jpg',
      filename: 'kitchen.jpg',
      processing_time: 52
    },
    {
      id: '3',
      original_url: '/demo/original3.jpg',
      enhanced_url: '/demo/enhanced3.jpg', 
      filename: 'exterior.jpg',
      processing_time: 38
    }
  ]

  useEffect(() => {
    loadResultsData()
  }, [router, errorToast])

  const loadResultsData = async () => {
    try {
      setLoading(true)
      
      // Load completed jobs and shoot data from session storage
      const completedJobsData = sessionStorage.getItem('enhancement-completed-jobs')
      const shootData = sessionStorage.getItem('enhancement-shoot')
      const settingsData = sessionStorage.getItem('enhancement-settings')
      
      if (!completedJobsData || !shootData || !settingsData) {
        errorToast('Missing enhancement results data')
        router.push('/enhance')
        return
      }

      const completedJobs: Job[] = JSON.parse(completedJobsData)
      const shootInfo: Shoot = JSON.parse(shootData)
      const settings = JSON.parse(settingsData)
      
      setJobs(completedJobs)
      setShoot(shootInfo)
      setSelectedStyle(settings.style)
      
      // Generate default project name
      const defaultName = `${settings.style.name} - ${new Date().toLocaleDateString()}`
      setProjectName(defaultName)
      setTempName(defaultName)
      
      // Get enhanced images from completed jobs
      const images: EnhancedImage[] = completedJobs.map((job, index) => {
        const enhancedUrl = job.output_url ? getFileUrl(job.output_url) : ''
        console.log(`Job ${job.id}: output_url=${job.output_url}, enhanced_url=${enhancedUrl}`)
        
        return {
          id: job.id,
          original_url: job.asset_id, // We'll need to resolve this to actual asset URL
          enhanced_url: enhancedUrl,
          filename: `enhanced-${index + 1}.jpg`,
          processing_time: job.completed_at && job.started_at 
            ? Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000)
            : 0
        }
      })
      
      setEnhancedImages(images)
      
      // Load original photos count for display
      const photosData = sessionStorage.getItem('enhancement-photos')
      if (photosData) {
        const photos = JSON.parse(photosData)
        setSelectedPhotos(photos)
      }
      
    } catch (error) {
      console.error('Error loading results data:', error)
      errorToast('Failed to load enhancement results')
      router.push('/enhance')
    } finally {
      setLoading(false)
    }
  }

  const handleEditName = () => {
    setIsEditingName(true)
    setTempName(projectName)
  }

  const handleSaveName = () => {
    if (tempName.trim()) {
      setProjectName(tempName.trim())
      setIsEditingName(false)
      successToast('Project name updated')
    } else {
      errorToast('Project name cannot be empty')
    }
  }

  const handleCancelEdit = () => {
    setIsEditingName(false)
    setTempName(projectName)
  }

  const handleShare = async () => {
    setIsSharing(true)
    
    try {
      // Simulate creating a share link
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newShareLink = `https://luster.ai/share/${Math.random().toString(36).substring(7)}`
      setShareLink(newShareLink)
      setIsShared(true)
      
      successToast('Share link created!')
    } catch (error) {
      console.error('Error creating share link:', error)
      errorToast('Failed to create share link')
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareLink) return
    
    try {
      await navigator.clipboard.writeText(shareLink)
      successToast('Share link copied!')
    } catch (error) {
      console.error('Error copying link:', error)
      errorToast('Failed to copy link')
    }
  }

  const handleDownload = async (imageId: string) => {
    const image = enhancedImages.find(img => img.id === imageId)
    if (!image || !image.enhanced_url) return

    try {
      // Create download link and trigger download
      const link = document.createElement('a')
      link.href = image.enhanced_url
      link.download = image.filename
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      successToast(`Downloading ${image.filename}...`)
    } catch (error) {
      console.error('Error downloading image:', error)
      errorToast('Failed to download image')
    }
  }

  const handleDownloadAll = async () => {
    try {
      // Download each enhanced image
      for (const image of enhancedImages) {
        if (image.enhanced_url) {
          const link = document.createElement('a')
          link.href = image.enhanced_url
          link.download = image.filename
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      successToast(`Downloading all ${enhancedImages.length} images...`)
    } catch (error) {
      console.error('Error downloading images:', error)
      errorToast('Failed to download images')
    }
  }

  const handleSaveToProject = () => {
    // Clear session storage since we're done with the enhancement flow
    sessionStorage.removeItem('enhancement-photos')
    sessionStorage.removeItem('enhancement-settings')
    sessionStorage.removeItem('enhancement-completed-jobs')
    sessionStorage.removeItem('enhancement-shoot')
    
    successToast('Project saved!')
    router.push('/projects')
  }

  const handleNewEnhancement = () => {
    // Clear session storage and start fresh
    sessionStorage.removeItem('enhancement-photos')
    sessionStorage.removeItem('enhancement-settings')
    sessionStorage.removeItem('enhancement-completed-jobs')
    sessionStorage.removeItem('enhancement-shoot')
    
    router.push('/enhance')
  }

  if (loading) {
    return (
      <DesktopLayout title="Enhancement Results">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-neutral-600">Loading results...</p>
          </div>
        </div>
      </DesktopLayout>
    )
  }

  return (
    <DesktopLayout title="Enhancement Results">
      <div className="flex-1 flex flex-col">
        {/* Project Header */}
        <div className="p-4 bg-white border-b border-neutral-200">
          <div className="space-y-3">
            {/* Project Name */}
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName()
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                  />
                  <Button
                    onClick={handleSaveName}
                    variant="primary"
                    leftIcon={<Check className="h-4 w-4" />}
                  >
                    Save
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="ghost"
                    leftIcon={<X className="h-4 w-4" />}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <h1 className="text-lg font-semibold text-neutral-900">
                      {projectName}
                    </h1>
                    {selectedStyle && (
                      <p className="text-sm text-neutral-600">
                        Enhanced with {selectedStyle.name}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleEditName}
                    variant="ghost"
                    leftIcon={<Edit3 className="h-4 w-4" />}
                  >
                    Edit
                  </Button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-neutral-600">
                <Star className="h-4 w-4" />
                <span>{enhancedImages.length} enhanced</span>
              </div>
              <Badge variant="success">
                Complete
              </Badge>
              {isShared && (
                <Badge variant="primary">
                  Shared
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('enhanced')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'enhanced'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Eye className="h-4 w-4" />
              Enhanced
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'comparison'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <EyeOff className="h-4 w-4" />
              Compare
            </button>
          </div>
        </div>

        {/* Images Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            {enhancedImages.map((image, index) => (
              <Card key={image.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {viewMode === 'enhanced' ? (
                    <div className="space-y-3">
                      <div className="aspect-video relative">
                        {/* Enhanced image */}
                        {image.enhanced_url ? (
                          <img
                            src={image.enhanced_url}
                            alt={`Enhanced ${image.filename}`}
                            className="w-full h-full object-cover rounded-lg"
                            onLoad={() => {
                              console.log(`Successfully loaded image: ${image.enhanced_url}`)
                            }}
                            onError={(e) => {
                              console.error(`Failed to load image: ${image.enhanced_url}`)
                              // Fallback to placeholder on image load error
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center rounded-lg ${image.enhanced_url ? 'hidden' : ''}`}>
                          <div className="text-center space-y-2">
                            <Star className="h-8 w-8 text-primary-600 mx-auto" />
                            <p className="text-sm text-primary-700 font-medium">
                              Enhanced Image {index + 1}
                            </p>
                          </div>
                        </div>
                        
                        {/* Action Overlay */}
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            onClick={() => handleDownload(image.id)}
                            className="w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-lg flex items-center justify-center transition-colors"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-neutral-900 text-sm">
                              {image.filename}
                            </h3>
                            <p className="text-xs text-neutral-600">
                              Processed in {image.processing_time}s
                            </p>
                          </div>
                          <Badge variant="success">
                            Enhanced
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      {/* Original */}
                      <div className="space-y-2">
                        <div className="aspect-square bg-neutral-200 flex items-center justify-center relative">
                          {image.original_url && image.original_url !== image.id ? (
                            <img
                              src={image.original_url}
                              alt="Original"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center">
                              <p className="text-xs text-neutral-600 font-medium">Original</p>
                            </div>
                          )}
                          <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            Original
                          </div>
                        </div>
                      </div>
                      {/* Enhanced */}
                      <div className="space-y-2">
                        <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center relative">
                          {image.enhanced_url ? (
                            <img
                              src={image.enhanced_url}
                              alt="Enhanced"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="text-center">
                              <Star className="h-6 w-6 text-primary-600 mx-auto" />
                              <p className="text-xs text-primary-700 font-medium">Enhanced</p>
                            </div>
                          )}
                          <div className="absolute bottom-1 left-1 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                            Enhanced
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Share Section */}
        {isShared && shareLink && (
          <div className="p-4 bg-primary-50 border-t border-primary-200">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-900">
                  Project Shared
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  value={shareLink}
                  readOnly
                  className="flex-1 text-xs"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="primary"
                  size="sm"
                  leftIcon={<Copy className="h-4 w-4" />}
                >
                  Copy
                </Button>
              </div>
              
              <p className="text-xs text-primary-700">
                Anyone with this link can view your enhanced photos
              </p>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="p-4 border-t border-neutral-200 safe-area-padding-bottom space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleDownloadAll}
              variant="secondary"
              size="lg"
              leftIcon={<Download className="h-5 w-5" />}
            >
              Download All
            </Button>
            
            <Button
              onClick={isShared ? handleCopyLink : handleShare}
              variant="primary"
              size="lg"
              loading={isSharing}
              leftIcon={isShared ? <Copy className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            >
              {isShared ? 'Copy Link' : 'Share Project'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleSaveToProject}
              variant="secondary"
              size="lg"
              leftIcon={<FolderOpen className="h-5 w-5" />}
            >
              Save to Projects
            </Button>
            
            <Button
              onClick={handleNewEnhancement}
              variant="ghost"
              size="lg"
              leftIcon={<RefreshCw className="h-5 w-5" />}
            >
              New Enhancement
            </Button>
          </div>
        </div>
      </div>
    </DesktopLayout>
  )
}

export default function ResultsPage() {
  return (
    <ToastProvider>
      <ResultsScreen />
    </ToastProvider>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DesktopLayout } from '@/app/components/features/desktop-layout'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { Progress } from '@/app/components/ui/progress'
import { ToastProvider, useErrorToast } from '@/app/components/ui/toast'
import {
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  X
} from 'lucide-react'
import type { StylePreset, Job, Shoot, Asset, UserPlan } from '@/app/types'
import { shootsApi, assetsApi, jobsApi, isInsufficientCreditsError, getErrorMessage } from '@/app/lib/api'
import { useJobsPolling } from '@/app/hooks/use-job-polling'

interface ProcessingState {
  stage: 'ready' | 'uploading' | 'processing' | 'completed' | 'failed'
  currentPhoto: number
  totalPhotos: number
  message: string
  progress: number
  error?: string
}

interface ProcessingScreenProps {}

function ProcessingScreen({}: ProcessingScreenProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
  const [selectedStyle, setSelectedStyle] = useState<StylePreset | null>(null)
  const [selectedTier, setSelectedTier] = useState<'free' | 'premium'>('premium')
  const [processingState, setProcessingState] = useState<ProcessingState>({
    stage: 'ready',
    currentPhoto: 0,
    totalPhotos: 0,
    message: 'Ready to enhance your photos',
    progress: 0
  })
  const [jobs, setJobs] = useState<Job[]>([])
  const [projectName, setProjectName] = useState('')
  const [shoot, setShoot] = useState<Shoot | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [completedJobs, setCompletedJobs] = useState<Job[]>([])
  const [hasStarted, setHasStarted] = useState(false)
  
  const router = useRouter()
  const errorToast = useErrorToast()

  useEffect(() => {
    // Load data from previous steps
    const photosMetadata = sessionStorage.getItem('enhancement-photos-metadata')
    const settingsData = sessionStorage.getItem('enhancement-settings')
    
    if (!photosMetadata || !settingsData) {
      errorToast('Missing enhancement data')
      router.push('/enhance')
      return
    }

    try {
      const photoMetadataList = JSON.parse(photosMetadata)
      const settings = JSON.parse(settingsData)
      
      // Get the actual File objects from the global variable
      const actualFiles = (window as any).enhancementFiles
      if (!actualFiles || actualFiles.length === 0) {
        errorToast('Photo files not found. Please go back and select photos again.')
        router.push('/enhance')
        return
      }
      
      console.log('Found actual files:', actualFiles.map((f: File) => ({ name: f.name, size: f.size })))
      setSelectedPhotos(actualFiles)
      setSelectedStyle(settings.style)
      setSelectedTier(settings.tier)
      setProcessingState(prev => ({
        ...prev,
        totalPhotos: actualFiles.length
      }))
      
      // Generate default project name
      const defaultName = `${settings.style.name} - ${new Date().toLocaleDateString()}`
      setProjectName(defaultName)
      
      // Don't start automatically - wait for user to click start button
    } catch (error) {
      console.error('Error loading enhancement data:', error)
      errorToast('Failed to load enhancement data')
      router.push('/enhance')
    }
  }, []) // Remove router and errorToast from dependencies to prevent re-runs

  const startProcessing = async (photos: File[], style: StylePreset, tier: 'free' | 'premium') => {
    if (hasStarted) return // Prevent multiple starts
    setHasStarted(true)
    
    console.log('Starting processing with:', { 
      photosCount: photos.length, 
      style: style.name, 
      tier,
      projectName 
    })
    
    try {
      // Phase 1: Create shoot
      setProcessingState({
        stage: 'uploading',
        currentPhoto: 0,
        totalPhotos: photos.length,
        message: 'Creating project...',
        progress: 5
      })

      const newShoot = await shootsApi.create(projectName)
      setShoot(newShoot)

      // Phase 2: Upload photos
      setProcessingState(prev => ({
        ...prev,
        message: 'Uploading photos...',
        progress: 10
      }))

      const uploadedAssets: Asset[] = []
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        
        setProcessingState(prev => ({
          ...prev,
          currentPhoto: i + 1,
          message: `Uploading photo ${i + 1} of ${photos.length}...`,
          progress: 10 + (i / photos.length) * 30
        }))

        try {
          const asset = await assetsApi.upload(newShoot.id, photo)
          uploadedAssets.push(asset)
        } catch (error) {
          console.error(`Failed to upload photo ${i + 1}:`, error)
          throw new Error(`Failed to upload ${photo.name}`)
        }
      }

      setAssets(uploadedAssets)

      // Phase 3: Create enhancement jobs
      setProcessingState({
        stage: 'processing',
        currentPhoto: 0,
        totalPhotos: photos.length,
        message: 'Starting enhancement...',
        progress: 40
      })

      const createdJobs: Job[] = []
      for (let i = 0; i < uploadedAssets.length; i++) {
        const asset = uploadedAssets[i]
        
        setProcessingState(prev => ({
          ...prev,
          currentPhoto: i + 1,
          message: `Creating enhancement job ${i + 1} of ${uploadedAssets.length}...`,
          progress: 40 + (i / uploadedAssets.length) * 10
        }))

        try {
          const job = await jobsApi.createEnhanced(asset.id, style.prompt, tier)
          createdJobs.push(job)
        } catch (error) {
          console.error(`Failed to create job for asset ${asset.id}:`, error)
          throw new Error(`Failed to start enhancement for ${asset.original_filename}`)
        }
      }

      setJobs(createdJobs)

      // Phase 4: Monitor job progress
      setProcessingState(prev => ({
        ...prev,
        message: `Enhancing with ${style.name} (${tier === 'free' ? 'Standard' : 'Premium'} quality)...`,
        progress: 50
      }))

      // Store jobs in session for polling
      sessionStorage.setItem('enhancement-jobs', JSON.stringify(createdJobs.map(j => j.id)))
      sessionStorage.setItem('enhancement-shoot', JSON.stringify(newShoot))

    } catch (error) {
      console.error('Processing error:', error)
      console.error('Error details:', { 
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      
      let errorMessage = getErrorMessage(error)
      
      // Handle specific error types
      if (isInsufficientCreditsError(error)) {
        errorMessage = 'Insufficient credits. Please purchase more credits to continue.'
      }
      
      console.log('Setting failed state with message:', errorMessage)
      setProcessingState({
        stage: 'failed',
        currentPhoto: 0,
        totalPhotos: photos.length,
        message: errorMessage,
        progress: 0,
        error: errorMessage
      })
    }
  }

  // Job polling hook for multiple jobs
  const { jobs: polledJobs } = useJobsPolling(shoot?.id || null, {
    enabled: jobs.length > 0 && processingState.stage === 'processing',
    onStatusChange: (job) => {
      console.log(`Job ${job.id} status changed to ${job.status}`)
    },
    onComplete: (job) => {
      setCompletedJobs(prev => {
        const updated = [...prev, job]
        
        // Update progress based on completed jobs
        const progressPercent = 50 + (updated.length / jobs.length) * 40
        setProcessingState(prevState => ({
          ...prevState,
          progress: progressPercent,
          currentPhoto: updated.length,
          message: updated.length === jobs.length 
            ? 'Enhancement complete!' 
            : `Enhanced ${updated.length} of ${jobs.length} photos...`
        }))
        
        // Check if all jobs are complete
        if (updated.length === jobs.length) {
          setProcessingState(prevState => ({
            ...prevState,
            stage: 'completed',
            progress: 100,
            message: 'All photos enhanced successfully!'
          }))
          
          // Store completed jobs for results page
          sessionStorage.setItem('enhancement-completed-jobs', JSON.stringify(updated))
          
          // Auto-redirect to results after a short delay
          setTimeout(() => {
            router.push('/enhance/results')
          }, 2000)
        }
        
        return updated
      })
    },
    onError: (job) => {
      console.error(`Job ${job.id} failed:`, job.error_message)
      setProcessingState({
        stage: 'failed',
        currentPhoto: 0,
        totalPhotos: jobs.length,
        message: `Enhancement failed: ${job.error_message || 'Unknown error'}`,
        progress: 0,
        error: job.error_message
      })
    }
  })

  const handleCancel = async () => {
    // Cancel any running jobs
    if (jobs.length > 0) {
      try {
        await Promise.all(
          jobs
            .filter(job => job.status === 'queued' || job.status === 'processing')
            .map(job => jobsApi.cancel(job.id))
        )
      } catch (error) {
        console.error('Error cancelling jobs:', error)
      }
    }
    
    // Clear session storage
    sessionStorage.removeItem('enhancement-jobs')
    sessionStorage.removeItem('enhancement-shoot')
    
    router.push('/enhance')
  }

  const handleRetry = () => {
    if (selectedPhotos.length > 0 && selectedStyle) {
      // Reset state
      setHasStarted(false)
      setJobs([])
      setAssets([])
      setCompletedJobs([])
      setShoot(null)
      
      // Clear previous session data
      sessionStorage.removeItem('enhancement-jobs')
      sessionStorage.removeItem('enhancement-shoot')
      sessionStorage.removeItem('enhancement-completed-jobs')
      
      // Start fresh
      startProcessing(selectedPhotos, selectedStyle, selectedTier)
    }
  }

  const handleViewResults = () => {
    router.push('/enhance/results')
  }

  const getStageIcon = () => {
    switch (processingState.stage) {
      case 'uploading':
        return <Clock className="h-8 w-8 text-primary-600 animate-pulse" />
      case 'processing':
        return <Sparkles className="h-8 w-8 text-primary-600 animate-pulse" />
      case 'completed':
        return <CheckCircle className="h-8 w-8 text-success-600" />
      case 'failed':
        return <AlertCircle className="h-8 w-8 text-error-600" />
      default:
        return <Clock className="h-8 w-8 text-neutral-400" />
    }
  }

  const getStageColor = () => {
    switch (processingState.stage) {
      case 'uploading':
      case 'processing':
        return 'bg-primary-600'
      case 'completed':
        return 'bg-success-600'
      case 'failed':
        return 'bg-error-600'
      default:
        return 'bg-neutral-400'
    }
  }

  return (
    <DesktopLayout 
      title={
        processingState.stage === 'uploading' ? 'Uploading Photos' :
        processingState.stage === 'processing' ? 'Enhancing Photos' :
        processingState.stage === 'completed' ? 'Enhancement Complete!' :
        'Enhancement Failed'
      }
    >
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full space-y-8">
          {/* Status Icon */}
          <div className="text-center">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {getStageIcon()}
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              {processingState.stage === 'uploading' && 'Uploading Photos'}
              {processingState.stage === 'processing' && 'Enhancing Photos'}
              {processingState.stage === 'completed' && 'Enhancement Complete!'}
              {processingState.stage === 'failed' && 'Enhancement Failed'}
            </h1>
            <p className="text-neutral-600">
              {processingState.message}
            </p>
          </div>

          {/* Progress */}
          {(processingState.stage === 'uploading' || processingState.stage === 'processing') && (
            <div className="space-y-4">
              <Progress 
                value={processingState.progress} 
                className="w-full"
                variant={processingState.stage === 'uploading' ? 'warning' : 'default'}
              />
              
              <div className="flex items-center justify-between text-sm text-neutral-600">
                <span>
                  Photo {processingState.currentPhoto} of {processingState.totalPhotos}
                </span>
                <span>
                  {Math.round(processingState.progress)}%
                </span>
              </div>
            </div>
          )}

          {/* Project Info */}
          {selectedStyle && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="text-center">
                    <h3 className="font-medium text-neutral-900">
                      {projectName}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      Style: {selectedStyle.name}
                    </p>
                  </div>
                  
                  <div className="flex justify-center gap-4 text-sm text-neutral-600">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                      <span>{processingState.totalPhotos} photos</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {/* Start Processing Button - show when ready */}
            {processingState.stage === 'ready' && !hasStarted && (
              <Button
                onClick={() => startProcessing(selectedPhotos, selectedStyle!, selectedTier)}
                variant="primary"
                size="lg"
                className="w-full"
                rightIcon={<Sparkles className="h-5 w-5" />}
              >
                Start Processing
              </Button>
            )}

            {processingState.stage === 'completed' && (
              <Button
                onClick={handleViewResults}
                variant="primary"
                size="lg"
                className="w-full"
                rightIcon={<CheckCircle className="h-5 w-5" />}
              >
                View Results
              </Button>
            )}

            {processingState.stage === 'failed' && (
              <>
                {processingState.error?.includes('Insufficient credits') ? (
                  <Button
                    onClick={() => router.push('/settings')}
                    variant="primary"
                    size="lg"
                    className="w-full"
                  >
                    Purchase Credits
                  </Button>
                ) : (
                  <Button
                    onClick={handleRetry}
                    variant="primary"
                    size="lg"
                    className="w-full"
                    leftIcon={<Sparkles className="h-5 w-5" />}
                  >
                    Try Again
                  </Button>
                )}
                <Button
                  onClick={() => router.push('/enhance')}
                  variant="ghost"
                  size="lg"
                  className="w-full"
                >
                  Start Over
                </Button>
              </>
            )}

            {(processingState.stage === 'uploading' || processingState.stage === 'processing') && (
              <div className="text-center space-y-2">
                <p className="text-xs text-neutral-500">
                  This may take a few minutes depending on photo size and complexity
                </p>
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  size="sm"
                >
                  Cancel Enhancement
                </Button>
              </div>
            )}
          </div>

          {/* Tips during processing */}
          {(processingState.stage === 'uploading' || processingState.stage === 'processing') && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-neutral-900">
                    💡 Pro Tips
                  </h4>
                  <ul className="text-xs text-neutral-600 space-y-1">
                    <li>• Keep the app open for best results</li>
                    <li>• Higher resolution photos take longer to process</li>
                    <li>• You'll be notified when enhancement is complete</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DesktopLayout>
  )
}

export default function ProcessingPage() {
  return (
    <ToastProvider>
      <ProcessingScreen />
    </ToastProvider>
  )
}
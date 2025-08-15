'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DesktopLayout } from '@/app/components/features/desktop-layout'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { ToastProvider, useErrorToast, useSuccessToast } from '@/app/components/ui/toast'
import {
  Camera,
  Plus,
  X,
  Image,
  Upload,
  Sparkles,
  ArrowRight,
  RotateCcw
} from 'lucide-react'
import type { SelectedPhoto } from '@/app/types'

interface PhotoSelectionProps {}

function PhotoSelection({}: PhotoSelectionProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([])
  const [dragOver, setDragOver] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const errorToast = useErrorToast()
  const successToast = useSuccessToast()

  const maxPhotos = 5

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return

    const remainingSlots = maxPhotos - selectedPhotos.length
    if (remainingSlots <= 0) {
      errorToast(`Maximum ${maxPhotos} photos allowed`)
      return
    }

    const filesToAdd = Array.from(files).slice(0, remainingSlots)
    
    // Validate file types and sizes
    const validFiles = filesToAdd.filter(file => {
      if (!file.type.startsWith('image/')) {
        errorToast(`${file.name} is not a valid image file`)
        return false
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        errorToast(`${file.name} is too large (max 10MB)`)
        return false
      }
      
      return true
    })

    // Create preview URLs and add to selected photos
    const newPhotos: SelectedPhoto[] = await Promise.all(
      validFiles.map(async (file, index) => {
        const preview_url = URL.createObjectURL(file)
        
        return {
          id: `temp_${Date.now()}_${index}`,
          file,
          preview_url,
          uploaded: false,
          position: selectedPhotos.length + index
        }
      })
    )

    setSelectedPhotos(prev => [...prev, ...newPhotos])
    
    if (newPhotos.length > 0) {
      successToast(`Added ${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''}`)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removePhoto = (photoId: string) => {
    setSelectedPhotos(prev => {
      const photo = prev.find(p => p.id === photoId)
      if (photo) {
        URL.revokeObjectURL(photo.preview_url)
      }
      return prev.filter(p => p.id !== photoId)
    })
  }

  const reorderPhoto = (photoId: string, newPosition: number) => {
    setSelectedPhotos(prev => {
      const photo = prev.find(p => p.id === photoId)
      if (!photo) return prev
      
      const filtered = prev.filter(p => p.id !== photoId)
      filtered.splice(newPosition, 0, { ...photo, position: newPosition })
      
      return filtered.map((p, index) => ({ ...p, position: index }))
    })
  }

  const handleContinue = () => {
    if (selectedPhotos.length === 0) {
      errorToast('Please select at least one photo')
      return
    }

    console.log('Selected photos:', selectedPhotos.map(p => ({ 
      id: p.id, 
      name: p.file.name, 
      size: p.file.size,
      type: p.file.type 
    })))

    // Store photos metadata in session storage for the next step
    // Note: We can't serialize File objects, so we'll store metadata only
    const photoMetadata = selectedPhotos.map(p => ({
      id: p.id,
      name: p.file.name,
      size: p.file.size,
      type: p.file.type,
      preview_url: p.preview_url,
      uploaded: p.uploaded,
      position: p.position
    }))
    
    sessionStorage.setItem('enhancement-photos-metadata', JSON.stringify(photoMetadata))
    
    // Store the actual File objects in a temporary global variable
    // This is a workaround since we can't serialize File objects
    // In a production app, you'd handle this differently (e.g., upload immediately)
    const files = selectedPhotos.map(p => p.file)
    console.log('Storing files in global variable:', files.map(f => ({ name: f.name, size: f.size })))
    ;(window as any).enhancementFiles = files

    console.log('Navigating to style selection...')
    router.push('/enhance/style')
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const triggerCamera = () => {
    cameraInputRef.current?.click()
  }

  const clearAll = () => {
    selectedPhotos.forEach(photo => {
      URL.revokeObjectURL(photo.preview_url)
    })
    setSelectedPhotos([])
  }

  return (
    <DesktopLayout title="Select Photos">
      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* Left Panel - Upload Area */}
        <div className="flex-1 p-6">
          {/* Instructions */}
          <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-primary-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-semibold text-primary-900">
                  Choose up to {maxPhotos} photos to enhance
                </h2>
                <p className="text-sm text-primary-700">
                  Drag and drop photos here, or use the buttons below to select from your device. Supported formats: JPG, PNG, HEIC (max 10MB each).
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Upload Area */}
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all min-h-[400px] flex flex-col items-center justify-center ${
              dragOver 
                ? 'border-primary-400 bg-primary-50 scale-[1.02]' 
                : 'border-neutral-300 hover:border-primary-300 hover:bg-neutral-50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl flex items-center justify-center mx-auto">
                <Upload className="h-10 w-10 text-primary-600" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-neutral-900">
                  Drag photos here to get started
                </h3>
                <p className="text-neutral-600 max-w-md mx-auto">
                  Drop up to {maxPhotos} photos here, or use the buttons below to browse your files. We support JPG, PNG, and HEIC formats.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={triggerFileInput}
                  variant="primary"
                  size="lg"
                  leftIcon={<Image className="h-5 w-5" />}
                  disabled={selectedPhotos.length >= maxPhotos}
                  className="px-8"
                >
                  Browse Files
                </Button>
                <Button
                  onClick={triggerCamera}
                  variant="secondary"
                  size="lg"
                  leftIcon={<Camera className="h-5 w-5" />}
                  disabled={selectedPhotos.length >= maxPhotos}
                  className="px-8 lg:hidden"
                >
                  Take Photo
                </Button>
              </div>
              
              <p className="text-xs text-neutral-500">
                Maximum file size: 10MB per image
              </p>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Selected Photos */}
        <div className="lg:w-96 p-6 bg-white border-l border-neutral-200">
          {selectedPhotos.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900">
                  Selected Photos
                </h3>
                <Badge variant="primary" className="text-xs">
                  {selectedPhotos.length}/{maxPhotos}
                </Badge>
              </div>

              <div className="flex items-center justify-between mb-4">
                <Button
                  onClick={clearAll}
                  variant="ghost"
                  size="sm"
                  leftIcon={<RotateCcw className="h-4 w-4" />}
                >
                  Clear All
                </Button>
              </div>

              <div className="space-y-3">
                {selectedPhotos
                  .sort((a, b) => a.position - b.position)
                  .map((photo, index) => (
                  <Card key={photo.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="aspect-[4/3] relative">
                        <img
                          src={photo.preview_url}
                          alt={`Selected photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => removePhoto(photo.id)}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors shadow-md"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        {/* Position Badge */}
                        <div className="absolute top-2 left-2">
                          <Badge variant="primary" className="text-xs font-medium">
                            {index + 1}
                          </Badge>
                        </div>

                        {/* File Info */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
                          <p className="text-white text-xs font-medium truncate">
                            {photo.file.name}
                          </p>
                          <p className="text-white/70 text-xs">
                            {(photo.file.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Add More Button */}
                {selectedPhotos.length < maxPhotos && (
                  <button
                    onClick={triggerFileInput}
                    className="w-full aspect-[4/3] border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center gap-2 text-neutral-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all"
                  >
                    <Plus className="h-6 w-6" />
                    <span className="text-sm font-medium">Add More Photos</span>
                  </button>
                )}
              </div>

              {/* Continue Button */}
              <div className="pt-4 border-t border-neutral-200">
                <Button
                  onClick={handleContinue}
                  variant="primary"
                  size="lg"
                  className="w-full"
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                  disabled={selectedPhotos.length === 0}
                >
                  Continue to Style Selection
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Image className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                No photos selected
              </h3>
              <p className="text-neutral-600 text-sm">
                Add photos to get started with enhancement
              </p>
            </div>
          )}
        </div>


        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>
    </DesktopLayout>
  )
}

export default function EnhancePage() {
  return (
    <ToastProvider>
      <PhotoSelection />
    </ToastProvider>
  )
}
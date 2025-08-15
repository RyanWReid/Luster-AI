import { useState, useCallback } from 'react'
import { UploadProgress, UseUploadReturn } from '@/app/types'
import { assetsApi } from '@/app/lib/api'
import { validateImage } from '@/app/lib/utils'

export function useUpload(): UseUploadReturn {
  const [uploads, setUploads] = useState<UploadProgress[]>([])

  const uploadFiles = useCallback(async (files: File[], shootId: string) => {
    const validFiles = files.filter(file => {
      const validation = validateImage(file)
      return validation.valid
    })

    if (validFiles.length === 0) {
      throw new Error('No valid image files to upload')
    }

    // Add files to upload queue
    const newUploads: UploadProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }))

    setUploads(prev => [...prev, ...newUploads])

    // Upload files sequentially
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      const uploadIndex = uploads.length + i

      try {
        // Update status to uploading
        setUploads(prev => prev.map((upload, index) => 
          index === uploadIndex 
            ? { ...upload, status: 'uploading', progress: 10 }
            : upload
        ))

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploads(prev => prev.map((upload, index) => 
            index === uploadIndex && upload.progress < 90
              ? { ...upload, progress: upload.progress + 10 }
              : upload
          ))
        }, 200)

        // Upload file
        const asset = await assetsApi.upload(shootId, file)

        clearInterval(progressInterval)

        // Update status to completed
        setUploads(prev => prev.map((upload, index) => 
          index === uploadIndex 
            ? { 
                ...upload, 
                status: 'completed', 
                progress: 100,
                asset_id: asset.id 
              }
            : upload
        ))

      } catch (error) {
        // Update status to error
        setUploads(prev => prev.map((upload, index) => 
          index === uploadIndex 
            ? { 
                ...upload, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Upload failed'
              }
            : upload
        ))
      }
    }
  }, [uploads.length])

  const removeUpload = useCallback((index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index))
  }, [])

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(upload => upload.status !== 'completed'))
  }, [])

  return {
    uploads,
    uploadFiles,
    removeUpload,
    clearCompleted,
  }
}

export function useDirectUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const uploadToR2 = useCallback(async (
    file: File,
    presignedData: {
      upload_url: string
      fields: Record<string, string>
    },
    onProgress?: (progress: number) => void
  ) => {
    return new Promise<void>((resolve, reject) => {
      const formData = new FormData()
      
      // Add all the fields from presigned URL
      Object.entries(presignedData.fields).forEach(([key, value]) => {
        formData.append(key, value)
      })
      
      // Add the file last
      formData.append('file', file)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentProgress = Math.round((event.loaded / event.total) * 100)
          setProgress(percentProgress)
          onProgress?.(percentProgress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'))
      })

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'))
      })

      setUploading(true)
      xhr.open('POST', presignedData.upload_url)
      xhr.send(formData)
    })
  }, [])

  const reset = useCallback(() => {
    setUploading(false)
    setProgress(0)
  }, [])

  return {
    uploading,
    progress,
    uploadToR2,
    reset,
  }
}
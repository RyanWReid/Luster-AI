import { api, APIError } from '../lib/api'

interface PresignResponse {
  asset_id: string
  shoot_id: string
  object_key: string
  upload_url: string
  upload_fields: Record<string, string>
  expires_in: number
}

interface ConfirmResponse {
  id: string
  filename: string
  size: number
  upload_url: string
}

interface UploadResult {
  asset_id: string
  shoot_id: string
  filename: string
  upload_url: string
}

class UploadService {
  /**
   * Get presigned URL for R2 upload
   */
  async getPresignedUrl(
    filename: string,
    contentType: string = 'image/jpeg',
    fileSize: number = 10 * 1024 * 1024
  ): Promise<PresignResponse> {
    return api.post<PresignResponse>('/api/mobile/uploads/presign', {
      filename,
      content_type: contentType,
      file_size: fileSize,
    })
  }

  /**
   * Upload file directly to R2 using presigned URL
   */
  async uploadToR2(
    presignData: PresignResponse,
    fileUri: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    // Create form data for presigned POST
    const formData = new FormData()

    // Add all presigned fields first
    Object.entries(presignData.upload_fields).forEach(([key, value]) => {
      formData.append(key, value)
    })

    // Add the file last (required for S3 presigned POST)
    const file: any = {
      uri: fileUri,
      type: presignData.upload_fields['Content-Type'] || 'image/jpeg',
      name: presignData.object_key.split('/').pop() || 'photo.jpg',
    }
    formData.append('file', file)

    // Upload to R2
    const response = await fetch(presignData.upload_url, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`R2 upload failed: ${errorText}`, response.status)
    }
  }

  /**
   * Confirm upload completion with backend
   */
  async confirmUpload(
    presignData: PresignResponse,
    filename: string,
    fileSize: number,
    contentType: string = 'image/jpeg'
  ): Promise<ConfirmResponse> {
    return api.post<ConfirmResponse>('/api/mobile/uploads/confirm', {
      asset_id: presignData.asset_id,
      shoot_id: presignData.shoot_id,
      object_key: presignData.object_key,
      filename,
      file_size: fileSize,
      content_type: contentType,
    })
  }

  /**
   * Complete upload flow: presign -> upload to R2 -> confirm
   */
  async uploadPhoto(
    fileUri: string,
    filename: string,
    fileSize: number,
    contentType: string = 'image/jpeg',
    onProgress?: (stage: string, progress: number) => void
  ): Promise<UploadResult> {
    try {
      // Stage 1: Get presigned URL
      onProgress?.('presigning', 0)
      const presignData = await this.getPresignedUrl(filename, contentType, fileSize)
      onProgress?.('presigning', 100)

      // Stage 2: Upload to R2
      onProgress?.('uploading', 0)
      await this.uploadToR2(presignData, fileUri, (progress) => {
        onProgress?.('uploading', progress)
      })
      onProgress?.('uploading', 100)

      // Stage 3: Confirm upload
      onProgress?.('confirming', 0)
      const confirmed = await this.confirmUpload(
        presignData,
        filename,
        fileSize,
        contentType
      )
      onProgress?.('confirming', 100)

      return {
        asset_id: confirmed.id,
        shoot_id: presignData.shoot_id,
        filename: confirmed.filename,
        upload_url: confirmed.upload_url,
      }
    } catch (error) {
      console.error('Upload failed:', error)
      throw error
    }
  }
}

export default new UploadService()

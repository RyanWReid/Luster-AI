import { api } from '../lib/api'

export interface Photo {
  id: string
  filename: string
  upload_url: string
  thumbnail_url: string | null
  shoot: {
    id: string
    name: string
  }
  created_at: string
  jobs: {
    id: string
    status: 'queued' | 'processing' | 'succeeded' | 'failed'
    output_url: string | null
    prompt: string
    credits_used: number
    created_at: string
  }[]
}

interface GalleryResponse {
  photos: Photo[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

class GalleryService {
  /**
   * Get user's photo gallery with pagination
   */
  async getGallery(page: number = 1, perPage: number = 50): Promise<GalleryResponse> {
    return api.get<GalleryResponse>(
      `/api/mobile/gallery?page=${page}&per_page=${perPage}`
    )
  }

  /**
   * Get all photos (for small galleries)
   */
  async getAllPhotos(): Promise<Photo[]> {
    const allPhotos: Photo[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const response = await this.getGallery(page, 100)
      allPhotos.push(...response.photos)

      hasMore = page < response.pagination.total_pages
      page++
    }

    return allPhotos
  }

  /**
   * Get photos with their latest enhanced version
   */
  async getPhotosWithEnhancements(): Promise<(Photo & { latestEnhancement: string | null })[]> {
    const photos = await this.getAllPhotos()

    return photos.map(photo => {
      // Find the most recent successful job
      const successfulJobs = photo.jobs
        .filter(job => job.status === 'succeeded' && job.output_url)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      return {
        ...photo,
        latestEnhancement: successfulJobs[0]?.output_url || null,
      }
    })
  }
}

export default new GalleryService()

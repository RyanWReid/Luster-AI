import { supabase } from '../lib/supabase'
import { PropertyListing } from '../context/ListingsContext'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Get auth token for API requests
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

interface ListingsResponse {
  listings: PropertyListing[]
  count: number
}

class ListingsService {
  /**
   * Delete a project from backend (and R2 storage)
   */
  async deleteProject(shootId: string): Promise<boolean> {
    try {
      console.log(`===== DELETE PROJECT ${shootId} =====`)
      const token = await getAuthToken()

      if (!token) {
        console.log('No auth token - user not signed in')
        return false
      }

      const response = await fetch(`${API_BASE_URL}/api/mobile/projects/${shootId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      console.log('Delete response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to delete project:', {
          status: response.status,
          error: errorText,
        })
        return false
      }

      const data = await response.json()
      console.log(`✅ Deleted project: ${data.deleted_assets} assets, ${data.deleted_r2_files} R2 files`)
      return true
    } catch (error) {
      console.error('Error deleting project:', error)
      return false
    }
  }

  /**
   * Fetch user's completed listings from backend
   */
  async fetchListings(): Promise<PropertyListing[]> {
    try {
      console.log('===== FETCH LISTINGS FROM BACKEND =====')
      const token = await getAuthToken()

      if (!token) {
        console.log('No auth token - user not signed in')
        return []
      }

      console.log('Fetching listings from:', `${API_BASE_URL}/api/mobile/listings`)
      const response = await fetch(`${API_BASE_URL}/api/mobile/listings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to fetch listings:', {
          status: response.status,
          error: errorText,
        })
        throw new Error(`Failed to fetch listings: ${response.status}`)
      }

      const data: ListingsResponse = await response.json()
      console.log(`✅ Fetched ${data.count} listings from backend`)

      // Convert ISO date strings back to Date objects
      const listings = data.listings.map(listing => ({
        ...listing,
        createdAt: new Date(listing.createdAt),
      }))

      return listings
    } catch (error) {
      console.error('Error fetching listings:', error)
      return [] // Return empty array on error
    }
  }
}

export default new ListingsService()

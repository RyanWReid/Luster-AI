import { api, APIError } from '../lib/api'

interface UserSyncResponse {
  user_id: string
  email: string
  created: boolean
  credits: {
    balance: number
    is_new_user: boolean
  }
}

class UserService {
  /**
   * Sync user to backend after authentication
   * Should be called after successful social login
   */
  async syncUser(): Promise<UserSyncResponse> {
    try {
      const response = await api.post<UserSyncResponse>('/api/mobile/users/sync')
      return response
    } catch (error) {
      if (error instanceof APIError) {
        console.error('User sync failed:', error.statusCode, error.message)
      }
      throw error
    }
  }
}

export default new UserService()

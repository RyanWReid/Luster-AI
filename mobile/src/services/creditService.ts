import { getAuthToken } from '../lib/api'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'

interface CreditBalanceResponse {
  user_id: string
  balance: number
  updated_at: string
}

interface CreditTransactionResponse {
  transaction_id: string
  user_id: string
  amount: number
  type: 'debit' | 'credit'
  reason: string
  created_at: string
}

class CreditService {
  /**
   * Get user's current credit balance from the API (always fresh, no caching)
   */
  async getCreditBalance(): Promise<number> {
    try {
      const token = await getAuthToken()

      if (!token) {
        console.log('No auth token - returning 0 credits')
        return 0
      }

      const response = await fetch(`${API_BASE_URL}/api/mobile/credits/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        console.error('Failed to fetch credit balance:', response.status)
        return 0
      }

      const data: CreditBalanceResponse = await response.json()
      return data.balance
    } catch (error) {
      console.error('Error fetching credit balance:', error)
      return 0
    }
  }
  
  /**
   * Get credit transaction history
   */
  async getCreditHistory(limit: number = 20): Promise<CreditTransactionResponse[]> {
    try {
      const token = await getAuthToken()

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/api/mobile/credits/history?limit=${limit}`, {
        method: 'GET',
        headers,
      })
      
      if (!response.ok) {
        console.error('Failed to fetch credit history:', response.status)
        return []
      }
      
      const data = await response.json()
      return data.transactions || []
    } catch (error) {
      console.error('Error fetching credit history:', error)
      return []
    }
  }
  
  /**
   * Deduct credits after successful enhancement
   */
  async deductCredits(amount: number, reason: string): Promise<boolean> {
    try {
      const token = await getAuthToken()

      if (!token) {
        console.error('No auth token for deduct credits')
        return false
      }

      const response = await fetch(`${API_BASE_URL}/api/mobile/credits/deduct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, reason }),
      })

      if (!response.ok) {
        console.error('Failed to deduct credits:', response.status)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deducting credits:', error)
      return false
    }
  }

  /**
   * Check if user has enough credits for an operation
   */
  async hasEnoughCredits(required: number = 1): Promise<boolean> {
    const balance = await this.getCreditBalance()
    return balance >= required
  }
}

export default new CreditService()
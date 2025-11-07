import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'

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
   * Get user's current credit balance from the API
   */
  async getCreditBalance(userId?: string): Promise<number> {
    try {
      // Get Supabase session token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/api/mobile/credits/balance`, {
        method: 'GET',
        headers,
      })
      
      if (!response.ok) {
        console.error('Failed to fetch credit balance:', response.status)
        // Return cached value if API fails
        const cached = await AsyncStorage.getItem('userCredits')
        return cached ? parseInt(cached, 10) : 0
      }
      
      const data: CreditBalanceResponse = await response.json()
      
      // Cache the balance locally
      await AsyncStorage.setItem('userCredits', data.balance.toString())
      
      return data.balance
    } catch (error) {
      console.error('Error fetching credit balance:', error)
      
      // Return cached value if network error
      const cached = await AsyncStorage.getItem('userCredits')
      return cached ? parseInt(cached, 10) : 0
    }
  }
  
  /**
   * Get credit transaction history
   */
  async getCreditHistory(limit: number = 20): Promise<CreditTransactionResponse[]> {
    try {
      // Get Supabase session token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

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
      // Get Supabase session token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/api/mobile/credits/deduct`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount,
          reason,
        }),
      })
      
      if (!response.ok) {
        console.error('Failed to deduct credits:', response.status)
        return false
      }
      
      const data = await response.json()
      
      // Update cached balance
      if (data.new_balance !== undefined) {
        await AsyncStorage.setItem('userCredits', data.new_balance.toString())
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
  
  /**
   * Get cached credit balance (for quick display)
   */
  async getCachedBalance(): Promise<number> {
    try {
      const cached = await AsyncStorage.getItem('userCredits')
      return cached ? parseInt(cached, 10) : 0
    } catch (error) {
      console.error('Error getting cached balance:', error)
      return 0
    }
  }
}

export default new CreditService()
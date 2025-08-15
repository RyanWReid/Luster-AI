import { useState, useEffect, useCallback } from 'react'
import { UseApiReturn } from '@/app/types'
import { getErrorMessage } from '@/app/lib/api'

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiCall()
      setData(result)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, dependencies)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const mutate = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    error,
    loading,
    mutate,
  }
}

export function useApiMutation<T, TArgs extends any[]>(
  apiCall: (...args: TArgs) => Promise<T>
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const mutate = useCallback(async (...args: TArgs) => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiCall(...args)
      setData(result)
      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiCall])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    error,
    loading,
    mutate,
    reset,
  }
}
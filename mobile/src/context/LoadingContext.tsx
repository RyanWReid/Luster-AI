/**
 * Loading States Manager
 *
 * Centralized loading state management that:
 * - Prevents double-taps on buttons
 * - Tracks multiple concurrent operations
 * - Provides consistent loading UI state
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react'

// =============================================================================
// Types
// =============================================================================

/** Common loading operation keys */
export type LoadingKey =
  | 'enhance'
  | 'upload'
  | 'purchase'
  | 'login'
  | 'logout'
  | 'refresh'
  | 'delete'
  | 'save'
  | string // Allow custom keys

interface LoadingState {
  /** Map of loading keys to their loading status */
  loadingStates: Map<LoadingKey, boolean>
  /** Check if a specific operation is loading */
  isLoading: (key: LoadingKey) => boolean
  /** Check if any operation is loading */
  isAnyLoading: () => boolean
  /** Start a loading operation (returns false if already loading) */
  startLoading: (key: LoadingKey) => boolean
  /** Stop a loading operation */
  stopLoading: (key: LoadingKey) => void
  /** Execute an async operation with automatic loading state management */
  withLoading: <T>(key: LoadingKey, operation: () => Promise<T>) => Promise<T>
}

// =============================================================================
// Context
// =============================================================================

const LoadingContext = createContext<LoadingState | undefined>(undefined)

interface LoadingProviderProps {
  children: ReactNode
}

/**
 * Loading Provider that manages loading states across the app
 *
 * Usage:
 * <LoadingProvider>
 *   <App />
 * </LoadingProvider>
 */
export function LoadingProvider({ children }: LoadingProviderProps) {
  const [loadingStates, setLoadingStates] = useState<Map<LoadingKey, boolean>>(
    new Map()
  )

  const isLoading = useCallback(
    (key: LoadingKey): boolean => {
      return loadingStates.get(key) === true
    },
    [loadingStates]
  )

  const isAnyLoading = useCallback((): boolean => {
    return Array.from(loadingStates.values()).some((v) => v === true)
  }, [loadingStates])

  const startLoading = useCallback(
    (key: LoadingKey): boolean => {
      // Return false if already loading (prevents double-tap)
      if (loadingStates.get(key) === true) {
        console.log(`[Loading] Blocked duplicate: ${key}`)
        return false
      }

      setLoadingStates((prev) => {
        const next = new Map(prev)
        next.set(key, true)
        return next
      })
      return true
    },
    [loadingStates]
  )

  const stopLoading = useCallback((key: LoadingKey): void => {
    setLoadingStates((prev) => {
      const next = new Map(prev)
      next.set(key, false)
      return next
    })
  }, [])

  const withLoading = useCallback(
    async <T,>(key: LoadingKey, operation: () => Promise<T>): Promise<T> => {
      // Check if already loading
      if (!startLoading(key)) {
        throw new Error(`Operation "${key}" is already in progress`)
      }

      try {
        return await operation()
      } finally {
        stopLoading(key)
      }
    },
    [startLoading, stopLoading]
  )

  const value = useMemo<LoadingState>(
    () => ({
      loadingStates,
      isLoading,
      isAnyLoading,
      startLoading,
      stopLoading,
      withLoading,
    }),
    [loadingStates, isLoading, isAnyLoading, startLoading, stopLoading, withLoading]
  )

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  )
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access loading states
 *
 * @throws Error if used outside LoadingProvider
 *
 * Usage:
 * const { isLoading, withLoading } = useLoading()
 *
 * // Check loading state
 * <Button disabled={isLoading('enhance')} />
 *
 * // Wrap async operation
 * await withLoading('enhance', async () => {
 *   await api.post('/enhance', data)
 * })
 */
export function useLoading(): LoadingState {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

/**
 * Hook for a specific loading key with simpler API
 *
 * Usage:
 * const { loading, execute } = useLoadingState('enhance')
 *
 * <Button disabled={loading} onPress={() => execute(enhance)} />
 */
export function useLoadingState(key: LoadingKey) {
  const { isLoading, withLoading } = useLoading()

  const loading = isLoading(key)

  const execute = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T> => {
      return withLoading(key, operation)
    },
    [key, withLoading]
  )

  return { loading, execute }
}

export default LoadingContext

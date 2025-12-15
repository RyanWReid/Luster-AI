import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import * as Network from 'expo-network'
import { AppState, AppStateStatus } from 'react-native'

interface NetworkState {
  isConnected: boolean
  isInternetReachable: boolean | null
  type: Network.NetworkStateType | null
  isLoading: boolean
}

interface NetworkContextValue extends NetworkState {
  checkConnection: () => Promise<void>
}

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined)

interface NetworkProviderProps {
  children: ReactNode
}

/**
 * Network Provider that monitors connectivity status
 * and provides it to the entire app via context.
 *
 * Usage:
 * <NetworkProvider>
 *   <App />
 * </NetworkProvider>
 *
 * Then in components:
 * const { isConnected, isInternetReachable } = useNetwork()
 */
export function NetworkProvider({ children }: NetworkProviderProps) {
  const [state, setState] = useState<NetworkState>({
    isConnected: true, // Optimistic default
    isInternetReachable: null,
    type: null,
    isLoading: true,
  })

  const checkConnection = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync()
      setState({
        isConnected: networkState.isConnected ?? false,
        isInternetReachable: networkState.isInternetReachable ?? null,
        type: networkState.type ?? null,
        isLoading: false,
      })
    } catch (error) {
      console.error('Error checking network state:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  // Check connection on mount
  useEffect(() => {
    checkConnection()
  }, [])

  // Re-check when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkConnection()
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => subscription.remove()
  }, [])

  // Poll for connection changes (expo-network doesn't have event listeners)
  useEffect(() => {
    const interval = setInterval(checkConnection, 5000) // Check every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const value: NetworkContextValue = {
    ...state,
    checkConnection,
  }

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  )
}

/**
 * Hook to access network status
 *
 * @returns NetworkContextValue with isConnected, isInternetReachable, type, isLoading
 * @throws Error if used outside NetworkProvider
 */
export function useNetwork(): NetworkContextValue {
  const context = useContext(NetworkContext)
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider')
  }
  return context
}

/**
 * Hook that returns true only when definitely offline
 * (avoids false positives during loading)
 */
export function useIsOffline(): boolean {
  const { isConnected, isInternetReachable, isLoading } = useNetwork()

  // Don't report offline while still loading
  if (isLoading) return false

  // Definitely offline if not connected
  if (!isConnected) return true

  // If connected but internet not reachable, also offline
  if (isInternetReachable === false) return true

  return false
}

export default NetworkContext

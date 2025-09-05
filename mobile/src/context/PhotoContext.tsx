import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface PhotoContextType {
  selectedPhotos: string[]
  setSelectedPhotos: (photos: string[]) => void
  enhancedPhotos: string[]
  setEnhancedPhotos: (photos: string[]) => void
  clearPhotos: () => void
  creditBalance: number
  setCreditBalance: (balance: number) => void
  refreshCredits: () => Promise<void>
  isLoadingCredits: boolean
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined)

export function PhotoProvider({ children }: { children: ReactNode }) {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [enhancedPhotos, setEnhancedPhotos] = useState<string[]>([])
  const [creditBalance, setCreditBalance] = useState<number>(0)
  const [isLoadingCredits, setIsLoadingCredits] = useState(false)

  const clearPhotos = () => {
    setSelectedPhotos([])
    setEnhancedPhotos([])
  }

  const refreshCredits = async () => {
    setIsLoadingCredits(true)
    try {
      // TODO(human): Implement API call to fetch user credits
      // For now, we'll use a mock value from AsyncStorage
      const storedCredits = await AsyncStorage.getItem('userCredits')
      if (storedCredits) {
        setCreditBalance(parseInt(storedCredits, 10))
      } else {
        // Default mock value
        setCreditBalance(10)
        await AsyncStorage.setItem('userCredits', '10')
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error)
      setCreditBalance(0)
    } finally {
      setIsLoadingCredits(false)
    }
  }

  // Load credits on mount
  useEffect(() => {
    refreshCredits()
  }, [])

  return (
    <PhotoContext.Provider value={{ 
      selectedPhotos, 
      setSelectedPhotos, 
      enhancedPhotos,
      setEnhancedPhotos,
      clearPhotos,
      creditBalance,
      setCreditBalance,
      refreshCredits,
      isLoadingCredits
    }}>
      {children}
    </PhotoContext.Provider>
  )
}

export function usePhotos() {
  const context = useContext(PhotoContext)
  if (!context) {
    throw new Error('usePhotos must be used within a PhotoProvider')
  }
  return context
}
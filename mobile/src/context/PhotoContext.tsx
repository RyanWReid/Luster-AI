import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import enhancementService from '../services/enhancementService'

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
      const balance = await enhancementService.getCreditBalance()
      setCreditBalance(balance)
      console.log(`✅ Fetched credit balance: ${balance}`)
    } catch (error) {
      console.error('Failed to fetch credits:', error)
      // Fallback to 0 if API fails
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
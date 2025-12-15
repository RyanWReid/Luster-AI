import React, { createContext, useContext, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface PhotoContextType {
  selectedPhotos: string[]
  setSelectedPhotos: (photos: string[]) => void
  enhancedPhotos: string[]
  setEnhancedPhotos: (photos: string[]) => void
  clearPhotos: () => void
  // Credit values now come from AuthContext for single source of truth
  creditBalance: number
  refreshCredits: () => Promise<number>
  isLoadingCredits: boolean
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined)

export function PhotoProvider({ children }: { children: ReactNode }) {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [enhancedPhotos, setEnhancedPhotos] = useState<string[]>([])

  // Use credits from AuthContext as single source of truth
  const { credits, refreshCredits: authRefreshCredits, loading: authLoading } = useAuth()

  const clearPhotos = () => {
    setSelectedPhotos([])
    setEnhancedPhotos([])
  }

  // Wrapper to maintain API compatibility
  const refreshCredits = async () => {
    return authRefreshCredits()
  }

  return (
    <PhotoContext.Provider value={{
      selectedPhotos,
      setSelectedPhotos,
      enhancedPhotos,
      setEnhancedPhotos,
      clearPhotos,
      creditBalance: credits,
      refreshCredits,
      isLoadingCredits: authLoading
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
import React, { createContext, useContext, useState, ReactNode } from 'react'

interface PhotoContextType {
  selectedPhotos: string[]
  setSelectedPhotos: (photos: string[]) => void
  clearPhotos: () => void
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined)

export function PhotoProvider({ children }: { children: ReactNode }) {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])

  const clearPhotos = () => {
    setSelectedPhotos([])
  }

  return (
    <PhotoContext.Provider value={{ selectedPhotos, setSelectedPhotos, clearPhotos }}>
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
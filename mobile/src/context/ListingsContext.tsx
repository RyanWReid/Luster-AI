import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@luster_listings'

export type PropertyStatus = 'processing' | 'ready' | 'completed'

export interface PropertyListing {
  id: string
  address: string
  price: string
  beds: number
  baths: number
  image: any // Cover image (can be require() or { uri: string })
  images?: any[] // All enhanced images for this listing
  originalImages?: any[] // Original images before enhancement
  isEnhanced?: boolean
  status: PropertyStatus // 'processing' | 'ready' | 'completed'
  createdAt: Date
}

interface ListingsContextType {
  listings: PropertyListing[]
  addListing: (listing: Omit<PropertyListing, 'id' | 'createdAt'>) => void
  updateListing: (id: string, updates: Partial<PropertyListing>) => void
  updateListingName: (id: string, newName: string) => void
  removeListing: (id: string) => void
  clearListings: () => void
  isLoading: boolean
  isProcessing: (id: string) => boolean
  markAsProcessing: (id: string) => void
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined)

export function ListingsProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<PropertyListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // Global processing tracker (survives component re-mounts during hot reload)
  const processingPropertiesRef = React.useRef<Set<string>>(new Set())

  // Load listings from storage on mount
  useEffect(() => {
    loadListings()
  }, [])

  // Save listings to storage whenever they change (debounced)
  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => {
        saveListings()
      }, 500) // Wait 500ms after last change before saving

      return () => clearTimeout(timeoutId)
    }
  }, [listings, isLoading])

  const loadListings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Convert createdAt strings back to Date objects
        const listingsWithDates = parsed.map((listing: any) => ({
          ...listing,
          createdAt: new Date(listing.createdAt),
        }))
        setListings(listingsWithDates)
      }
    } catch (error) {
      console.error('Failed to load listings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveListings = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(listings))
    } catch (error) {
      console.error('Failed to save listings:', error)
    }
  }

  const addListing = (listing: Omit<PropertyListing, 'id' | 'createdAt'>) => {
    const newListing: PropertyListing = {
      ...listing,
      id: Date.now().toString(),
      createdAt: new Date(),
    }
    setListings(prev => [newListing, ...prev]) // Add to beginning
    return newListing.id // Return ID so caller can reference it
  }

  const updateListing = (id: string, updates: Partial<PropertyListing>) => {
    setListings(prev =>
      prev.map(listing =>
        listing.id === id ? { ...listing, ...updates } : listing
      )
    )
  }

  const updateListingName = (id: string, newName: string) => {
    setListings(prev =>
      prev.map(listing =>
        listing.id === id ? { ...listing, address: newName } : listing
      )
    )
  }

  const removeListing = (id: string) => {
    setListings(prev => prev.filter(listing => listing.id !== id))
  }

  const clearListings = () => {
    setListings([])
  }

  const isProcessing = (id: string): boolean => {
    return processingPropertiesRef.current.has(id)
  }

  const markAsProcessing = (id: string) => {
    processingPropertiesRef.current.add(id)
    console.log('ListingsContext: Marked as processing:', id, 'Total processing:', processingPropertiesRef.current.size)
  }

  return (
    <ListingsContext.Provider
      value={{
        listings,
        addListing,
        updateListing,
        updateListingName,
        removeListing,
        clearListings,
        isLoading,
        isProcessing,
        markAsProcessing
      }}
    >
      {children}
    </ListingsContext.Provider>
  )
}

export function useListings() {
  const context = useContext(ListingsContext)
  if (!context) {
    throw new Error('useListings must be used within a ListingsProvider')
  }
  return context
}
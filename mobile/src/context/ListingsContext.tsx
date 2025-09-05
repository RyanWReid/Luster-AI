import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface PropertyListing {
  id: string
  address: string
  price: string
  beds: number
  baths: number
  image: any // Image source (can be require() or { uri: string })
  isEnhanced?: boolean
  createdAt: Date
}

interface ListingsContextType {
  listings: PropertyListing[]
  addListing: (listing: Omit<PropertyListing, 'id' | 'createdAt'>) => void
  removeListing: (id: string) => void
  clearListings: () => void
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined)

export function ListingsProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<PropertyListing[]>([])

  const addListing = (listing: Omit<PropertyListing, 'id' | 'createdAt'>) => {
    const newListing: PropertyListing = {
      ...listing,
      id: Date.now().toString(),
      createdAt: new Date(),
    }
    setListings(prev => [newListing, ...prev]) // Add to beginning
  }

  const removeListing = (id: string) => {
    setListings(prev => prev.filter(listing => listing.id !== id))
  }

  const clearListings = () => {
    setListings([])
  }

  return (
    <ListingsContext.Provider value={{ listings, addListing, removeListing, clearListings }}>
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
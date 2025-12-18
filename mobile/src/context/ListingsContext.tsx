import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import listingsService from '../services/listingsService'
import { useAuth } from './AuthContext'
import type { PropertyListing, PropertyStatus } from '../types'

// Re-export types for backwards compatibility
export type { PropertyListing, PropertyStatus } from '../types'

const STORAGE_KEY = '@luster_listings'

interface ListingsContextType {
  listings: PropertyListing[]
  addListing: (listing: Omit<PropertyListing, 'id' | 'createdAt'>) => void
  updateListing: (id: string, updates: Partial<PropertyListing>) => void
  updateListingName: (id: string, newName: string) => void
  removeListing: (id: string) => Promise<void>
  clearListings: () => Promise<void>
  syncFromBackend: () => Promise<void>
  isLoading: boolean
  isSyncing: boolean
  isProcessing: (id: string) => boolean
  markAsProcessing: (id: string) => void
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined)

export function ListingsProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<PropertyListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  // Global processing tracker (survives component re-mounts during hot reload)
  const processingPropertiesRef = React.useRef<Set<string>>(new Set())
  // Sync lock to prevent concurrent syncs (race condition fix)
  const syncInProgressRef = React.useRef(false)

  // Get current user to detect account switches
  const { user, synced } = useAuth()

  // Track the current user ID to detect changes
  const currentUserIdRef = React.useRef<string | null>(null)

  // Reset listings when user changes (account switch)
  useEffect(() => {
    const newUserId = user?.id || null

    if (currentUserIdRef.current !== null && currentUserIdRef.current !== newUserId) {
      // User changed - clear local state immediately
      console.log('🔄 User changed, clearing local listings cache')
      setListings([])
      processingPropertiesRef.current.clear()
      setIsLoading(true)
    }

    currentUserIdRef.current = newUserId
  }, [user?.id])

  // Load listings from storage on mount or when user changes
  useEffect(() => {
    if (user) {
      loadListings()
    } else {
      // No user - clear listings
      setListings([])
      setIsLoading(false)
    }
  }, [user?.id])

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

  const removeListing = async (id: string) => {
    // Find the listing to get backendShootId
    const listing = listings.find(l => l.id === id)

    // Remove from local state immediately for responsive UI
    setListings(prev => prev.filter(l => l.id !== id))

    // If it has a backend shoot ID, delete from server too
    if (listing?.backendShootId) {
      console.log(`🗑️ Deleting project from backend: ${listing.backendShootId}`)
      const success = await listingsService.deleteProject(listing.backendShootId)
      if (success) {
        console.log(`✅ Project deleted from backend and R2`)
      } else {
        console.error(`❌ Failed to delete from backend (local removed anyway)`)
      }
    }
  }

  const clearListings = async () => {
    // Delete all listings from backend first
    const listingsToDelete = listings.filter(l => l.backendShootId)

    if (listingsToDelete.length > 0) {
      const results = await Promise.allSettled(
        listingsToDelete.map(l => listingsService.deleteProject(l.backendShootId!))
      )

      const succeeded = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (failed > 0) {
        console.warn(`⚠️ Deleted ${succeeded}/${listingsToDelete.length} listings (${failed} failed)`)
      } else {
        console.log(`🗑️ Cleared ${succeeded} listings from backend`)
      }
    }

    // Always clear local state regardless of backend failures
    setListings([])
  }

  const syncFromBackend = useCallback(async (replaceAll: boolean = false) => {
    // Prevent concurrent syncs (race condition)
    if (syncInProgressRef.current) {
      console.log('⏳ Sync already in progress, skipping...')
      return
    }

    syncInProgressRef.current = true
    setIsSyncing(true)

    try {
      console.log('🔄 Syncing listings from backend...')
      const backendListings = await listingsService.fetchListings()

      if (backendListings.length > 0) {
        console.log(`✅ Synced ${backendListings.length} listings from backend`)

        if (replaceAll) {
          // Replace all local data with backend data (used after account switch)
          const formattedListings = backendListings.map(backend => ({
            ...backend,
            id: backend.id, // Use backend ID as local ID
            backendShootId: backend.id,
            createdAt: new Date(backend.createdAt),
          }))
          setListings(formattedListings)
          console.log(`📊 Replaced all listings with ${formattedListings.length} from backend`)
        } else {
          // Merge strategy: keep local listings, add new from backend, update existing
          setListings(prev => {
            // Get set of backend shoot IDs we already have locally
            const existingBackendIds = new Set(
              prev.map(l => l.backendShootId).filter(Boolean)
            )

            // Also track local IDs to prevent duplicates during race conditions
            // (when backendShootId hasn't been set yet but listing exists)
            const existingLocalIds = new Set(prev.map(l => l.id))

            // Find new listings from backend that we don't have locally
            // Check both backendShootId AND local id to prevent race condition duplicates
            const newFromBackend = backendListings.filter(backend => {
              // Skip if we already have this backend ID
              if (existingBackendIds.has(backend.id)) return false
              // Skip if backend.id matches a local ID (listing was just created)
              if (existingLocalIds.has(backend.id)) return false
              // Skip if there's a local listing with matching status that was just created
              // (within last 60 seconds) - this catches race conditions
              const recentLocal = prev.find(l =>
                !l.backendShootId &&
                l.status === 'processing' &&
                l.createdAt &&
                (Date.now() - new Date(l.createdAt).getTime()) < 60000
              )
              if (recentLocal) {
                console.log('⏳ Skipping backend listing - recent local listing exists:', recentLocal.id)
                // Link this backend listing to the recent local one
                return false
              }
              return true
            }).map(backend => ({
              ...backend,
              backendShootId: backend.id, // Map backend id to backendShootId
            }))

            // Update existing local listings with backend data (images, status)
            const updatedLocal = prev.map(local => {
              if (local.backendShootId) {
                const backend = backendListings.find(b => b.id === local.backendShootId)
                if (backend) {
                  // Update with backend data but keep local id
                  return {
                    ...local,
                    address: backend.address || local.address,
                    images: backend.images || local.images,
                    image: backend.image || local.image,
                    status: backend.status === 'completed' ? 'completed' : local.status,
                    isEnhanced: backend.isEnhanced ?? local.isEnhanced,
                  }
                }
              }
              // Handle race condition: local listing without backendShootId
              // that was recently created - try to match with backend listing
              if (!local.backendShootId && local.status === 'processing' && local.createdAt) {
                const localAge = Date.now() - new Date(local.createdAt).getTime()
                if (localAge < 120000) { // Within 2 minutes
                  // Find a backend listing that doesn't match any existing backendShootId
                  const unmatchedBackend = backendListings.find(b =>
                    !existingBackendIds.has(b.id) &&
                    (b.status === 'completed' || b.status === 'ready')
                  )
                  if (unmatchedBackend) {
                    console.log(`🔗 Linking recent local listing ${local.id} to backend ${unmatchedBackend.id}`)
                    return {
                      ...local,
                      backendShootId: unmatchedBackend.id,
                      address: unmatchedBackend.address || local.address,
                      images: unmatchedBackend.images || local.images,
                      image: unmatchedBackend.image || local.image,
                      status: unmatchedBackend.status === 'completed' ? 'completed' : local.status,
                      isEnhanced: unmatchedBackend.isEnhanced ?? local.isEnhanced,
                    }
                  }
                }
              }
              return local
            })

            // Combine: updated local + new from backend
            const merged = [...updatedLocal, ...newFromBackend]
            console.log(`📊 Merged: ${updatedLocal.length} local + ${newFromBackend.length} new = ${merged.length} total`)
            return merged
          })
        }
      } else {
        console.log('No listings found on backend')
        if (replaceAll) {
          setListings([])
        }
      }
    } catch (error) {
      console.error('Failed to sync listings from backend:', error)
    } finally {
      syncInProgressRef.current = false
      setIsSyncing(false)
    }
  }, [])

  // Auto-sync from backend when user is authenticated and synced
  useEffect(() => {
    if (user && synced) {
      // Replace all when syncing for a new session
      syncFromBackend(true)
    }
  }, [user?.id, synced, syncFromBackend])

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
        syncFromBackend,
        isLoading,
        isSyncing,
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
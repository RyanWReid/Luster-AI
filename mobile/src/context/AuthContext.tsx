import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Alert, Linking } from 'react-native'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithEmail: (email: string) => Promise<void>
  signOut: () => Promise<void>
  bypassLogin: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        // Show success message on sign in
        if (event === 'SIGNED_IN') {
          Alert.alert('Success', 'You are now signed in!')
        }
      }
    )

    // Handle deep links for magic link authentication
    const handleDeepLink = ({ url }: { url: string }) => {
      if (url && url.includes('#')) {
        // Extract the hash fragment (contains token info)
        const hashFragment = url.split('#')[1]

        // Parse the hash fragment as query params
        const params = new URLSearchParams(hashFragment)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken) {
          // Set the session with the tokens from the deep link
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })
        }
      }
    }

    // Add deep link listener
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink)

    // Check for initial URL (if app was closed and opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url })
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
      linkingSubscription.remove()
    }
  }, [])

  const signInWithEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: 'lusterai://auth',
        },
      })
      if (error) throw error
      Alert.alert('Success', 'Check your email for the login link!')
    } catch (error: any) {
      Alert.alert('Error', error.message)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      Alert.alert('Success', 'Signed out successfully!')
    } catch (error: any) {
      Alert.alert('Error', error.message)
    }
  }

  // TEMPORARY: Bypass login for testing
  const bypassLogin = () => {
    const mockUser = {
      id: 'test-user-123',
      email: 'test@luster.ai',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User

    const mockSession = {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser,
    } as Session

    setUser(mockUser)
    setSession(mockSession)
    console.log('🔓 Bypassed login - using mock user for testing')
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithEmail, signOut, bypassLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
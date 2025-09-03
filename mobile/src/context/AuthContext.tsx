import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Alert } from 'react-native'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithEmail: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const signInWithEmail = async (email: string) => {
    try {
      // BYPASS AUTH FOR DEVELOPMENT
      // Create a mock user session
      const mockUser = {
        id: 'mock-user-id',
        email: email,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User
      
      const mockSession = {
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: mockUser,
      } as Session
      
      // Set the mock session
      setUser(mockUser)
      setSession(mockSession)
      
      Alert.alert('Success', 'Logged in successfully! (Development mode)')
      
      // Original Supabase code (commented out for bypass)
      // const { error } = await supabase.auth.signInWithOtp({
      //   email: email,
      //   options: {
      //     emailRedirectTo: 'lusterai://auth',
      //   },
      // })
      // if (error) throw error
      // Alert.alert('Success', 'Check your email for the login link!')
    } catch (error: any) {
      Alert.alert('Error', error.message)
    }
  }

  const signOut = async () => {
    try {
      // BYPASS AUTH FOR DEVELOPMENT
      // Simply clear the mock session
      setUser(null)
      setSession(null)
      Alert.alert('Success', 'Signed out successfully!')
      
      // Original Supabase code (commented out for bypass)
      // const { error } = await supabase.auth.signOut()
      // if (error) throw error
    } catch (error: any) {
      Alert.alert('Error', error.message)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithEmail, signOut }}>
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
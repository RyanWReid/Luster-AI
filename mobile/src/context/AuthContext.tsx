import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Alert, Platform } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as Crypto from 'expo-crypto'
import userService from '../services/userService'
import creditService from '../services/creditService'

// Important for Expo WebBrowser
WebBrowser.maybeCompleteAuthSession()

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  credits: number
  synced: boolean
  signInWithEmail: (email: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
  signInWithFacebook: () => Promise<void>
  signOut: () => Promise<void>
  bypassLogin: () => void
  refreshCredits: () => Promise<number>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState(0)
  const [synced, setSynced] = useState(false)

  // Sync user to backend after authentication
  const syncUserToBackend = async () => {
    try {
      const result = await userService.syncUser()
      setCredits(result.credits.balance)
      setSynced(true)

      if (result.credits.is_new_user) {
        console.log('Welcome! You received 10 free credits')
      }
    } catch (error) {
      console.error('Failed to sync user to backend:', error)
      // Don't block app usage if sync fails
      setSynced(true)
    }
  }

  // Refresh credits from backend
  const refreshCredits = async () => {
    try {
      const balance = await creditService.getCreditBalance()
      setCredits(balance)
      return balance
    } catch (error) {
      console.error('Failed to refresh credits:', error)
      return credits
    }
  }

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

        // Sync user to backend on sign in
        if (event === 'SIGNED_IN' && session) {
          // Wait a moment for session to be fully established
          setTimeout(() => {
            syncUserToBackend()
          }, 500)
        }

        // Reset state on sign out
        if (event === 'SIGNED_OUT') {
          setCredits(0)
          setSynced(false)
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

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = Linking.createURL('/--/auth/callback')

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      })
      if (error) throw error

      // Open OAuth URL in in-app browser
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        )

        if (result.type === 'success') {
          const { url } = result
          const params = new URLSearchParams(url.split('#')[1])
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')

          if (access_token && refresh_token) {
            await supabase.auth.setSession({
              access_token,
              refresh_token,
            })
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message)
    }
  }

  const signInWithApple = async () => {
    try {
      // Use native Apple Sign In on iOS
      if (Platform.OS === 'ios') {
        // Generate a random nonce for security
        const rawNonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

        // Hash the nonce with SHA-256 (required by Apple)
        const hashedNonce = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          rawNonce
        )

        // Request Apple credentials with the HASHED nonce
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          nonce: hashedNonce,
        })

        console.log('Apple credential received:', {
          user: credential.user,
          email: credential.email,
          fullName: credential.fullName,
        })

        // Sign in with Supabase using the Apple ID token and RAW nonce
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken!,
          nonce: rawNonce,  // Use the ORIGINAL (unhashed) nonce here
        })

        if (error) {
          console.error('Supabase sign in error:', error)
          throw error
        }

        console.log('✅ Signed in with Apple successfully!', data)
      } else {
        throw new Error('Apple Sign In is only available on iOS')
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User canceled the sign-in flow
        console.log('User canceled Apple Sign In')
      } else {
        console.error('Apple Sign In error:', error)
        Alert.alert('Error', error.message || 'Failed to sign in with Apple')
      }
    }
  }

  const signInWithFacebook = async () => {
    try {
      const redirectUrl = Linking.createURL('/--/auth/callback')

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      })
      if (error) throw error

      // Open OAuth URL in in-app browser
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        )

        if (result.type === 'success') {
          const { url } = result
          const params = new URLSearchParams(url.split('#')[1])
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')

          if (access_token && refresh_token) {
            await supabase.auth.setSession({
              access_token,
              refresh_token,
            })
          }
        }
      }
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
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        credits,
        synced,
        signInWithEmail,
        signInWithGoogle,
        signInWithApple,
        signInWithFacebook,
        signOut,
        bypassLogin,
        refreshCredits
      }}
    >
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
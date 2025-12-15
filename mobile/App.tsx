import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './src/context/AuthContext'
import { PhotoProvider } from './src/context/PhotoContext'
import { ListingsProvider } from './src/context/ListingsContext'
import { NetworkProvider } from './src/context/NetworkContext'
import { LoadingProvider } from './src/context/LoadingContext'
import { ErrorBoundary } from './src/components/ErrorBoundary'
import { OfflineBanner } from './src/components/OfflineBanner'
import { initCrashReporting } from './src/lib/crashReporting'
import RootNavigator from './src/navigation/RootNavigator'

// Initialize crash reporting early
initCrashReporting()

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NetworkProvider>
          <LoadingProvider>
            <AuthProvider>
              <PhotoProvider>
                <ListingsProvider>
                  <OfflineBanner />
                  <RootNavigator />
                  <StatusBar style="auto" />
                </ListingsProvider>
              </PhotoProvider>
            </AuthProvider>
          </LoadingProvider>
        </NetworkProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  )
}

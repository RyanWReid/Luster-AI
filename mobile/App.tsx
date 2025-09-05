import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from './src/context/AuthContext'
import { PhotoProvider } from './src/context/PhotoContext'
import { ListingsProvider } from './src/context/ListingsContext'
import RootNavigator from './src/navigation/RootNavigator'

export default function App() {
  return (
    <AuthProvider>
      <PhotoProvider>
        <ListingsProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </ListingsProvider>
      </PhotoProvider>
    </AuthProvider>
  )
}

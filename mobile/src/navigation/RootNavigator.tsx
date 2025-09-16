import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { useAuth } from '../context/AuthContext'
import WelcomeScreen from '../screens/WelcomeScreen'
import AuthScreen from '../screens/AuthScreen'
import LoginScreen from '../screens/LoginScreen'
import DashboardScreen from '../screens/DashboardScreen'
import NewListingScreen from '../screens/NewListingScreen'
import StyleSelectionScreen from '../screens/StyleSelectionScreen'
import ConfirmationScreen from '../screens/ConfirmationScreen'
import ProcessingScreen from '../screens/ProcessingScreen'
import ResultScreen from '../screens/ResultScreen'
import GalleryScreen from '../screens/GalleryScreen'
import ProjectScreen from '../screens/ProjectScreen'
import MainTabs from './MainTabs'

export type RootStackParamList = {
  Welcome: undefined
  Auth: undefined
  Login: undefined
  Dashboard: undefined
  NewListing: undefined
  StyleSelection: undefined
  Confirmation: undefined
  Processing: undefined
  Result: undefined
  Gallery: undefined
  Project: undefined
  Main: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

export default function RootNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return null
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="NewListing" component={NewListingScreen} />
            <Stack.Screen name="StyleSelection" component={StyleSelectionScreen} />
            <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
            <Stack.Screen name="Processing" component={ProcessingScreen} />
            <Stack.Screen name="Result" component={ResultScreen} />
            <Stack.Screen name="Gallery" component={GalleryScreen} />
            <Stack.Screen name="Project" component={ProjectScreen} />
            <Stack.Screen name="Main" component={MainTabs} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
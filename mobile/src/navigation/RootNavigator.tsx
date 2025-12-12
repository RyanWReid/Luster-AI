import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { useAuth } from '../context/AuthContext'
import WelcomeScreen from '../screens/WelcomeScreen'
import AuthScreen from '../screens/AuthScreen'
import LoginScreen from '../screens/LoginScreen'
import NewListingScreen from '../screens/NewListingScreen'
import StyleSelectionScreen from '../screens/StyleSelectionScreen'
import ConfirmationScreen from '../screens/ConfirmationScreen'
import ProcessingScreen from '../screens/ProcessingScreen'
import ResultScreen from '../screens/ResultScreen'
import ProjectScreen from '../screens/ProjectScreen'
import CreditsScreen from '../screens/CreditsScreen'
import AllPropertiesScreen from '../screens/AllPropertiesScreen'
import PrivacySecurityScreen from '../screens/PrivacySecurityScreen'
import AccountSettingsScreen from '../screens/AccountSettingsScreen'
import MainTabs from './MainTabs'

export type RootStackParamList = {
  Welcome: undefined
  Auth: undefined
  Login: undefined
  Main: undefined
  NewListing: undefined
  StyleSelection: undefined
  Confirmation: { style: string; photoCount: number }
  Processing: undefined
  Result: undefined
  Project: { property?: any }
  Credits: undefined
  AllProperties: undefined
  PrivacySecurity: undefined
  AccountSettings: undefined
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
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="NewListing" component={NewListingScreen} />
            <Stack.Screen name="StyleSelection" component={StyleSelectionScreen} />
            <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
            <Stack.Screen name="Processing" component={ProcessingScreen} />
            <Stack.Screen name="Result" component={ResultScreen} />
            <Stack.Screen name="Project" component={ProjectScreen} />
            <Stack.Screen name="Credits" component={CreditsScreen} />
            <Stack.Screen name="AllProperties" component={AllPropertiesScreen} />
            <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
            <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
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
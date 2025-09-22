import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import DashboardScreen from '../screens/DashboardScreenNew'
import GalleryScreen from '../screens/GalleryScreen'
import SettingsScreen from '../screens/SettingsScreen'
import FloatingTabBar from '../components/FloatingTabBar'

export type MainTabParamList = {
  Dashboard: undefined
  Gallery: undefined
  Settings: undefined
}

const Tab = createBottomTabNavigator<MainTabParamList>()

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Gallery" component={GalleryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}
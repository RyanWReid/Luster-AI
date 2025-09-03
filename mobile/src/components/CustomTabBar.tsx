import React from 'react'
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.tabBar}>
        <View style={styles.leftTabs}>
          {state.routes.slice(0, 2).map((route, index) => {
            const { options } = descriptors[route.key]
            const isFocused = state.index === index

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              })

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name)
              }
            }

            let iconName: keyof typeof Ionicons.glyphMap = 'home-outline'
            if (route.name === 'Home') {
              iconName = isFocused ? 'home' : 'home-outline'
            } else if (route.name === 'Shoots') {
              iconName = isFocused ? 'images' : 'images-outline'
            }

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                style={styles.tab}
              >
                <Ionicons 
                  name={iconName} 
                  size={24} 
                  color={isFocused ? '#6366f1' : '#9CA3AF'} 
                />
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.centerSpace} />

        <View style={styles.rightTabs}>
          {state.routes.slice(2).map((route, index) => {
            const { options } = descriptors[route.key]
            const actualIndex = index + 2
            const isFocused = state.index === actualIndex

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              })

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name)
              }
            }

            let iconName: keyof typeof Ionicons.glyphMap = 'person-outline'
            if (route.name === 'Profile') {
              iconName = isFocused ? 'person' : 'person-outline'
            }

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                style={styles.tab}
              >
                <Ionicons 
                  name={iconName} 
                  size={24} 
                  color={isFocused ? '#6366f1' : '#9CA3AF'} 
                />
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Center Enhance Button */}
      <TouchableOpacity 
        style={styles.centerButton}
        onPress={() => navigation.navigate('Home')}
        activeOpacity={0.8}
      >
        <View style={styles.centerButtonGradient}>
          <Ionicons name="star" size={28} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    height: 60,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  leftTabs: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  centerSpace: {
    width: 80,
  },
  rightTabs: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  centerButton: {
    position: 'absolute',
    top: -28,
    left: width / 2 - 32,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFA500',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centerButtonGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFB84D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
})
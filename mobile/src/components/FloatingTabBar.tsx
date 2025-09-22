import React, { useRef } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
} from 'react-native'
import { BlurView } from 'expo-blur'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Minimal icons
const HomeIcon = ({ color = '#8E8E93', focused = false }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
      stroke={color}
      strokeWidth={focused ? "2.5" : "1.5"}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const GalleryIcon = ({ color = '#8E8E93', focused = false }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2"
      stroke={color}
      strokeWidth={focused ? "2.5" : "1.5"}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
    <Path
      d="M21 15l-5-5L5 21"
      stroke={color}
      strokeWidth={focused ? "2.5" : "1.5"}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const SettingsIcon = ({ color = '#8E8E93', focused = false }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12"
      cy="12"
      r="3"
      stroke={color}
      strokeWidth={focused ? "2.5" : "1.5"}
    />
    <Path
      d="M12 1v6m0 6v6m11-7h-6m-6 0H1"
      stroke={color}
      strokeWidth={focused ? "2.5" : "1.5"}
      strokeLinecap="round"
    />
  </Svg>
)

interface TabBarProps {
  state: any
  descriptors: any
  navigation: any
}

export default function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets()
  const scaleAnims = useRef(state.routes.map(() => new Animated.Value(1))).current

  const handlePress = (route: any, index: number, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    })

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name)
    }

    // Subtle press animation
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[index], {
        toValue: 1,
        friction: 9,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const getIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? '#D4AF37' : '#8E8E93'

    switch (routeName) {
      case 'Dashboard':
        return <HomeIcon color={color} focused={isFocused} />
      case 'Gallery':
        return <GalleryIcon color={color} focused={isFocused} />
      case 'Settings':
        return <SettingsIcon color={color} focused={isFocused} />
      default:
        return <HomeIcon color={color} focused={isFocused} />
    }
  }

  const getLabel = (routeName: string) => {
    switch (routeName) {
      case 'Dashboard':
        return 'Home'
      case 'Gallery':
        return 'Gallery'
      case 'Settings':
        return 'Settings'
      default:
        return routeName
    }
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <BlurView intensity={60} tint="light" style={styles.tabBar}>
        <View style={styles.tabBarContent}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index
            const { options } = descriptors[route.key]

            return (
              <Animated.View
                key={route.key}
                style={[
                  styles.tab,
                  { transform: [{ scale: scaleAnims[index] }] }
                ]}
              >
                <TouchableOpacity
                  style={styles.tabTouchable}
                  onPress={() => handlePress(route, index, isFocused)}
                  activeOpacity={0.7}
                >
                  {getIcon(route.name, isFocused)}
                  <Text style={[
                    styles.tabLabel,
                    isFocused ? styles.tabLabelActive : styles.tabLabelInactive
                  ]}>
                    {getLabel(route.name)}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )
          })}
        </View>
      </BlurView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBar: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  tabBarContent: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    color: '#D4AF37',
  },
  tabLabelInactive: {
    color: '#8E8E93',
  },
})
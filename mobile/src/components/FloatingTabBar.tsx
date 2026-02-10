import React, { useRef } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native'
import CachedImage from './CachedImage'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const starLogo = require('../../assets/luster-white-logo.png')

// Minimal icons
const HomeIcon = ({ color = '#8E8E93', focused = false }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
      stroke={color}
      strokeWidth={focused ? "2.5" : "1.5"}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)


const SettingsIcon = ({ color = '#8E8E93', focused = false }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15a3 3 0 100-6 3 3 0 000 6z"
      stroke={color}
      strokeWidth={focused ? "2" : "1.5"}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
      stroke={color}
      strokeWidth={focused ? "2" : "1.5"}
      strokeLinecap="round"
      strokeLinejoin="round"
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
  const shineAnim = useRef(new Animated.Value(0)).current
  const enhanceShineAnim = useRef(new Animated.Value(-1)).current

  React.useEffect(() => {
    // Shine animation for enhance button on load
    setTimeout(() => {
      Animated.timing(enhanceShineAnim, {
        toValue: 2,
        duration: 1500,
        useNativeDriver: true,
      }).start()
    }, 600)
  }, [])

  const handlePress = (route: any, index: number, isFocused: boolean) => {
    // Special handling for Enhance button (middle button)
    if (route.name === 'Gallery') {
      // Navigate to NewListing screen for enhancement
      navigation.navigate('NewListing')

      // Animate the star
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
      return
    }

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
      case 'Gallery':  // This is handled separately as the enhance button
        return null  // The enhance button has its own rendering
      case 'Settings':
        return <SettingsIcon color={color} focused={isFocused} />
      default:
        return <HomeIcon color={color} focused={isFocused} />
    }
  }


  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Enhance button rendered outside and above the tab bar */}
      {state.routes.map((route: any, index: number) => {
        if (route.name === 'Gallery') {
          return (
            <Animated.View
              key={`enhance-${route.key}`}
              style={[
                styles.enhanceButtonContainer,
                { transform: [{ scale: scaleAnims[index] }] }
              ]}
            >
              <TouchableOpacity
                style={styles.enhanceCircleButton}
                onPress={() => handlePress(route, index, false)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#D4AF37', '#F4E4C1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.enhanceCircleGradient}
                >
                  <CachedImage
                    source={starLogo}
                    style={styles.enhanceLogo}
                    contentFit="contain"
                    placeholderColor="transparent"
                  />
                  {/* Shine overlay animation */}
                  <Animated.View
                    style={[
                      styles.enhanceShineOverlay,
                      {
                        transform: [{
                          translateX: enhanceShineAnim.interpolate({
                            inputRange: [-1, 2],
                            outputRange: [-70, 70],
                          })
                        }]
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={[
                        'transparent',
                        'rgba(255, 255, 255, 0.3)',
                        'rgba(255, 255, 255, 0.5)',
                        'rgba(255, 255, 255, 0.3)',
                        'transparent'
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.shineGradient}
                    />
                  </Animated.View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )
        }
        return null
      })}

      <View style={styles.tabBar}>
        <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={styles.tabBarContent}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index
            const { options } = descriptors[route.key]

            const isEnhance = route.name === 'Gallery'

            return (
              <Animated.View
                key={route.key}
                style={[
                  styles.tab,
                  !isEnhance && { transform: [{ scale: scaleAnims[index] }] }
                ]}
              >
                {isEnhance ? (
                  // Empty space for the enhance button
                  <View style={styles.enhancePlaceholder} />
                ) : (
                  <TouchableOpacity
                    style={styles.tabTouchable}
                    onPress={() => handlePress(route, index, isFocused)}
                    activeOpacity={0.7}
                  >
                    {getIcon(route.name, isFocused)}
                  </TouchableOpacity>
                )}
              </Animated.View>
            )
          })}
        </View>
      </View>
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
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(248, 248, 248, 0.75)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  enhanceButtonContainer: {
    position: 'absolute',
    bottom: 55,  // Position higher above the tab bar
    left: '50%',
    marginLeft: -35,  // Half of button width (70/2)
    zIndex: 10,
  },
  enhancePlaceholder: {
    width: 70,
    height: 40,
  },
  tabBarContent: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  // Enhance Circle Button Styles
  enhanceCircleButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
  },
  enhanceCircleGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  enhanceLogo: {
    width: 34,
    height: 34,
  },
  enhanceShineOverlay: {
    position: 'absolute',
    top: -10,
    left: 0,
    width: 30,
    height: 90,
    borderRadius: 35,
    overflow: 'hidden',
  },
  shineGradient: {
    width: 30,
    height: 90,
    transform: [{ rotate: '25deg' }],
  },
})
import React, { useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'
import { BlurView } from 'expo-blur'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../navigation/RootNavigator'

const starLogo = require('../../assets/star-logo.png')
const textLogo = require('../../assets/text-logo.png')

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

type NavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>()
  
  // Refined animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const buttonScale = useRef(new Animated.Value(1)).current
  const gradientAnim = useRef(new Animated.Value(0)).current
  const shimmerAnim = useRef(new Animated.Value(0)).current
  const blobAnim = useRef(new Animated.Value(0)).current
  const buttonShineAnim = useRef(new Animated.Value(0)).current
  
  // Particle animations
  const particle1Y = useRef(new Animated.Value(screenHeight)).current
  const particle1X = useRef(new Animated.Value(0)).current
  const particle2Y = useRef(new Animated.Value(screenHeight)).current
  const particle2X = useRef(new Animated.Value(0)).current
  const particle3Y = useRef(new Animated.Value(screenHeight)).current
  const particle3X = useRef(new Animated.Value(0)).current
  
  useEffect(() => {
    // Simple fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start()
    
    // Button shine effect on load
    setTimeout(() => {
      Animated.timing(buttonShineAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }).start()
    }, 1000)
    
    // Soft blob animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(blobAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: false,
        }),
        Animated.timing(blobAnim, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: false,
        }),
      ])
    ).start()
    
    // Shimmer effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start()
    
    // Floating particles
    const animateParticle = (yAnim: Animated.Value, xAnim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(yAnim, {
              toValue: -100,
              duration: 8000,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(xAnim, {
                toValue: 30,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(xAnim, {
                toValue: -30,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(xAnim, {
                toValue: 30,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(xAnim, {
                toValue: 0,
                duration: 2000,
                useNativeDriver: true,
              }),
            ])
          ]),
          Animated.timing(yAnim, {
            toValue: screenHeight,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(xAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start()
    }
    
    animateParticle(particle1Y, particle1X, 0)
    animateParticle(particle2Y, particle2X, 2000)
    animateParticle(particle3Y, particle3X, 4000)
    
    // Gradient animation
    Animated.loop(
      Animated.timing(gradientAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: false,
      })
    ).start()
  }, [])
  
  const handleButtonPressIn = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start()
  }, [])
  
  const handleButtonPressOut = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 1,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start()
  }, [])

  return (
    <View style={styles.container}>
      {/* Soft Pastel Gradient Mesh Background */}
      <Animated.View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={['#FFF5F7', '#F7F0FF', '#F0F8FF', '#FFF8F0']}
          locations={[0, 0.3, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      
      {/* Organic Blob Shapes */}
      <Animated.View 
        style={[
          styles.blobContainer1,
          {
            transform: [
              {
                translateY: blobAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 30],
                }),
              },
              {
                translateX: blobAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 182, 193, 0.3)', 'rgba(255, 218, 185, 0.2)', 'transparent']}
          style={styles.blob}
        />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.blobContainer2,
          {
            transform: [
              {
                translateY: blobAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -25],
                }),
              },
              {
                translateX: blobAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 15],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(230, 190, 255, 0.3)', 'rgba(190, 220, 255, 0.2)', 'transparent']}
          style={styles.blob}
        />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.blobContainer3,
          {
            transform: [
              {
                translateY: blobAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 20],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(180, 230, 255, 0.25)', 'rgba(255, 230, 180, 0.15)', 'transparent']}
          style={styles.blob}
        />
      </Animated.View>
      
      
      {/* Floating Particles */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.particle,
          {
            left: screenWidth * 0.2,
            transform: [
              { translateY: particle1Y },
              { translateX: particle1X },
            ],
            opacity: particle1Y.interpolate({
              inputRange: [-100, screenHeight * 0.3, screenHeight],
              outputRange: [0, 0.8, 0],
            }),
          },
        ]}
      >
        <View style={styles.particleInner} />
      </Animated.View>
      
      <Animated.View
        pointerEvents="none"
        style={[
          styles.particle,
          {
            left: screenWidth * 0.7,
            transform: [
              { translateY: particle2Y },
              { translateX: particle2X },
            ],
            opacity: particle2Y.interpolate({
              inputRange: [-100, screenHeight * 0.3, screenHeight],
              outputRange: [0, 0.6, 0],
            }),
          },
        ]}
      >
        <View style={styles.particleInner} />
      </Animated.View>
      
      <Animated.View
        pointerEvents="none"
        style={[
          styles.particle,
          {
            left: screenWidth * 0.5,
            transform: [
              { translateY: particle3Y },
              { translateX: particle3X },
            ],
            opacity: particle3Y.interpolate({
              inputRange: [-100, screenHeight * 0.3, screenHeight],
              outputRange: [0, 0.7, 0],
            }),
          },
        ]}
      >
        <View style={styles.particleInner} />
      </Animated.View>
      
      <SafeAreaView style={styles.safeArea}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Refined Logo Section */}
          <View style={styles.logoSection}>
            <Animated.View 
              style={[
                styles.logoContainer,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              {/* Soft Glass Card */}
              <View style={styles.logoGlass}>
                <BlurView 
                  intensity={30} 
                  tint="light"
                  style={styles.logoBlur}
                >
                  <View style={styles.logoContent}>
                    <Image
                      source={starLogo}
                      style={styles.starLogo}
                      contentFit="contain"
                    />
                  </View>
                </BlurView>
              </View>
              
              {/* Brand Name with Shimmer */}
              <Animated.View
                style={[
                  styles.brandContainer,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { 
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        })
                      },
                    ],
                  },
                ]}
              >
                <Animated.View
                  style={{
                    opacity: shimmerAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.8, 1, 0.8],
                    }),
                  }}
                >
                  <Image
                    source={textLogo}
                    style={styles.textLogo}
                    contentFit="contain"
                  />
                </Animated.View>
                <Animated.Text 
                  style={[
                    styles.tagline,
                    {
                      opacity: shimmerAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.6, 1, 0.6],
                      }),
                    },
                  ]}
                >
                  Enhance your property listings
                </Animated.Text>
              </Animated.View>
            </Animated.View>
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Refined Actions Section */}
          <View style={styles.actionsSection}>
            {/* Primary CTA with Shine Effect */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => navigation.navigate('Auth')}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
              >
                <View style={styles.buttonContainer}>
                  <LinearGradient
                    colors={['#D4AF37', '#F4E4C1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryGradient}
                  >
                    <Text style={styles.primaryButtonText}>Get Started</Text>
                    <View style={styles.arrowCircle}>
                      <Text style={styles.arrowIcon}>→</Text>
                    </View>
                  </LinearGradient>
                  
                  {/* Shine effect */}
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.buttonShine,
                      {
                        opacity: buttonShineAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 1, 0],
                        }),
                        transform: [
                          {
                            translateX: buttonShineAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-150, 400],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={[
                        'transparent',
                        'rgba(255, 255, 255, 0.1)',
                        'rgba(255, 255, 255, 0.3)',
                        'rgba(255, 255, 255, 0.1)',
                        'transparent'
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.shineGradient}
                    />
                  </Animated.View>
                </View>
              </Pressable>
            </Animated.View>
            
            {/* Secondary Action - Minimal */}
            <Pressable
              onPress={() => navigation.navigate('Auth')}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}
            >
              <Text style={styles.secondaryText}>Already have an account?</Text>
              <Text style={styles.secondaryLink}>Sign In</Text>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  
  // Subtle Mesh Gradient
  meshGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Organic Blob Shapes
  blobContainer1: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 400,
    height: 400,
  },
  blobContainer2: {
    position: 'absolute',
    bottom: -150,
    right: -150,
    width: 450,
    height: 450,
  },
  blobContainer3: {
    position: 'absolute',
    top: '30%',
    right: -100,
    width: 300,
    height: 300,
  },
  blob: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  
  // Floating Particles
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
  },
  particleInner: {
    width: '100%',
    height: '100%',
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },
  
  // Logo Section - Refined
  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoGlass: {
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 8,
  },
  logoBlur: {
    borderRadius: 32,
    overflow: 'hidden',
  },
  logoContent: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 32,
  },
  starLogo: {
    width: 100,
    height: 100,
    tintColor: '#D4AF37',
  },
  textLogo: {
    width: 180,
    height: 45,
    marginTop: 4,
    tintColor: '#B8860B',
  },
  brandContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  tagline: {
    fontSize: 15,
    fontWeight: '400',
    color: '#9B9B9B',
    marginTop: 12,
    letterSpacing: 0.1,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  spacer: {
    flex: 0.2,
  },
  
  // Actions Section - Apple Style
  actionsSection: {
    paddingBottom: 50,
    paddingHorizontal: 24,
    gap: 16,
  },
  
  // Primary Button - Refined
  primaryButton: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  buttonShine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 100,
    transform: [{ skewX: '-20deg' }],
  },
  shineGradient: {
    flex: 1,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 1,
  },
  
  // Secondary Button - Minimal
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonPressed: {
    opacity: 0.6,
  },
  secondaryText: {
    fontSize: 15,
    color: '#6B6B6B',
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  secondaryLink: {
    fontSize: 15,
    color: '#D4AF37',
    fontWeight: '600',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
})
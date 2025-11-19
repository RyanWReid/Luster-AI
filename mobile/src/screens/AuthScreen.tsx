import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native'

const isIOS = Platform.OS === 'ios'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Path } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'

// Back arrow icon component
const BackArrowIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M12 19l-7-7 7-7"
      stroke="#B8860B"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// Google 'G' icon
const GoogleIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
)

// Facebook 'f' icon
const FacebookIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="white">
    <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </Svg>
)

// Apple logo icon
const AppleIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="white">
    <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </Svg>
)

type LoadingState = {
  google: boolean
  facebook: boolean
  apple: boolean
}

export default function AuthScreen() {
  const navigation = useNavigation()
  const { signInWithGoogle, signInWithApple, signInWithFacebook, bypassLogin } = useAuth()
  const [loading, setLoading] = useState<LoadingState>({
    google: false,
    facebook: false,
    apple: false,
  })

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideUpAnim = useRef(new Animated.Value(50)).current
  const blob1Anim = useRef(new Animated.Value(0)).current
  const blob2Anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()

    // Start blob animations
    const startBlobAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blob1Anim, {
            toValue: 1,
            duration: 15000,
            useNativeDriver: true,
          }),
          Animated.timing(blob1Anim, {
            toValue: 0,
            duration: 15000,
            useNativeDriver: true,
          }),
        ])
      ).start()

      Animated.loop(
        Animated.sequence([
          Animated.timing(blob2Anim, {
            toValue: 1,
            duration: 20000,
            useNativeDriver: true,
          }),
          Animated.timing(blob2Anim, {
            toValue: 0,
            duration: 20000,
            useNativeDriver: true,
          }),
        ])
      ).start()
    }
    startBlobAnimation()
  }, [])

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    setLoading({ ...loading, [provider]: true })

    try {
      // Use actual OAuth methods
      switch (provider) {
        case 'google':
          await signInWithGoogle()
          break
        case 'apple':
          await signInWithApple()
          break
        case 'facebook':
          await signInWithFacebook()
          break
      }
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
      // For development: fall back to bypass login if OAuth fails
      if (__DEV__) {
        console.log('OAuth failed in dev, using bypass login')
        bypassLogin()
      }
    } finally {
      setLoading({ ...loading, [provider]: false })
    }
  }

  const handlePrivacyPolicy = () => {
    // TODO: Add actual privacy policy URL
    Alert.alert('Privacy Policy', 'Privacy policy will be available soon.')
  }

  const handleTermsOfService = () => {
    // TODO: Add actual terms of service URL
    Alert.alert('Terms of Service', 'Terms of service will be available soon.')
  }

  return (
    <View style={styles.container}>
      {/* Gradient Mesh Background */}
      <LinearGradient
        colors={['#FFF5F7', '#F7F0FF', '#F0F8FF', '#FFF8F0']}
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated Gradient Blobs */}
      <Animated.View
        style={[
          styles.gradientBlob1,
          {
            transform: [
              {
                translateX: blob1Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 50],
                }),
              },
              {
                translateY: blob1Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 100],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 239, 193, 0.1)']}
          style={styles.gradientBlobInner}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.gradientBlob2,
          {
            transform: [
              {
                translateX: blob2Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, -50],
                }),
              },
              {
                translateY: blob2Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -80],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(184, 134, 11, 0.15)', 'rgba(255, 223, 186, 0.1)']}
          style={styles.gradientBlobInner}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        {/* Back Arrow */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BlurView intensity={20} style={styles.backButtonBlur}>
            <BackArrowIcon />
          </BlurView>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to Luster</Text>
            <Text style={styles.subtitle}>
              Sign in to start enhancing your real estate photos
            </Text>
          </View>

          {/* Social Login Buttons */}
          <View style={styles.buttonContainer}>
            {/* Apple Sign In - iOS Only (App Store requirement) */}
            {isIOS && (
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('apple')}
                disabled={loading.apple}
              >
                <LinearGradient
                  colors={['#000000', '#1a1a1a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.appleButtonGradient}
                >
                  {loading.apple ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <AppleIcon />
                      <Text style={styles.appleButtonText}>Continue with Apple</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Google Sign In */}
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('google')}
              disabled={loading.google}
            >
              <BlurView intensity={30} style={styles.googleButtonBlur}>
                {loading.google ? (
                  <ActivityIndicator color="#1F2937" size="small" />
                ) : (
                  <>
                    <GoogleIcon />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </BlurView>
            </TouchableOpacity>

            {/* Facebook Sign In */}
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('facebook')}
              disabled={loading.facebook}
            >
              <LinearGradient
                colors={['#1877F2', '#0C63D4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.facebookButtonGradient}
              >
                {loading.facebook ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <FacebookIcon />
                    <Text style={styles.facebookButtonText}>Continue with Facebook</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Legal Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our{' '}
            </Text>
            <View style={styles.legalLinks}>
              <TouchableOpacity onPress={handleTermsOfService}>
                <Text style={styles.legalLink}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.footerText}> and </Text>
              <TouchableOpacity onPress={handlePrivacyPolicy}>
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  gradientBlob1: {
    position: 'absolute',
    top: '10%',
    left: '-10%',
    width: 300,
    height: 300,
  },
  gradientBlob2: {
    position: 'absolute',
    bottom: '20%',
    right: '-15%',
    width: 350,
    height: 350,
  },
  gradientBlobInner: {
    width: '100%',
    height: '100%',
    borderRadius: 150,
    transform: [{ scale: 1.5 }],
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  backButtonBlur: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 120,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  subtitle: {
    fontSize: 17,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  socialButton: {
    width: '100%',
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  appleButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  appleButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  googleButtonBlur: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  googleButtonText: {
    color: '#1F2937',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  facebookButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  facebookButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legalLink: {
    fontSize: 13,
    color: '#B8860B',
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
})

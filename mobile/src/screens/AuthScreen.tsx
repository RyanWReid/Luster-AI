import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg'
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

// Eye icon component for password visibility toggle
const EyeIcon = ({ visible }: { visible: boolean }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    {visible ? (
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : (
      <>
        <Path
          d="m1 1 22 22"
          stroke="#9CA3AF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M6.71 6.71C4.76 8.04 3.15 10.13 2 12.79c1.42 2.74 4 5.5 8 6.21m-1.6-1.6c1.36.09 2.75-.09 4.1-.5 1.41-.42 2.73-1.18 3.77-2.18C17.24 13.94 18.76 12.79 20 12.79c-1.15-2.47-2.61-4.48-4.08-5.99m-1.6-1.6C12.91 4.69 11.36 4.21 9.6 4.21 5.6 4.21 3.02 6.97 1.6 9.71"
          stroke="#9CA3AF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    )}
    {visible && (
      <Path
        d="M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </Svg>
)

// Google 'G' icon
const GoogleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
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
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
    <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </Svg>
)

// Apple logo icon
const AppleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
    <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </Svg>
)

export default function AuthScreen() {
  const navigation = useNavigation()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signInWithEmail, bypassLogin } = useAuth()

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideUpAnim = useRef(new Animated.Value(50)).current
  const buttonShineAnim = useRef(new Animated.Value(0)).current
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

    // Button shine effect on load
    setTimeout(() => {
      Animated.timing(buttonShineAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start()
    }, 1200)
  }, [])

  const handleRegister = async () => {
    // TEMPORARY: Bypass authentication for testing
    bypassLogin()

    // Original authentication code (commented out for testing):
    // if (!fullName || !email || !password || !confirmPassword || !agreedToTerms) {
    //   return
    // }
    // if (password !== confirmPassword) {
    //   return
    // }
    // setLoading(true)
    // await signInWithEmail(email)
    // setLoading(false)
  }

  const handleSocialLogin = (provider: string) => {
    console.log(`Login with ${provider}`)
  }

  const handlePrivacyPolicy = () => {
    console.log('Privacy Policy clicked')
  }

  const handleUserAgreement = () => {
    console.log('User Agreement clicked')
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

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
                <Text style={styles.title}>Get started now!</Text>
                <Text style={styles.subtitle}>
                  Create an account or login to explore Luster.
                </Text>
              </View>

              {/* Glassmorphic Card */}
              <BlurView intensity={30} style={styles.glassCard}>
                <View style={styles.form}>
                  {/* Full Name */}
                  <View style={styles.inputWrapper}>
                    <BlurView intensity={15} style={styles.inputBlur}>
                      <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="#9CA3AF"
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </BlurView>
                  </View>

                  {/* Email */}
                  <View style={styles.inputWrapper}>
                    <BlurView intensity={15} style={styles.inputBlur}>
                      <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#9CA3AF"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </BlurView>
                  </View>

                  {/* Password */}
                  <View style={styles.inputWrapper}>
                    <BlurView intensity={15} style={styles.inputBlur}>
                      <View style={styles.passwordContainer}>
                        <TextInput
                          style={styles.passwordInput}
                          placeholder="Password"
                          placeholderTextColor="#9CA3AF"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        <TouchableOpacity
                          style={styles.eyeButton}
                          onPress={() => setShowPassword(!showPassword)}
                        >
                          <EyeIcon visible={showPassword} />
                        </TouchableOpacity>
                      </View>
                    </BlurView>
                  </View>

                  {/* Confirm Password */}
                  <View style={styles.inputWrapper}>
                    <BlurView intensity={15} style={styles.inputBlur}>
                      <View style={styles.passwordContainer}>
                        <TextInput
                          style={styles.passwordInput}
                          placeholder="Confirm Password"
                          placeholderTextColor="#9CA3AF"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        <TouchableOpacity
                          style={styles.eyeButton}
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <EyeIcon visible={showConfirmPassword} />
                        </TouchableOpacity>
                      </View>
                    </BlurView>
                  </View>

                  {/* Terms & Conditions */}
                  <View style={styles.termsContainer}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => setAgreedToTerms(!agreedToTerms)}
                    >
                      <View style={[styles.checkboxBox, agreedToTerms && styles.checkboxChecked]}>
                        {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                    <Text style={styles.termsText}>
                      I agree{' '}
                      <Text style={styles.termsLink} onPress={handlePrivacyPolicy}>
                        Privacy Policy
                      </Text>{' '}
                      and{' '}
                      <Text style={styles.termsLink} onPress={handleUserAgreement}>
                        User Agreement
                      </Text>
                    </Text>
                  </View>

                  {/* Register Button */}
                  <TouchableOpacity
                    style={[styles.registerButton, loading && styles.buttonDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['#D4AF37', '#B8860B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.registerButtonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text style={styles.registerButtonText}>Register my account →</Text>
                      )}
                      {/* Shine effect */}
                      <Animated.View
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
                      />
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>Or register with</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Social Login Buttons */}
                  <View style={styles.socialContainer}>
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => handleSocialLogin('Google')}
                    >
                      <BlurView intensity={20} style={styles.socialButtonBlur}>
                        <GoogleIcon />
                      </BlurView>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.socialButton]}
                      onPress={() => handleSocialLogin('Facebook')}
                    >
                      <BlurView intensity={20} style={[styles.socialButtonBlur, styles.facebookButton]}>
                        <FacebookIcon />
                      </BlurView>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.socialButton]}
                      onPress={() => handleSocialLogin('Apple')}
                    >
                      <BlurView intensity={20} style={[styles.socialButtonBlur, styles.appleButton]}>
                        <AppleIcon />
                      </BlurView>
                    </TouchableOpacity>
                  </View>

                  {/* Login Link */}
                  <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
                      <Text style={styles.loginLink}>Login</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </BlurView>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  content: {
    flex: 1,
    paddingTop: 10,
  },
  glassCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  header: {
    marginBottom: 24,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  subtitle: {
    fontSize: 17,
    color: '#6B7280',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  form: {
    width: '100%',
    padding: 20,
  },
  inputWrapper: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 12,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    height: 50,
    color: '#1F2937',
    backgroundColor: 'transparent',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 50,
    fontSize: 16,
    height: 50,
    color: '#1F2937',
    backgroundColor: 'transparent',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    flex: 1,
  },
  termsLink: {
    color: '#B8860B',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  registerButton: {
    borderRadius: 25,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  buttonShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    transform: [{ skewX: '-20deg' }],
    width: 100,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialButtonBlur: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  facebookButton: {
    backgroundColor: 'rgba(24, 119, 242, 0.8)',
  },
  appleButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 14,
    color: '#B8860B',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
})
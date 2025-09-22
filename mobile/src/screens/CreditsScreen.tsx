import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
  Platform,
  StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Path, Circle } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

// Icons
const CloseIcon = ({ color = '#4B5563' }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const StarIcon = ({ color = '#D4AF37' }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill={color}
    />
  </Svg>
)

const CameraIcon = ({ color = '#D4AF37' }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
  </Svg>
)

const SparklesIcon = ({ color = '#D4AF37' }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L13.09 8.26L19 7L13.45 10.82L16 17L12 13.5L8 17L10.55 10.82L5 7L10.91 8.26L12 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const RadioButton = ({ selected }: { selected: boolean }) => (
  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
    {selected && <View style={styles.radioInner} />}
  </View>
)

interface PlanOption {
  id: string
  name: string
  price: string
  badge?: string
  period: string
  yearlyPrice?: number
  monthlyEquivalent?: string
  photos: number
}

const plans: PlanOption[] = [
  {
    id: 'plus',
    name: 'Plus',
    price: '$19.99',
    period: 'month',
    monthlyEquivalent: '$19.99/mo',
    photos: 30,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$383.90',
    period: 'year',
    badge: 'BEST VALUE',
    yearlyPrice: 383.90,
    monthlyEquivalent: '$31.99/mo',
    photos: 80,
  },
  {
    id: 'max',
    name: 'Max',
    price: '$84.99',
    period: 'month',
    monthlyEquivalent: '$84.99/mo',
    photos: 200,
  },
]

export default function CreditsScreen() {
  const navigation = useNavigation()
  const [selectedPlan, setSelectedPlan] = useState<string>('pro')

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const backgroundAnim = useRef(new Animated.Value(0)).current
  const blobAnim = useRef(new Animated.Value(0)).current

  // Particle animations
  const particle1Y = useRef(new Animated.Value(screenHeight)).current
  const particle1X = useRef(new Animated.Value(0)).current
  const particle2Y = useRef(new Animated.Value(screenHeight)).current
  const particle2X = useRef(new Animated.Value(0)).current
  const particle3Y = useRef(new Animated.Value(screenHeight)).current
  const particle3X = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Main content animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(backgroundAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start()

    // Blob animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(blobAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(blobAnim, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: true,
        }),
      ])
    ).start()

    // Particle animations
    const createParticleAnimation = (yAnim: Animated.Value, xAnim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(yAnim, {
              toValue: -100,
              duration: 12000,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(xAnim, {
                toValue: 20,
                duration: 3000,
                useNativeDriver: true,
              }),
              Animated.timing(xAnim, {
                toValue: -20,
                duration: 3000,
                useNativeDriver: true,
              }),
              Animated.timing(xAnim, {
                toValue: 20,
                duration: 3000,
                useNativeDriver: true,
              }),
              Animated.timing(xAnim, {
                toValue: 0,
                duration: 3000,
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.timing(yAnim, {
            toValue: screenHeight,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start()
    }

    createParticleAnimation(particle1Y, particle1X, 0)
    createParticleAnimation(particle2Y, particle2X, 4000)
    createParticleAnimation(particle3Y, particle3X, 8000)
  }, [])

  const handleStartTrial = () => {
    const selected = plans.find(p => p.id === selectedPlan)
    Alert.alert(
      'Start Your Free Trial',
      `7 days free, then ${selected?.monthlyEquivalent}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Trial',
          onPress: () => {
            Alert.alert('Welcome!', 'Your 7-day free trial has started.')
            navigation.goBack()
          },
        },
      ]
    )
  }

  return (
    <View style={styles.container}>
      {/* Animated Background Gradient - Same as Welcome Screen */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: backgroundAnim }]}>
        <LinearGradient
          colors={['#FFF5F7', '#F7F0FF', '#F0F8FF', '#FFF8F0']}
          locations={[0, 0.3, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Organic Blob Shapes - Same as Welcome Screen */}
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

      {/* Floating Particles - Same as Welcome Screen */}
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

      {/* Content */}
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <BlurView intensity={20} tint="light" style={styles.closeButtonBlur}>
                <CloseIcon />
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* Title with gold accent */}
          <Text style={styles.title}>Unlock Premium</Text>
          <Text style={styles.subtitle}>Transform your property listings with AI</Text>

          {/* Features with gold icons */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <CameraIcon />
              </View>
              <Text style={styles.featureText}>Unlimited photo enhancements</Text>
            </View>

            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <StarIcon />
              </View>
              <Text style={styles.featureText}>Premium AI processing</Text>
            </View>

            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <SparklesIcon />
              </View>
              <Text style={styles.featureText}>All enhancement styles</Text>
            </View>
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Plan Options with glassmorphism */}
          <View style={styles.plansContainer}>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.7}
              >
                <BlurView
                  intensity={selectedPlan === plan.id ? 60 : 40}
                  tint="light"
                  style={[
                    styles.planOption,
                    selectedPlan === plan.id && styles.planOptionSelected,
                  ]}
                >
                  {plan.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{plan.badge}</Text>
                    </View>
                  )}

                  <View style={styles.planContent}>
                    <RadioButton selected={selectedPlan === plan.id} />

                    <View style={styles.planDetails}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planPhotos}>{plan.photos} photos/month</Text>
                      {plan.yearlyPrice && (
                        <Text style={styles.planSubtext}>
                          Billed annually
                        </Text>
                      )}
                    </View>

                    <View style={styles.priceContainer}>
                      <Text style={styles.planPrice}>{plan.price}</Text>
                      <Text style={styles.planPeriod}>/{plan.period}</Text>
                    </View>
                  </View>
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>

          {/* Trial Info */}
          <Text style={styles.trialInfo}>
            Try 7 days for free • Cancel anytime
          </Text>

          {/* CTA Button with exact welcome screen gradient */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleStartTrial}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#D4AF37', '#F4E4C1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Start Free Trial</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Footer Links */}
          <View style={styles.footer}>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.footerLink}>Restore Purchases</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>•</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.footerLink}>Terms & Privacy</Text>
            </TouchableOpacity>
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

  // Blob containers - Same as Welcome Screen
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

  // Floating Particles - Same as Welcome Screen
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

  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 8,
  },
  closeButton: {
    width: 44,
    height: 44,
  },
  closeButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212,175,55,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 17,
    color: '#374151',
    flex: 1,
  },
  plansContainer: {
    marginBottom: 16,
    gap: 12,
  },
  planOption: {
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  planOptionSelected: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 16,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  radioOuterSelected: {
    borderColor: '#D4AF37',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D4AF37',
  },
  planDetails: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  planPhotos: {
    fontSize: 14,
    color: '#6B7280',
  },
  planSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  planPeriod: {
    fontSize: 14,
    color: '#6B7280',
  },
  trialInfo: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  ctaButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 8,
    gap: 12,
  },
  footerLink: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  footerDot: {
    fontSize: 14,
    color: '#D1D5DB',
  },
})
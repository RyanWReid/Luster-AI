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
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Path, Circle } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { PurchasesPackage } from 'react-native-purchases'
import hapticFeedback from '../utils/haptics'
import { useRevenueCat } from '../hooks/useRevenueCat'

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

const CoinStackIcon = ({ color = '#D4AF37' }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="6" r="5" stroke={color} strokeWidth="2" />
    <Path
      d="M7 9v4c0 2.76 2.24 5 5 5s5-2.24 5-5V9"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Path
      d="M7 13v4c0 2.76 2.24 5 5 5s5-2.24 5-5v-4"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
)

const InfinityIcon = ({ color = '#D4AF37' }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18.178 8.667c-1.473 0-2.667 1.194-2.667 2.667s1.194 2.667 2.667 2.667c1.473 0 2.667-1.194 2.667-2.667s-1.194-2.667-2.667-2.667zm0 0c-1.473 0-2.667 1.194-2.667 2.667s1.194 2.667 2.667 2.667m-12.356 0c1.473 0 2.667-1.194 2.667-2.667S7.295 8.667 5.822 8.667c-1.473 0-2.667 1.194-2.667 2.667s1.194 2.667 2.667 2.667zm0 0c1.473 0 2.667-1.194 2.667-2.667S7.295 8.667 5.822 8.667m6.178 2.667c0-1.105.895-2 2-2s2 .895 2 2-.895 2-2 2-2-.895-2-2z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const ChevronIcon = ({ rotation = 0, color = '#6B7280' }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={{ transform: [{ rotate: `${rotation}deg` }] }}>
    <Path
      d="M6 9l6 6 6-6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

interface PlanOption {
  id: string
  name: string
  price: string
  badge?: string
  period: string
  photos: number
  perPhotoPrice: string
}

interface CreditBundle {
  id: string
  name: string
  photos: number
  price: number
  pricePerPhoto: number
  discount?: string
  badge?: string
}

const plans: PlanOption[] = [
  {
    id: 'pro',
    name: 'Pro',
    price: '$40',
    period: 'month',
    badge: 'MOST POPULAR',
    photos: 45,
    perPhotoPrice: '$0.89',
  },
]

const creditBundles: CreditBundle[] = [
  {
    id: 'small',
    name: 'Small',
    photos: 5,
    price: 6.25,
    pricePerPhoto: 1.25,
  },
  {
    id: 'medium',
    name: 'Medium',
    photos: 15,
    price: 15,
    pricePerPhoto: 1.00,
    badge: 'BEST VALUE',
  },
  {
    id: 'large',
    name: 'Large',
    photos: 30,
    price: 25.50,
    pricePerPhoto: 0.85,
  },
]

export default function CreditsScreen() {
  const navigation = useNavigation()
  const [selectedPlan, setSelectedPlan] = useState<string>('pro')
  const [showBundles, setShowBundles] = useState<boolean>(false)
  const [selectedBundle, setSelectedBundle] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(0)
  const flatListRef = useRef<FlatList>(null)

  // RevenueCat integration
  const { offerings, loading, hasActiveSubscription, purchasePackage, restorePurchases } = useRevenueCat()

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const backgroundAnim = useRef(new Animated.Value(0)).current
  const blobAnim = useRef(new Animated.Value(0)).current
  const bundleExpandAnim = useRef(new Animated.Value(0)).current
  const chevronRotation = useRef(new Animated.Value(0)).current

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

  const toggleBundles = () => {
    hapticFeedback.light()
    const toValue = showBundles ? 0 : 1
    setShowBundles(!showBundles)

    Animated.parallel([
      Animated.spring(bundleExpandAnim, {
        toValue,
        friction: 10,
        tension: 50,
        useNativeDriver: false,
      }),
      Animated.timing(chevronRotation, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
  }

  // Helper to find RevenueCat package by identifier
  const findPackage = (identifier: string): PurchasesPackage | null => {
    if (!offerings) return null

    // TODO(human): Map your bundle IDs to RevenueCat package identifiers
    // These should match the product IDs you set up in App Store Connect and RevenueCat
    // Example: 'small' -> 'com.lusterai.credits.small'
    const packageMap: Record<string, string> = {
      'trial': 'com.lusterai.trial',
      'pro': 'com.lusterai.pro.monthly',
      'small': 'com.lusterai.credits.small',
      'medium': 'com.lusterai.credits.medium',
      'large': 'com.lusterai.credits.large',
    }

    const productId = packageMap[identifier]
    if (!productId) return null

    return offerings.availablePackages.find(pkg =>
      pkg.product.identifier === productId
    ) || null
  }

  const handleBundlePurchase = async (bundle: CreditBundle) => {
    hapticFeedback.medium()

    // Find the RevenueCat package
    const pkg = findPackage(bundle.id)

    if (!pkg) {
      Alert.alert(
        'Error',
        'This product is not available yet. Please try again later.',
        [{ text: 'OK', onPress: () => hapticFeedback.light() }]
      )
      return
    }

    // Show confirmation
    Alert.alert(
      'Purchase Credits',
      `${bundle.photos} photos for ${pkg.product.priceString}${bundle.discount ? ` (Save ${bundle.discount})` : ''}`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => hapticFeedback.light() },
        {
          text: 'Buy Now',
          onPress: async () => {
            const success = await purchasePackage(pkg)
            if (success) {
              // Navigate back after successful purchase
              setTimeout(() => navigation.goBack(), 1500)
            }
          },
        },
      ]
    )
  }

  const handleStartTrial = async () => {
    hapticFeedback.medium()

    // Find the appropriate package
    const pkg = findPackage(selectedPlan)

    if (!pkg) {
      Alert.alert(
        'Error',
        'This subscription is not available yet. Please try again later.',
        [{ text: 'OK', onPress: () => hapticFeedback.light() }]
      )
      return
    }

    const selected = plans.find(p => p.id === selectedPlan)

    Alert.alert(
      selectedPlan === 'trial' ? 'Start Your Trial' : 'Subscribe to Pro',
      `${pkg.product.priceString}${selectedPlan === 'pro' ? ' per month' : ' for 3 days'}`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => hapticFeedback.light() },
        {
          text: selectedPlan === 'trial' ? 'Start Trial' : 'Subscribe',
          onPress: async () => {
            const success = await purchasePackage(pkg)
            if (success) {
              // Navigate back after successful purchase
              setTimeout(() => navigation.goBack(), 1500)
            }
          },
        },
      ]
    )
  }

  const handleRestorePurchases = async () => {
    const success = await restorePurchases()
    if (success) {
      // Optionally navigate back after restore
      setTimeout(() => navigation.goBack(), 1500)
    }
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

      {/* Loading indicator while RevenueCat initializes */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Loading payment options...</Text>
        </View>
      )}

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              hapticFeedback.light()
              navigation.goBack()
            }}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <BlurView intensity={20} tint="light" style={styles.closeButtonBlur}>
              <CloseIcon />
            </BlurView>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={[0, 1]}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const page = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
            setCurrentPage(page)
          }}
          keyExtractor={(item) => item.toString()}
          renderItem={({ item }) => (
            <Animated.View
              style={[
                styles.pageContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {item === 0 ? (
                  // Page 1: Subscription & Trial
                  <>
                    {/* Title */}
                    <Text style={styles.title}>Unlock Premium</Text>

                    {/* Checkmark Features List */}
                    <View style={styles.checkmarkFeatures}>
                      <View style={styles.checkmarkRow}>
                        <View style={styles.checkmarkCircle}>
                          <Text style={styles.checkmark}>✓</Text>
                        </View>
                        <Text style={styles.checkmarkText}>45 photos per month</Text>
                      </View>
                      <View style={styles.checkmarkRow}>
                        <View style={styles.checkmarkCircle}>
                          <Text style={styles.checkmark}>✓</Text>
                        </View>
                        <Text style={styles.checkmarkText}>Premium AI enhancements</Text>
                      </View>
                      <View style={styles.checkmarkRow}>
                        <View style={styles.checkmarkCircle}>
                          <Text style={styles.checkmark}>✓</Text>
                        </View>
                        <Text style={styles.checkmarkText}>All enhancement styles</Text>
                      </View>
                    </View>

                    {/* Pricing Cards Side by Side */}
                    <View style={styles.pricingRow}>
                      {/* Trial Card */}
                      <TouchableOpacity
                        style={[styles.pricingCard, selectedPlan === 'trial' && styles.pricingCardSelected]}
                        onPress={() => {
                          hapticFeedback.selection()
                          setSelectedPlan('trial')
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.pricingLabel}>Trial</Text>
                        <Text style={styles.pricingPrice}>$3.99</Text>
                        <Text style={styles.pricingPeriod}>3 days</Text>
                      </TouchableOpacity>

                      {/* Pro Card */}
                      <TouchableOpacity
                        style={[styles.pricingCard, selectedPlan === 'pro' && styles.pricingCardSelected]}
                        onPress={() => {
                          hapticFeedback.selection()
                          setSelectedPlan('pro')
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.bestDealBadge}>
                          <Text style={styles.bestDealText}>Best Deal</Text>
                        </View>
                        <Text style={styles.pricingLabel}>Pro</Text>
                        <Text style={styles.pricingPrice}>$40</Text>
                        <Text style={styles.pricingPeriod}>per month</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Trial Info Text */}
                    <Text style={styles.trialInfoText}>
                      10 photos included • 3 days for $3.99 • Cancel anytime
                    </Text>

                    {/* CTA Button */}
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
                        <Text style={styles.ctaText}>
                          {selectedPlan === 'trial' ? 'Start Trial' : 'Subscribe to Pro'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                ) : (
                  // Page 2: Credit Bundles
                  <>
                    <Text style={styles.title}>Credit Bundles</Text>
                    <Text style={styles.subtitle}>Pay as you go with flexible credit packs</Text>

                    {/* Bundle Cards */}
                    <View style={styles.bundlesColumn}>
                      {creditBundles.map((bundle) => (
                        <TouchableOpacity
                          key={bundle.id}
                          onPress={() => handleBundlePurchase(bundle)}
                          activeOpacity={0.8}
                          style={styles.bundleCardFull}
                        >
                          <View style={styles.bundleCardFullContent}>
                            {bundle.badge && (
                              <View style={styles.bundleBadgeFull}>
                                <Text style={styles.bundleBadgeTextFull}>{bundle.badge}</Text>
                              </View>
                            )}
                            <View style={styles.bundleInfoRow}>
                              <View>
                                <Text style={styles.bundleNameFull}>{bundle.name}</Text>
                                <Text style={styles.bundlePhotosFull}>{bundle.photos} photos</Text>
                              </View>
                              <View style={styles.bundlePriceContainer}>
                                <Text style={styles.bundlePriceFull}>${bundle.price.toFixed(2)}</Text>
                                <Text style={styles.bundlePricePerPhotoFull}>${bundle.pricePerPhoto.toFixed(2)}/photo</Text>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* CTA Button for Bundles */}
                    <TouchableOpacity
                      style={styles.ctaButton}
                      onPress={() => selectedBundle && handleBundlePurchase(creditBundles.find(b => b.id === selectedBundle)!)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#D4AF37', '#F4E4C1']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.ctaGradient}
                      >
                        <Text style={styles.ctaText}>Purchase Credits</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}

                {/* Footer Links */}
                <View style={styles.footer}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleRestorePurchases}
                    disabled={loading}
                  >
                    <Text style={styles.footerLink}>Restore Purchases</Text>
                  </TouchableOpacity>
                  <Text style={styles.footerDot}>•</Text>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.footerLink}>Terms & Privacy</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          )}
        />

        {/* Page Indicator Dots */}
        <View style={styles.pageIndicator}>
          {[0, 1].map((page) => (
            <View
              key={page}
              style={[
                styles.pageDot,
                currentPage === page && styles.pageDotActive,
              ]}
            />
          ))}
        </View>
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
  pageContainer: {
    width: screenWidth,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  animatedContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 20,
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
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 40,
    marginTop: 20,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  // Checkmark Features
  checkmarkFeatures: {
    marginBottom: 48,
    alignItems: 'flex-start',
    paddingHorizontal: 40,
  },
  checkmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkmarkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  checkmarkText: {
    fontSize: 17,
    color: '#111827',
    fontWeight: '400',
  },
  // Pricing Cards Row
  pricingRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  pricingCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    position: 'relative',
  },
  pricingCardSelected: {
    borderColor: '#D4AF37',
    backgroundColor: '#FFFFFF',
  },
  bestDealBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  bestDealText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  pricingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  pricingPrice: {
    fontSize: 40,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -1.5,
  },
  pricingPeriod: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  trialInfoText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    marginBottom: 32,
    gap: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  featureSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  plansContainer: {
    marginBottom: 20,
    gap: 16,
  },
  planOptionOuter: {
    borderRadius: 24,
    padding: 2,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  planGradientBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  planOption: {
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.85)',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  planContent: {
    padding: 24,
    paddingTop: 28,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  planName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#D4AF37',
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  planDetailsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderRadius: 16,
    padding: 20,
  },
  planStat: {
    flex: 1,
    alignItems: 'center',
  },
  planStatNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  planStatLabel: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  planDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(212,175,55,0.2)',
    marginHorizontal: 16,
  },
  // Token Card Styles
  tokenCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  tokenSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  tokenPriceContainer: {
    alignItems: 'flex-end',
  },
  tokenPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
  },
  tokenPriceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  // Expand Button Styles
  expandButton: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  expandButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.1)',
    gap: 8,
  },
  expandButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Bundle Grid Styles
  bundlesGridContainer: {
    overflow: 'hidden',
  },
  bundlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  bundleCardWrapper: {
    width: '48%',
  },
  bundleCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.75)',
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
    minHeight: 160,
    justifyContent: 'space-between',
  },
  bundleBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1,
  },
  bundleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  discountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  bundleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  bundlePhotos: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -1,
  },
  bundlePhotosLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  bundlePriceRow: {
    alignItems: 'center',
    gap: 4,
  },
  bundlePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
  },
  bundlePricePerPhoto: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  trialInfo: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaButton: {
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 24,
    marginHorizontal: 20,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaGradient: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 19,
    fontWeight: '700',
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
  // Compact Layout Styles
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  featureIconCompact: {
    alignItems: 'center',
    gap: 8,
  },
  featureIconLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  planContentCompact: {
    padding: 20,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planNameCompact: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  planDescCompact: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceContainerCompact: {
    alignItems: 'flex-end',
  },
  planPriceCompact: {
    fontSize: 28,
    fontWeight: '800',
    color: '#D4AF37',
  },
  planPeriodCompact: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  // Section Title
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  // Trial Card Styles
  trialContainer: {
    marginTop: 16,
  },
  trialCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },
  trialContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trialTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  trialDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  trialPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#D4AF37',
  },
  // Bundle Container
  bundlesRowContainer: {
    marginTop: 20,
  },
  bundlesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  bundleCardCompact: {
    flex: 1,
  },
  bundleCardCompactBlur: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },
  bundleBadgeCompact: {
    position: 'absolute',
    top: -6,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bundleBadgeTextCompact: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bundlePhotosCompact: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -1,
  },
  bundlePhotosLabelCompact: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  bundlePriceCompact: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 4,
  },
  bundlePricePerPhoto: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  tokenInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  // Page Indicator
  pageIndicator: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
  },
  pageDotActive: {
    backgroundColor: '#D4AF37',
    width: 24,
  },
  // Bundle Cards for Page 2
  bundlesColumn: {
    gap: 12,
    marginBottom: 32,
  },
  bundleCardFull: {
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  bundleCardFullContent: {
    padding: 20,
    position: 'relative',
  },
  bundleBadgeFull: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    zIndex: 10,
  },
  bundleBadgeTextFull: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bundleInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bundleNameFull: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  bundlePhotosFull: {
    fontSize: 14,
    color: '#6B7280',
  },
  bundlePriceContainer: {
    alignItems: 'flex-end',
  },
  bundlePriceFull: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 2,
  },
  bundlePricePerPhotoFull: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
})
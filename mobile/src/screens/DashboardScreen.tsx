import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native'
import CachedImage from '../components/CachedImage'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { useListings } from '../context/ListingsContext'
import { useAuth } from '../context/AuthContext'
import hapticFeedback from '../utils/haptics'

const { width, height } = Dimensions.get('window')

// Default property image
const defaultPropertyImage = require('../../assets/photo.png')
const lusterLogoWhite = require('../../assets/luster-white-logo.png')

// Modern coin icon
const CoinIcon = ({ size = 20, color = '#D4AF37' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <Text style={{
      position: 'absolute',
      left: size/2 - 4,
      top: size/2 - 8,
      fontSize: 14,
      fontWeight: '700',
      color: color
    }}>C</Text>
  </Svg>
)


// Star icon
const StarIcon = ({ size = 16, color = '#D4AF37' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2l2.582 7.953h8.364l-6.764 4.914 2.582 7.953L12 17.906 5.236 22.82l2.582-7.953L1.054 9.953h8.364L12 2z" />
  </Svg>
)


// Trending icon
const TrendingIcon = ({ size = 20, color = '#666' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 6l-9.5 9.5-5-5L1 18"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17 6h6v6"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// Mock properties data
const mockProperties = [
  {
    id: '1',
    address: '1234 King Boulevard',
    price: '$550,000',
    beds: 5,
    baths: 4,
    squareFeet: '2,850',
    image: defaultPropertyImage,
    status: 'Enhanced',
    date: '2 hours ago',
  },
  {
    id: '2',
    address: '789 Queen Street',
    price: '$425,000',
    beds: 3,
    baths: 2,
    squareFeet: '1,650',
    image: defaultPropertyImage,
    status: 'Processing',
    date: '5 hours ago',
  },
  {
    id: '3',
    address: '456 Park Avenue',
    price: '$750,000',
    beds: 4,
    baths: 3,
    squareFeet: '3,200',
    image: defaultPropertyImage,
    status: 'Enhanced',
    date: 'Yesterday',
  },
  {
    id: '4',
    address: '321 Maple Drive',
    price: '$680,000',
    beds: 4,
    baths: 3.5,
    squareFeet: '2,950',
    image: defaultPropertyImage,
    status: 'Enhanced',
    date: '3 days ago',
  },
]

export default function DashboardScreenNew() {
  const navigation = useNavigation()
  const { listings, isLoading: isLoadingListings, clearListings, syncFromBackend } = useListings()
  const { credits, refreshCredits } = useAuth()
  const showMockData = false // Toggle this to true to show mock data cards
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Sync listings and credits from backend on mount
  useEffect(() => {
    console.log('🏠 DashboardScreenNew mounted - syncing data from backend')
    syncFromBackend()
    refreshCredits()
  }, [])

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    console.log('🔄 Pull-to-refresh triggered')
    setIsRefreshing(true)
    hapticFeedback.light()
    try {
      await Promise.all([syncFromBackend(), refreshCredits()])
    } finally {
      setIsRefreshing(false)
    }
  }

  // Use real listings if available, otherwise use mock data
  const displayData = listings.length > 0 ? listings : (showMockData ? mockProperties : [])

  // Calculate real counts
  const propertyCount = listings.length
  const totalPhotoCount = listings.reduce((total, listing) => {
    const imageCount = listing.images?.length || 0
    return total + imageCount
  }, 0)

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Projects?',
      'This will permanently delete all projects and their photos. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            clearListings()
            hapticFeedback.notification('success')
          },
        },
      ]
    )
  }

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current
  const blobAnim = useRef(new Animated.Value(0)).current

  // Staggered animations
  const headerAnim = useRef(new Animated.Value(0)).current
  const statsAnim = useRef(new Animated.Value(0)).current
  const stat1Anim = useRef(new Animated.Value(0)).current
  const stat2Anim = useRef(new Animated.Value(0)).current
  const sectionAnim = useRef(new Animated.Value(0)).current
  const creditPulse = useRef(new Animated.Value(1)).current

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  useEffect(() => {
    // Staggered entrance animations
    const animations = [
      // Header first
      Animated.parallel([
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(fadeAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]

    Animated.stagger(80, animations).start()

    // Stats cards staggered
    setTimeout(() => {
      Animated.spring(stat1Anim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }).start()
    }, 200)

    setTimeout(() => {
      Animated.spring(stat2Anim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }).start()
    }, 280)

    // Section title
    setTimeout(() => {
      Animated.spring(sectionAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start()
    }, 350)

    // Subtle credit button pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(creditPulse, {
          toValue: 1.03,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(creditPulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start()

    // Soft blob animation for background
    Animated.loop(
      Animated.sequence([
        Animated.timing(blobAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        }),
        Animated.timing(blobAnim, {
          toValue: 0,
          duration: 10000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  const handleEnhancePhoto = () => {
    navigation.navigate('NewListing' as never)
  }

  const handleCreditsPress = () => {
    navigation.navigate('Credits' as never)
  }

  const handlePropertyPress = (item: any) => {
    // Navigate based on property status
    if (item.status === 'failed') {
      // Property failed - show error and offer to retry or delete
      Alert.alert(
        'Enhancement Failed',
        item.error || 'An unknown error occurred during enhancement.',
        [
          { text: 'OK', style: 'cancel' },
        ]
      )
    } else if (item.status === 'processing') {
      // Property is still processing - go to ProcessingScreen
      navigation.navigate('Processing' as never, {
        propertyId: item.id,
        photos: item.originalImages?.map((img: any) => img.uri) || [],
        photoCount: item.originalImages?.length || 0,
      } as never)
    } else if (item.status === 'ready') {
      // Processing done, ready to save - go to ResultScreen
      navigation.navigate('Result' as never, {
        propertyId: item.id,
        enhancedPhotos: item.images?.map((img: any) => img.uri) || [],
        originalPhotos: item.originalImages?.map((img: any) => img.uri) || [],
      } as never)
    } else {
      // Completed - go to Project gallery
      navigation.navigate('Project' as never, { property: item } as never)
    }
  }


  const AnimatedCard = ({ item, index }: { item: any; index: number }) => {
    const cardScale = useRef(new Animated.Value(1)).current
    const cardEntrance = useRef(new Animated.Value(0)).current
    const spinAnim = useRef(new Animated.Value(0)).current
    const pulseAnim = useRef(new Animated.Value(1)).current
    const glowAnim = useRef(new Animated.Value(0)).current

    // Staggered card entrance
    useEffect(() => {
      const delay = 400 + (index * 80)
      setTimeout(() => {
        Animated.spring(cardEntrance, {
          toValue: 1,
          friction: 7,
          tension: 50,
          useNativeDriver: true,
        }).start()
      }, delay)
    }, [index])

    useEffect(() => {
      if (item.status === 'processing') {
        // Spinning loader animation
        Animated.loop(
          Animated.timing(spinAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ).start()
      } else if (item.status === 'ready') {
        // Pulsing checkmark animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.15,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start()

        // Glowing border animation (using opacity for native driver support)
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start()
      }
    }, [item.status])

    const spin = spinAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    })

    const glowOpacity = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    })

    const handlePressIn = () => {
      Animated.spring(cardScale, {
        toValue: 0.97,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start()
    }

    const handlePressOut = () => {
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start()
    }

    const isProcessing = item.status === 'processing'
    const isReady = item.status === 'ready'
    const isFailed = item.status === 'failed'

    return (
      <Animated.View
        style={[
          styles.gridCard,
          isReady && styles.gridCardReady,
          isFailed && styles.gridCardFailed,
          {
            opacity: cardEntrance,
            transform: [
              { scale: Animated.multiply(cardScale, cardEntrance.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] })) },
              { translateY: cardEntrance.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
            ],
          },
        ]}
      >
        {/* Glowing border effect for ready state */}
        {isReady && (
          <Animated.View
            style={[
              styles.glowBorder,
              {
                opacity: glowOpacity,
              },
            ]}
          />
        )}
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => handlePropertyPress(item)}
        >
          <View style={styles.cardImageContainer}>
            <CachedImage
              source={item.image}
              style={styles.gridImage}
            />

            {/* Processing State Overlay */}
            {isProcessing && (
              <BlurView intensity={80} tint="light" style={styles.processingOverlay}>
                <View style={styles.spinnerContainer}>
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Svg width={64} height={64} viewBox="0 0 64 64">
                      <Circle
                        cx="32"
                        cy="32"
                        r="26"
                        stroke="#6B7280"
                        strokeWidth="4.5"
                        fill="none"
                        strokeDasharray="130, 32"
                        strokeLinecap="round"
                      />
                    </Svg>
                  </Animated.View>
                </View>
              </BlurView>
            )}

            {/* Ready State: Full card blur with centered checkmark */}
            {isReady && (
              <BlurView intensity={80} tint="light" style={styles.readyOverlay}>
                {/* Circle background for checkmark */}
                <Animated.View
                  style={[
                    styles.checkmarkCircle,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                >
                  <Svg width={52} height={52} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M20 6L9 17l-5-5"
                      stroke="#4A90E2"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </Animated.View>
              </BlurView>
            )}

            {/* Failed State: Red tint with X icon */}
            {isFailed && (
              <View style={styles.failedOverlay}>
                <View style={styles.failedBadge}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={styles.failedText}>Failed</Text>
                </View>
              </View>
            )}
          </View>
          {/* Bottom text overlay (only show when NOT ready, NOT processing, NOT failed) */}
          {!isReady && !isProcessing && !isFailed && (
            <BlurView intensity={60} tint="light" style={styles.gridOverlay}>
              <Text style={styles.gridAddress} numberOfLines={2}>
                {item.address}
              </Text>
            </BlurView>
          )}
        </TouchableOpacity>
      </Animated.View>
    )
  }


  return (
    <View style={styles.container}>
      {/* Iridescent gradient mesh background */}
      <Animated.View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={['#FFF5F7', '#F7F0FF', '#F0F8FF', '#FFF8F0']}
          locations={[0, 0.3, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Organic blob animations */}
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
          colors={['rgba(255, 182, 193, 0.15)', 'rgba(255, 218, 185, 0.1)', 'transparent']}
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
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(230, 190, 255, 0.15)', 'rgba(190, 220, 255, 0.1)', 'transparent']}
          style={styles.blob}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#D4AF37"
              colors={['#D4AF37']}
            />
          }
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: headerAnim,
                transform: [{
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              },
            ]}
          >
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.title}>Your Properties</Text>
            </View>

            <Animated.View style={[styles.headerRight, { transform: [{ scale: creditPulse }] }]}>
              <TouchableOpacity
                onPress={handleCreditsPress}
                style={styles.creditButton}
                activeOpacity={0.7}
              >
                <BlurView intensity={60} tint="light" style={styles.creditBlur}>
                  <CoinIcon size={18} />
                  <Text style={styles.creditText}>{credits}</Text>
                </BlurView>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <Animated.View
              style={[
                styles.statCardWrapper,
                {
                  opacity: stat1Anim,
                  transform: [
                    { translateY: stat1Anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                    { scale: stat1Anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                  ],
                },
              ]}
            >
              <BlurView intensity={60} tint="light" style={styles.statCard}>
                <Text style={styles.statNumber}>{propertyCount}</Text>
                <Text style={styles.statLabel}>Properties</Text>
              </BlurView>
            </Animated.View>

            <Animated.View
              style={[
                styles.statCardWrapper,
                {
                  opacity: stat2Anim,
                  transform: [
                    { translateY: stat2Anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                    { scale: stat2Anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                  ],
                },
              ]}
            >
              <BlurView intensity={60} tint="light" style={styles.statCard}>
                <Text style={styles.statNumber}>{totalPhotoCount}</Text>
                <Text style={styles.statLabel}>Photos</Text>
              </BlurView>
            </Animated.View>
          </View>


          {/* Recent Properties - Always show */}
          <Animated.View
            style={[
              styles.propertiesSection,
              {
                opacity: sectionAnim,
                transform: [{
                  translateY: sectionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [15, 0],
                  }),
                }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <TouchableOpacity
                activeOpacity={1}
                onLongPress={handleClearAll}
                delayLongPress={1000}
              >
                <Text style={styles.sectionTitle}>Recent Properties</Text>
              </TouchableOpacity>
              {displayData.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('AllProperties' as never)}
                >
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              )}
            </View>

            {displayData.length > 0 ? (
              <FlatList
                data={displayData.slice(0, 6)}
                renderItem={({ item, index }) => <AnimatedCard item={item} index={index} />}
                keyExtractor={(item) => item.id}
                horizontal={false}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.propertyRow}
                contentContainerStyle={styles.propertyGrid}
              />
            ) : (
              <BlurView intensity={40} tint="light" style={styles.emptyStateCard}>
                <View style={styles.emptyStateLogoContainer}>
                  <CachedImage
                    source={lusterLogoWhite}
                    style={styles.emptyStateLogo}
                    contentFit="contain"
                  />
                </View>
                <Text style={styles.emptyStateText}>
                  Get started by pressing{' '}
                  <View style={styles.emptyStateLogoInlineContainer}>
                    <CachedImage source={lusterLogoWhite} style={styles.emptyStateLogoInline} contentFit="contain" />
                  </View>
                </Text>
              </BlurView>
            )}
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Bottom Fade Gradient */}
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.95)', 'rgba(255,255,255,1)']}
          locations={[0, 0.3, 0.7, 1]}
          style={styles.bottomFadeGradient}
          pointerEvents="none"
        />
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  // Organic Blobs
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
  blob: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  creditButton: {
    // Removed extra styling
  },
  creditBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    gap: 6,
  },
  creditText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  // Stats Section
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  statChange: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
  },
  // Properties Section
  propertiesSection: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 15,
    color: '#D4AF37',
    fontWeight: '500',
  },
  propertyGrid: {
    gap: 12,
  },
  propertyRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  // Grid Card
  gridCard: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageContainer: {
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: 140,
  },
  iridescenOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    paddingHorizontal: 14,
    paddingBottom: 14,
    justifyContent: 'flex-end',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  gridOverlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Processing State
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  // Ready State
  gridCardReady: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#A0C4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  // Failed State
  gridCardFailed: {
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  failedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  failedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  failedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'rgba(160, 196, 255, 0.6)',
    pointerEvents: 'none',
  },
  readyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 240, 255, 0.25)',
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A0C4FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(160, 196, 255, 0.4)',
  },
  gridPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.3,
  },
  gridAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  // Empty State
  emptyStateCard: {
    padding: 48,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    overflow: 'hidden',
  },
  emptyStateLogoContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
  emptyStateLogo: {
    width: 40,
    height: 40,
    opacity: 1,
  },
  emptyStateLogoInlineContainer: {
    width: 20,
    height: 20,
    backgroundColor: '#D1D5DB',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
    marginHorizontal: 4,
  },
  emptyStateLogoInline: {
    width: 16,
    height: 16,
    opacity: 1,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Action Icons Row (unused but kept for future)
  actionIconsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  actionIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  bottomSpacer: {
    height: 100,
  },
  bottomFadeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
})
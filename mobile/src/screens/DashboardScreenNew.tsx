import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { useListings } from '../context/ListingsContext'
import { usePhotos } from '../context/PhotoContext'
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
  const { listings, isLoading: isLoadingListings, clearListings } = useListings()
  const { creditBalance, isLoadingCredits } = usePhotos()
  const showMockData = false // Toggle this to true to show mock data cards

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

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()

    // Soft blob animation for background
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
  }, [])

  const handleEnhancePhoto = () => {
    navigation.navigate('NewListing' as never)
  }

  const handleCreditsPress = () => {
    navigation.navigate('Credits' as never)
  }

  const handlePropertyPress = (item: any) => {
    // Navigate based on property status
    if (item.status === 'processing') {
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
    const spinAnim = useRef(new Animated.Value(0)).current
    const pulseAnim = useRef(new Animated.Value(1)).current
    const glowAnim = useRef(new Animated.Value(0)).current

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

    return (
      <Animated.View
        style={[
          styles.gridCard,
          isReady && styles.gridCardReady,
          {
            transform: [{ scale: cardScale }],
            opacity: fadeAnim,
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
            <Image
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
          </View>
          {/* Bottom text overlay (only show when NOT ready and NOT processing) */}
          {!isReady && !isProcessing && (
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
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View>
              <Text style={styles.greeting}>Good afternoon</Text>
              <Text style={styles.title}>Your Properties</Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={handleCreditsPress}
                style={styles.creditButton}
                activeOpacity={0.7}
              >
                <BlurView intensity={60} tint="light" style={styles.creditBlur}>
                  <CoinIcon size={18} />
                  <Text style={styles.creditText}>{creditBalance || 10}</Text>
                </BlurView>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Stats Cards */}
          <Animated.View
            style={[
              styles.statsContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <BlurView intensity={60} tint="light" style={styles.statCard}>
              <Text style={styles.statNumber}>{propertyCount}</Text>
              <Text style={styles.statLabel}>Properties</Text>
            </BlurView>

            <BlurView intensity={60} tint="light" style={styles.statCard}>
              <Text style={styles.statNumber}>{totalPhotoCount}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </BlurView>

            <BlurView intensity={60} tint="light" style={styles.statCard}>
              <Text style={styles.statNumber}>{creditBalance || 0}</Text>
              <Text style={styles.statLabel}>Credits</Text>
            </BlurView>
          </Animated.View>


          {/* Recent Properties - Always show */}
          <Animated.View
            style={[
              styles.propertiesSection,
              {
                opacity: fadeAnim,
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
                data={displayData.slice(0, 4)}
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
                  <Image
                    source={lusterLogoWhite}
                    style={styles.emptyStateLogo}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.emptyStateText}>
                  Get started by pressing{' '}
                  <View style={styles.emptyStateLogoInlineContainer}>
                    <Image source={lusterLogoWhite} style={styles.emptyStateLogoInline} resizeMode="contain" />
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
  statCard: {
    flex: 1,
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
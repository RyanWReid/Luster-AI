import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Alert,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Path } from 'react-native-svg'
import { usePhotos } from '../context/PhotoContext'
import { useListings } from '../context/ListingsContext'
import enhancementService from '../services/enhancementService'
import hapticFeedback from '../utils/haptics'

const { width } = Dimensions.get('window')

// Back icon
const BackIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke="#111827"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// Bouncing Dots Component
interface BouncingDotsProps {
  bounce1: Animated.Value
  bounce2: Animated.Value
  bounce3: Animated.Value
}

const BouncingDots = ({ bounce1, bounce2, bounce3 }: BouncingDotsProps) => (
  <View style={styles.dotsContainer}>
    <Animated.View
      style={[
        styles.dot,
        {
          transform: [{ translateY: bounce1 }],
        },
      ]}
    />
    <Animated.View
      style={[
        styles.dot,
        {
          transform: [{ translateY: bounce2 }],
        },
      ]}
    />
    <Animated.View
      style={[
        styles.dot,
        {
          transform: [{ translateY: bounce3 }],
        },
      ]}
    />
  </View>
)

export default function ProcessingScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { selectedPhotos, setEnhancedPhotos } = usePhotos()
  const { addListing } = useListings()
  const firstImage = selectedPhotos[0] || null

  // Get parameters from previous screen
  const params = route.params as any
  const style = params?.style || 'luster'
  const photos = params?.photos || selectedPhotos
  const photoCount = params?.photoCount || photos.length

  // State for tracking progress
  const [processedCount, setProcessedCount] = useState(0)
  const [currentStatus, setCurrentStatus] = useState('Analyzing your photos...')
  const [enhancedUrls, setEnhancedUrls] = useState<string[]>([])
  const [canDismiss, setCanDismiss] = useState(false)

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current
  const bounce1 = useRef(new Animated.Value(0)).current
  const bounce2 = useRef(new Animated.Value(0)).current
  const bounce3 = useRef(new Animated.Value(0)).current
  const blobAnim = useRef(new Animated.Value(0)).current
  const shimmerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Haptic feedback on start
    hapticFeedback.light()

    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()

    // Background blob animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(blobAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(blobAnim, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start()

    // Bouncing dots animations
    const createBounce = (animValue: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: -12,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start()
    }

    createBounce(bounce1, 0)
    createBounce(bounce2, 150)
    createBounce(bounce3, 300)

    // Shimmer effect for image
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  useEffect(() => {
    async function processImages() {
      try {
        setCurrentStatus('Preparing your photos...')
        await new Promise((resolve) => setTimeout(resolve, 500))

        const results: string[] = []

        for (let i = 0; i < photos.length; i++) {
          setCurrentStatus(`Enhancing photo ${i + 1} of ${photos.length}...`)
          setProcessedCount(i + 1)

          // Allow dismissing after first photo starts
          if (i === 0) {
            setCanDismiss(true)
          }

          const result = await enhancementService.enhanceImage({
            imageUrl: photos[i],
            style: style as any,
          })
          results.push(result)
        }

        // Success haptic
        hapticFeedback.notification('success')

        setEnhancedUrls(results)
        if (setEnhancedPhotos) {
          setEnhancedPhotos(results)
        }

        if (results.length > 0 && results[0]) {
          addListing({
            address: 'New Listing',
            price: '$---,---',
            beds: 0,
            baths: 0,
            image: { uri: results[0] },
            isEnhanced: true,
          })
        }

        // Navigate to results
        navigation.navigate('Result' as never, {
          enhancedPhotos: results,
          originalPhotos: photos,
          style: style,
        })
      } catch (error) {
        console.error('Enhancement failed:', error)
        hapticFeedback.notification('error')
        Alert.alert(
          'Enhancement Failed',
          'There was an error processing your images. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Main' as never),
            },
          ]
        )
      }
    }

    const timer = setTimeout(() => {
      processImages()
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const handleBack = () => {
    if (canDismiss) {
      hapticFeedback.light()
      Alert.alert(
        'Leave Processing?',
        "We'll notify you when your photos are ready. You can check back anytime.",
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Check Back Later',
            onPress: () => navigation.navigate('Main' as never),
          },
        ]
      )
    } else {
      navigation.goBack()
    }
  }

  return (
    <View style={styles.container}>
      {/* Iridescent gradient background */}
      <LinearGradient
        colors={['#FFF5F7', '#F7F0FF', '#F0F8FF', '#FFF8F0']}
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

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
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BlurView intensity={60} tint="light" style={styles.backButtonBlur}>
              <BackIcon />
            </BlurView>
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Enhancing</Text>
            <Text style={styles.headerSubtitle}>
              {processedCount > 0 ? `${processedCount} of ${photoCount}` : `${photoCount} photos`}
            </Text>
          </View>

          <View style={styles.backButton} />
        </Animated.View>

        {/* Main Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Bouncing Dots */}
          <BouncingDots bounce1={bounce1} bounce2={bounce2} bounce3={bounce3} />

          {/* Status Text */}
          <Text style={styles.statusText}>{currentStatus}</Text>

          {/* Photo Count */}
          {processedCount > 0 && (
            <Text style={styles.countText}>
              {processedCount} / {photoCount}
            </Text>
          )}

          {/* Preview Image Card */}
          {firstImage && (
            <BlurView intensity={40} tint="light" style={styles.imageCard}>
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: firstImage }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <Animated.View
                  style={[
                    styles.imageShimmer,
                    {
                      opacity: shimmerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 0],
                      }),
                    },
                  ]}
                />
              </View>
            </BlurView>
          )}

          {/* Info Message */}
          {canDismiss && (
            <Animated.View
              style={[
                styles.infoCard,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <BlurView intensity={60} tint="light" style={styles.infoCardBlur}>
                <Text style={styles.infoTitle}>You can leave anytime</Text>
                <Text style={styles.infoText}>
                  We'll notify you when your photos are ready
                </Text>
              </BlurView>
            </Animated.View>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  backButton: {
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 40,
    height: 40,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D4AF37',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  countText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: -1,
  },
  imageCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imageWrapper: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageShimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  infoCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  infoCardBlur: {
    padding: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
})

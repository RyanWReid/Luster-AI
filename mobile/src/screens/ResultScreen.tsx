import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  FlatList,
  PanResponder,
  Animated,
  Easing,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Path } from 'react-native-svg'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import { usePhotos } from '../context/PhotoContext'
import { useListings } from '../context/ListingsContext'
import hapticFeedback from '../utils/haptics'

const { width, height } = Dimensions.get('window')

// Icons
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

const DownloadIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5m0 0l5-5m-5 5V3"
      stroke="#111827"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const ShareIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8.59 13.51l6.83 3.98m-.01-10.98l-6.82 3.98M21 5a3 3 0 11-6 0 3 3 0 016 0zM9 12a3 3 0 11-6 0 3 3 0 016 0zm12 7a3 3 0 11-6 0 3 3 0 016 0z"
      stroke="#111827"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const RefreshIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 4v6h6M23 20v-6h-6"
      stroke="#111827"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"
      stroke="#111827"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

interface EnhancedImage {
  id: string
  original: any
  enhanced: any
}

export default function ResultScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { selectedPhotos, enhancedPhotos } = usePhotos()
  const { addListing } = useListings()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [containerWidth, setContainerWidth] = useState(width - 48)
  const sliderPosition = useRef(new Animated.Value((width - 48) / 2)).current

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current
  const blobAnim = useRef(new Animated.Value(0)).current

  // Get enhanced photos from navigation params or context
  const params = route.params as any
  const enhancedFromNav = params?.enhancedPhotos || enhancedPhotos || []
  const originalFromNav = params?.originalPhotos || selectedPhotos || []

  // Create enhanced images from selected photos
  const [images] = useState<EnhancedImage[]>(
    [
      {
        id: '1',
        original:
          originalFromNav && originalFromNav.length > 0
            ? { uri: originalFromNav[0] }
            : require('../../assets/welcome.png'),
        enhanced:
          enhancedFromNav[0] && enhancedFromNav[0] !== ''
            ? { uri: enhancedFromNav[0] }
            : { uri: originalFromNav[0] },
      },
      ...originalFromNav.slice(1).map((photo: string, index: number) => ({
        id: `${index + 2}`,
        original: { uri: photo },
        enhanced:
          enhancedFromNav[index + 1] && enhancedFromNav[index + 1] !== ''
            ? { uri: enhancedFromNav[index + 1] }
            : require('../../assets/photo.png'),
      })),
    ].filter((img) => img)
  )

  useEffect(() => {
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

    // Reset slider to center when image changes
    Animated.spring(sliderPosition, {
      toValue: containerWidth / 2,
      friction: 8,
      useNativeDriver: false,
    }).start()
  }, [currentIndex, containerWidth])

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5
      },
      onPanResponderGrant: () => {
        hapticFeedback.selection()
      },
      onPanResponderMove: (evt, gestureState) => {
        const newPosition = Math.max(0, Math.min(containerWidth, gestureState.moveX - 24))
        sliderPosition.setValue(newPosition)
      },
      onPanResponderRelease: () => {
        hapticFeedback.light()
      },
    })
  ).current

  const handleBack = () => {
    hapticFeedback.light()
    navigation.goBack()
  }

  const handleDownload = async () => {
    hapticFeedback.medium()
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status === 'granted') {
        console.log('Downloading image...')
        hapticFeedback.notification('success')
      }
    } catch (error) {
      console.error('Error downloading image:', error)
      hapticFeedback.notification('error')
    }
  }

  const handleShare = async () => {
    hapticFeedback.medium()
    try {
      if (await Sharing.isAvailableAsync()) {
        console.log('Sharing image...')
      }
    } catch (error) {
      console.error('Error sharing image:', error)
    }
  }

  const handleRegenerate = () => {
    hapticFeedback.medium()
    Alert.alert(
      'Regenerate Photos?',
      'This will use additional credits to re-process your photos.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          onPress: () => navigation.navigate('Processing' as never),
        },
      ]
    )
  }

  const handleSaveAll = async () => {
    hapticFeedback.medium()

    if (images.length > 0 && enhancedFromNav.length > 0 && enhancedFromNav[0] !== '') {
      const allEnhancedImages = enhancedFromNav
        .filter((url: string) => url && url !== '')
        .map((url: string) => ({ uri: url }))

      const allOriginalImages = originalFromNav.map((url: string) => ({ uri: url }))

      const newListing = {
        address: `${allEnhancedImages.length} Photos Enhanced`,
        price: '$---,---',
        beds: 0,
        baths: 0,
        image: allEnhancedImages[0] || images[0].enhanced,
        images: allEnhancedImages,
        originalImages: allOriginalImages,
        isEnhanced: true,
      }

      addListing(newListing)
      hapticFeedback.notification('success')
    }

    navigation.navigate('Main' as never)
  }

  const renderThumbnail = ({ item, index }: { item: EnhancedImage; index: number }) => (
    <TouchableOpacity
      style={[styles.thumbnail, index === currentIndex && styles.thumbnailActive]}
      onPress={() => {
        hapticFeedback.light()
        setCurrentIndex(index)
      }}
    >
      <Image source={item.enhanced} style={styles.thumbnailImage} />
      {index === currentIndex && (
        <View style={styles.thumbnailBorder}>
          <LinearGradient
            colors={['#D4AF37', '#F59E0B']}
            style={styles.thumbnailGradient}
          />
        </View>
      )}
    </TouchableOpacity>
  )

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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
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
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <BlurView intensity={60} tint="light" style={styles.headerButtonBlur}>
                <BackIcon />
              </BlurView>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Results</Text>

            <TouchableOpacity onPress={handleRegenerate} style={styles.headerButton}>
              <BlurView intensity={60} tint="light" style={styles.headerButtonBlur}>
                <RefreshIcon />
              </BlurView>
            </TouchableOpacity>
          </Animated.View>

          {/* Main Image Viewer with Slider */}
          <Animated.View
            style={[
              styles.imageSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <BlurView intensity={40} tint="light" style={styles.imageCard}>
              <View
                style={styles.imageContainer}
                onLayout={(event) => {
                  const { width } = event.nativeEvent.layout
                  setContainerWidth(width)
                  sliderPosition.setValue(width / 2)
                }}
              >
                {/* Original Image */}
                <Image
                  source={images[currentIndex].original}
                  style={styles.mainImage}
                  resizeMode="cover"
                />

                {/* Enhanced Image with Slider */}
                <Animated.View
                  style={[
                    styles.enhancedImageContainer,
                    {
                      width: sliderPosition,
                    },
                  ]}
                >
                  <Image
                    source={images[currentIndex].enhanced}
                    style={styles.mainImage}
                    resizeMode="cover"
                  />
                </Animated.View>

                {/* Slider Handle */}
                <Animated.View
                  {...panResponder.panHandlers}
                  style={[
                    styles.sliderHandle,
                    {
                      left: sliderPosition,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#D4AF37', '#F59E0B']}
                    style={styles.sliderLine}
                  />
                  <BlurView intensity={80} tint="light" style={styles.sliderCircle}>
                    <Text style={styles.sliderArrows}>{'←  →'}</Text>
                  </BlurView>
                </Animated.View>

                {/* Before/After Labels */}
                <View style={styles.labelContainer}>
                  <BlurView intensity={60} tint="dark" style={styles.labelBlur}>
                    <Text style={styles.labelText}>Before</Text>
                  </BlurView>
                  <BlurView intensity={60} tint="dark" style={styles.labelBlur}>
                    <Text style={styles.labelText}>After</Text>
                  </BlurView>
                </View>
              </View>
            </BlurView>
          </Animated.View>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <Animated.View
              style={[
                styles.thumbnailSection,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <FlatList
                data={images}
                renderItem={renderThumbnail}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailList}
              />
            </Animated.View>
          )}

          {/* Action Buttons */}
          <Animated.View
            style={[
              styles.actionButtons,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <TouchableOpacity onPress={handleDownload} style={styles.actionButton}>
              <BlurView intensity={60} tint="light" style={styles.actionButtonBlur}>
                <DownloadIcon />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
              <BlurView intensity={60} tint="light" style={styles.actionButtonBlur}>
                <ShareIcon />
              </BlurView>
            </TouchableOpacity>
          </Animated.View>

          {/* Save Button */}
          <Animated.View
            style={[
              styles.saveSection,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleSaveAll}
              activeOpacity={0.8}
              style={styles.saveButtonTouchable}
            >
              <LinearGradient
                colors={['#D4AF37', '#B8860B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save to Gallery</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  headerButtonBlur: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  imageSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  imageCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  imageContainer: {
    width: '100%',
    height: 400,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  enhancedImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  sliderHandle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -30 }],
    zIndex: 10,
  },
  sliderLine: {
    position: 'absolute',
    width: 3,
    height: '100%',
  },
  sliderCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },
  sliderArrows: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
  labelContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelBlur: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  thumbnailSection: {
    height: 100,
    marginBottom: 24,
  },
  thumbnailList: {
    paddingHorizontal: 24,
    gap: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailActive: {},
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    padding: 2,
  },
  thumbnailGradient: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  actionButtonBlur: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  saveSection: {
    paddingHorizontal: 24,
  },
  saveButtonTouchable: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
})

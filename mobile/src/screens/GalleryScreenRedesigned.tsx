import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Platform,
  Share,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Path } from 'react-native-svg'
import ImageViewing from 'react-native-image-viewing'
import * as FileSystem from 'expo-file-system'
import * as MediaLibrary from 'expo-media-library'
import hapticFeedback from '../utils/haptics'

const { width } = Dimensions.get('window')
const COLUMN_GAP = 12
const SIDE_PADDING = 16
const CARD_WIDTH = (width - SIDE_PADDING * 2 - COLUMN_GAP) / 2

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

interface GalleryImage {
  id: string
  uri: any
  height: number
}

export default function GalleryScreenRedesigned() {
  const navigation = useNavigation()
  const route = useRoute()

  const [isViewerVisible, setIsViewerVisible] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const blobAnim = useRef(new Animated.Value(0)).current

  const propertyData = (route.params as any)?.property || {}

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(blobAnim, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
        }),
        Animated.timing(blobAnim, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  // Generate masonry layout
  const galleryImages = useMemo<GalleryImage[]>(() => {
    const propertyImages = propertyData?.images || []
    const hasRealImages = propertyImages.length > 0

    if (hasRealImages) {
      return propertyImages.map((image: any, index: number) => ({
        id: `image-${index}`,
        uri: image,
        height: Math.random() * 120 + 180, // Random heights for masonry
      }))
    }

    // Mock images
    const mockImageUri = require('../../assets/photo.png')
    return Array.from({ length: 12 }, (_, i) => ({
      id: `mock-${i}`,
      uri: mockImageUri,
      height: Math.random() * 120 + 180,
    }))
  }, [propertyData?.images])

  // Organize into two columns
  const columns = useMemo(() => {
    const leftColumn: GalleryImage[] = []
    const rightColumn: GalleryImage[] = []
    let leftHeight = 0
    let rightHeight = 0

    galleryImages.forEach((image) => {
      if (leftHeight <= rightHeight) {
        leftColumn.push(image)
        leftHeight += image.height
      } else {
        rightColumn.push(image)
        rightHeight += image.height
      }
    })

    return { leftColumn, rightColumn }
  }, [galleryImages])

  const handleBack = () => {
    hapticFeedback.light()
    navigation.goBack()
  }

  const handleShare = async () => {
    hapticFeedback.medium()
    try {
      await Share.share({
        message: `Check out these ${galleryImages.length} enhanced photos!`,
      })
    } catch (error) {
      console.error('Share error:', error)
    }
  }

  const handleExport = async () => {
    hapticFeedback.medium()

    const { status } = await MediaLibrary.requestPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library access to export images.')
      return
    }

    Alert.alert(
      'Export Photos',
      `Export all ${galleryImages.length} photos to your photo library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            // TODO: Implement actual export logic
            Alert.alert('Success', `${galleryImages.length} photos exported!`)
          },
        },
      ]
    )
  }

  const handleImagePress = (index: number) => {
    hapticFeedback.light()
    setCurrentImageIndex(index)
    setIsViewerVisible(true)
  }

  const renderImageCard = (image: GalleryImage, index: number) => (
    <TouchableOpacity
      key={image.id}
      activeOpacity={0.9}
      onPress={() => handleImagePress(index)}
      style={[styles.imageCard, { height: image.height }]}
    >
      <Image source={image.uri} style={styles.image} resizeMode="cover" />
      {/* Subtle gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.03)']}
        style={StyleSheet.absoluteFillObject}
      />
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

      {/* Organic blob animation */}
      <Animated.View
        style={[
          styles.blobContainer,
          {
            transform: [
              {
                translateY: blobAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 30],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 182, 193, 0.12)', 'rgba(255, 218, 185, 0.08)', 'transparent']}
          style={styles.blob}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <BlurView intensity={60} tint="light" style={styles.headerButtonBlur}>
              <BackIcon />
            </BlurView>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
              <BlurView intensity={60} tint="light" style={styles.headerButtonBlur}>
                <ShareIcon />
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExport} style={styles.headerButton}>
              <BlurView intensity={60} tint="light" style={styles.headerButtonBlur}>
                <DownloadIcon />
              </BlurView>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Masonry Grid */}
        <Animated.ScrollView
          style={[styles.scrollView, { opacity: fadeAnim }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.masonryContainer}>
            {/* Left Column */}
            <View style={styles.column}>
              {columns.leftColumn.map((image, index) =>
                renderImageCard(image, index * 2)
              )}
            </View>

            {/* Right Column */}
            <View style={styles.column}>
              {columns.rightColumn.map((image, index) =>
                renderImageCard(image, index * 2 + 1)
              )}
            </View>
          </View>

          {/* Photo count */}
          <View style={styles.footer}>
            <BlurView intensity={40} tint="light" style={styles.footerBlur}>
              <Text style={styles.footerText}>
                {galleryImages.length} Photo{galleryImages.length !== 1 ? 's' : ''}
              </Text>
            </BlurView>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>

      {/* Image Viewer */}
      <ImageViewing
        images={galleryImages.map((img) => ({ uri: typeof img.uri === 'string' ? img.uri : img.uri }))}
        imageIndex={currentImageIndex}
        visible={isViewerVisible}
        onRequestClose={() => setIsViewerVisible(false)}
      />
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
  blobContainer: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    zIndex: 0,
  },
  blob: {
    width: '100%',
    height: '100%',
    borderRadius: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerButtonBlur: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIDE_PADDING,
    paddingTop: 8,
    paddingBottom: 100,
  },
  masonryContainer: {
    flexDirection: 'row',
    gap: COLUMN_GAP,
  },
  column: {
    flex: 1,
    gap: COLUMN_GAP,
  },
  imageCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerBlur: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.3,
  },
})

import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
  Animated,
  Easing,
  Alert,
  Pressable,
} from 'react-native'
import CachedImage from '../components/CachedImage'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Path, Circle } from 'react-native-svg'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import { usePhotos } from '../context/PhotoContext'
import { useAuth } from '../context/AuthContext'
import { useListings } from '../context/ListingsContext'
import hapticFeedback from '../utils/haptics'
import type { RootStackParamList } from '../types'

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

const CheckIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke="#FFFFFF"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const SelectIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 11l3 3L22 4"
      stroke="#111827"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
      stroke="#111827"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const RefreshIconWhite = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 4v6h6M23 20v-6h-6"
      stroke="#FFFFFF"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"
      stroke="#FFFFFF"
      strokeWidth="2.5"
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
  const { credits } = useAuth()
  const { updateListing } = useListings()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showingOriginal, setShowingOriginal] = useState(false)

  // Selection mode for regeneration
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedForRegen, setSelectedForRegen] = useState<Set<number>>(new Set())

  // Animation for crossfade between images
  const crossfadeAnim = useRef(new Animated.Value(0)).current

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current
  const blobAnim = useRef(new Animated.Value(0)).current

  // Get enhanced photos from navigation params or context
  const params = route.params as RootStackParamList['Result'] | undefined
  const propertyId = params?.propertyId ?? null
  const currentStyle = params?.style ?? 'luster'
  const enhancedFromNav = params?.enhancedPhotos ?? enhancedPhotos ?? []
  const originalFromNav = params?.originalPhotos ?? selectedPhotos ?? []

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

    // Reset to enhanced image when switching between photos
    setShowingOriginal(false)
    crossfadeAnim.setValue(0)
  }, [currentIndex])

  // Toggle between original and enhanced image
  const toggleImage = () => {
    hapticFeedback.light()
    const newValue = !showingOriginal
    setShowingOriginal(newValue)

    Animated.timing(crossfadeAnim, {
      toValue: newValue ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.ease,
    }).start()
  }

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

  // Toggle selection mode
  const toggleSelectionMode = () => {
    hapticFeedback.light()
    if (selectionMode) {
      // Exiting selection mode - clear selections
      setSelectedForRegen(new Set())
    }
    setSelectionMode(!selectionMode)
  }

  // Toggle photo selection for regeneration
  const togglePhotoSelection = (index: number) => {
    hapticFeedback.light()
    const newSelection = new Set(selectedForRegen)
    if (newSelection.has(index)) {
      newSelection.delete(index)
    } else {
      newSelection.add(index)
    }
    setSelectedForRegen(newSelection)
  }

  // Handle regeneration of selected photos - navigate to Confirmation screen
  const handleRegenerateSelected = () => {
    const selectedCount = selectedForRegen.size
    if (selectedCount === 0) return

    hapticFeedback.medium()

    // Get the selected photos info
    const regenIndices = Array.from(selectedForRegen)
    const photosToRegen = regenIndices.map(i => originalFromNav[i])

    // First save the current project (so user doesn't lose progress)
    if (propertyId) {
      const allEnhancedImages = enhancedFromNav
        .filter((url: string) => url && url !== '')
        .map((url: string) => ({ uri: url }))
      const allOriginalImages = originalFromNav.map((url: string) => ({ uri: url }))

      updateListing(propertyId, {
        address: `${allEnhancedImages.length} Photos Enhanced`,
        image: allEnhancedImages[0] || images[0].enhanced,
        images: allEnhancedImages,
        originalImages: allOriginalImages,
        isEnhanced: true,
        status: 'completed',
      })
      console.log('Saved parent project before regen:', propertyId)
    }

    // Map backend style to display style for Confirmation screen
    const styleDisplayMap: Record<string, string> = {
      'luster': 'Luster',
      'flambient': 'Natural',
      'warm': 'Warm',
    }
    const displayStyle = styleDisplayMap[currentStyle] || 'Luster'

    // Navigate to Confirmation screen with regeneration params
    navigation.navigate('Confirmation' as never, {
      style: displayStyle,
      backendStyle: currentStyle,
      photoCount: selectedCount,
      // Regeneration-specific params
      isRegeneration: true,
      parentPropertyId: propertyId,
      regenIndices: regenIndices,
      existingEnhanced: enhancedFromNav,
      originalPhotos: originalFromNav,
      photosToProcess: photosToRegen,
    } as never)

    // Reset selection mode
    setSelectionMode(false)
    setSelectedForRegen(new Set())
  }

  // Legacy regenerate all (keeping for reference, but replaced by selection mode)
  const handleRegenerate = () => {
    hapticFeedback.medium()
    // Enter selection mode instead of regenerating all
    setSelectionMode(true)
  }

  const handleSaveAll = async () => {
    hapticFeedback.medium()

    if (images.length > 0 && enhancedFromNav.length > 0 && enhancedFromNav[0] !== '') {
      const allEnhancedImages = enhancedFromNav
        .filter((url: string) => url && url !== '')
        .map((url: string) => ({ uri: url }))

      const allOriginalImages = originalFromNav.map((url: string) => ({ uri: url }))

      if (propertyId) {
        // Update existing property to 'completed' status
        updateListing(propertyId, {
          address: `${allEnhancedImages.length} Photos Enhanced`,
          image: allEnhancedImages[0] || images[0].enhanced,
          images: allEnhancedImages,
          originalImages: allOriginalImages,
          isEnhanced: true,
          status: 'completed',
        })
        console.log('Updated property to completed status:', propertyId)
      } else {
        // No propertyId - this shouldn't happen in normal flow
        // ConfirmationScreen creates the property, ProcessingScreen passes it through
        // Do NOT create a new listing here as it causes duplicate cards
        console.warn('ResultScreen: No propertyId provided - skipping listing creation to avoid duplicates')
      }

      hapticFeedback.notification('success')
    }

    navigation.navigate('Main' as never)
  }

  const renderThumbnail = ({ item, index }: { item: EnhancedImage; index: number }) => {
    const isSelected = selectedForRegen.has(index)

    return (
      <TouchableOpacity
        style={[
          styles.thumbnail,
          index === currentIndex && !selectionMode && styles.thumbnailActive,
          selectionMode && isSelected && styles.thumbnailSelected,
        ]}
        onPress={() => {
          if (selectionMode) {
            togglePhotoSelection(index)
          } else {
            hapticFeedback.light()
            setCurrentIndex(index)
          }
        }}
      >
        <CachedImage source={item.enhanced} style={styles.thumbnailImage} />

        {/* Selection checkbox overlay */}
        {selectionMode && (
          <View style={styles.checkboxContainer}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <CheckIcon />}
            </View>
          </View>
        )}

        {/* Current viewing indicator (only when not in selection mode) */}
        {index === currentIndex && !selectionMode && (
          <View style={styles.thumbnailBorder}>
            <LinearGradient
              colors={['#D4AF37', '#F59E0B']}
              style={styles.thumbnailGradient}
            />
          </View>
        )}
      </TouchableOpacity>
    )
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            selectionMode && selectedForRegen.size > 0 && styles.scrollContentWithActionBar,
          ]}
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
            {selectionMode ? (
              // Selection mode header
              <>
                <TouchableOpacity onPress={toggleSelectionMode} style={styles.headerTextButton}>
                  <Text style={styles.headerTextButtonLabel}>Cancel</Text>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                  {selectedForRegen.size > 0
                    ? `${selectedForRegen.size} Selected`
                    : 'Select Photos'}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    // Select all photos
                    hapticFeedback.light()
                    if (selectedForRegen.size === images.length) {
                      setSelectedForRegen(new Set())
                    } else {
                      setSelectedForRegen(new Set(images.map((_, i) => i)))
                    }
                  }}
                  style={styles.headerTextButton}
                >
                  <Text style={styles.headerTextButtonLabel}>
                    {selectedForRegen.size === images.length ? 'None' : 'All'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              // Normal header
              <>
                <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
                  <BlurView intensity={60} tint="light" style={styles.headerButtonBlur}>
                    <BackIcon />
                  </BlurView>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Results</Text>

                <TouchableOpacity onPress={handleRegenerate} style={styles.headerButton}>
                  <BlurView intensity={60} tint="light" style={styles.headerButtonBlur}>
                    <SelectIcon />
                  </BlurView>
                </TouchableOpacity>
              </>
            )}
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
              <Pressable onPress={toggleImage} style={styles.imageContainer}>
                {/* Enhanced Image (base layer) */}
                <CachedImage
                  source={images[currentIndex].enhanced}
                  style={styles.mainImage}
                />

                {/* Original Image (overlay with crossfade) */}
                <Animated.View
                  style={[
                    styles.originalImageOverlay,
                    {
                      opacity: crossfadeAnim,
                    },
                  ]}
                >
                  <CachedImage
                    source={images[currentIndex].original}
                    style={styles.mainImage}
                  />
                </Animated.View>

                {/* Status Label */}
                <View style={styles.tapLabelContainer}>
                  <BlurView intensity={60} tint="dark" style={styles.tapLabelBlur}>
                    <Text style={styles.tapLabelText}>
                      {showingOriginal ? 'Original' : 'Enhanced'}
                    </Text>
                  </BlurView>
                </View>

                {/* Tap Hint */}
                <View style={styles.tapHintContainer}>
                  <BlurView intensity={60} tint="dark" style={styles.tapHintBlur}>
                    <Text style={styles.tapHintText}>
                      Tap to see {showingOriginal ? 'enhanced' : 'original'}
                    </Text>
                  </BlurView>
                </View>
              </Pressable>
            </BlurView>
          </Animated.View>

          {/* Thumbnail Gallery - always show, even for single photo */}
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

        {/* Bottom Action Bar for Regeneration */}
        {selectionMode && selectedForRegen.size > 0 && (
          <Animated.View style={styles.regenActionBar}>
            <BlurView intensity={90} tint="light" style={styles.regenActionBarBlur}>
              <View style={styles.regenActionBarContent}>
                <View style={styles.regenInfo}>
                  <Text style={styles.regenInfoText}>
                    {selectedForRegen.size} photo{selectedForRegen.size > 1 ? 's' : ''} selected
                  </Text>
                  <Text style={styles.regenCreditText}>
                    {selectedForRegen.size} credit{selectedForRegen.size > 1 ? 's' : ''}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleRegenerateSelected}
                  activeOpacity={0.8}
                  style={styles.regenButton}
                >
                  <LinearGradient
                    colors={['#D4AF37', '#B8860B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.regenButtonGradient}
                  >
                    <RefreshIconWhite />
                    <Text style={styles.regenButtonText}>Regenerate</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>
        )}
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
  scrollContentWithActionBar: {
    paddingBottom: 120, // Extra space for action bar
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
  originalImageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  tapLabelContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  tapLabelBlur: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tapLabelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tapHintContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapHintBlur: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  tapHintText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '500',
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
    opacity: 0.4,
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
  // Header text buttons for selection mode
  headerTextButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerTextButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
  },
  // Thumbnail selection styles
  thumbnailSelected: {
    borderWidth: 3,
    borderColor: '#D4AF37',
    borderRadius: 16,
  },
  checkboxContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  // Bottom action bar for regeneration
  regenActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  regenActionBarBlur: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  regenActionBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32, // Extra padding for home indicator
  },
  regenInfo: {
    flex: 1,
  },
  regenInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  regenCreditText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  regenButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  regenButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  regenButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})

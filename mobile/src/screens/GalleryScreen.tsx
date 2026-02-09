import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  FlatList,
  Animated,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { Image } from 'expo-image'
import CachedImage from '../components/CachedImage'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import Svg, { Path, Circle, G, Rect } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import ImageViewing from 'react-native-image-viewing'
import { useListings } from '../context/ListingsContext'
import hapticFeedback from '../utils/haptics'
import { PinchGestureHandler, State } from 'react-native-gesture-handler'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// Icon Components
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

const GridIcon = ({ columns }: { columns: number }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    {columns === 2 ? (
      <>
        <Rect x="3" y="3" width="8" height="8" stroke="#111827" strokeWidth="2" rx="1" />
        <Rect x="13" y="3" width="8" height="8" stroke="#111827" strokeWidth="2" rx="1" />
        <Rect x="3" y="13" width="8" height="8" stroke="#111827" strokeWidth="2" rx="1" />
        <Rect x="13" y="13" width="8" height="8" stroke="#111827" strokeWidth="2" rx="1" />
      </>
    ) : (
      <>
        <Rect x="3" y="3" width="5" height="5" stroke="#111827" strokeWidth="1.5" rx="0.5" />
        <Rect x="9.5" y="3" width="5" height="5" stroke="#111827" strokeWidth="1.5" rx="0.5" />
        <Rect x="16" y="3" width="5" height="5" stroke="#111827" strokeWidth="1.5" rx="0.5" />
        <Rect x="3" y="9.5" width="5" height="5" stroke="#111827" strokeWidth="1.5" rx="0.5" />
        <Rect x="9.5" y="9.5" width="5" height="5" stroke="#111827" strokeWidth="1.5" rx="0.5" />
        <Rect x="16" y="9.5" width="5" height="5" stroke="#111827" strokeWidth="1.5" rx="0.5" />
        <Rect x="3" y="16" width="5" height="5" stroke="#111827" strokeWidth="1.5" rx="0.5" />
        <Rect x="9.5" y="16" width="5" height="5" stroke="#111827" strokeWidth="1.5" rx="0.5" />
        <Rect x="16" y="16" width="5" height="5" stroke="#111827" strokeWidth="1.5" rx="0.5" />
      </>
    )}
  </Svg>
)

const BedIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 13h18v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm0-2V7a2 2 0 012-2h14a2 2 0 012 2v4M8 5v8m8-8v8"
      stroke="#6B7280"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const BathIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 12h18v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5zm4-7V3a1 1 0 011-1h2a1 1 0 011 1v9m-4 8v1m10-1v1"
      stroke="#6B7280"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const SqftIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 7h16M4 7v10m0-10L3 8m1-1l1 1m15-1v10m0-10l1 1m-1-1l-1 1m1 9H4m16 0l1-1m-1 1l-1-1M4 17l-1 1m1-1l1 1"
      stroke="#6B7280"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

interface GalleryImage {
  id: string
  uri: any
  isEnhanced?: boolean
  room?: string
}

export default function GalleryScreenNew() {
  const navigation = useNavigation()
  const route = useRoute()
  const { removeListing } = useListings()

  // State
  const [gridColumns, setGridColumns] = useState(2)
  const [isViewerVisible, setIsViewerVisible] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [propertyCardExpanded, setPropertyCardExpanded] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  // Animations
  const scrollY = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const cardAnimation = useRef(new Animated.Value(0)).current
  const headerOpacity = useRef(new Animated.Value(1)).current
  const gridScale = useRef(new Animated.Value(1)).current
  const pinchScale = useRef(new Animated.Value(1)).current
  const baseScale = useRef(new Animated.Value(1)).current

  // Property data
  const propertyData = (route.params as any)?.property || {
    address: '1234 Maple Street, San Francisco',
    price: '$1,250,000',
    beds: 4,
    baths: 3,
    sqft: '2,850',
    status: 'Enhanced'
  }

  useEffect(() => {
    // Initial animations
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(cardAnimation, {
          toValue: 1,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start()
    }, 300)
  }, [])

  // Generate gallery images
  const galleryImages = useMemo<GalleryImage[]>(() => {
    const propertyImages = propertyData?.images || []
    const hasRealImages = propertyImages.length > 0

    if (hasRealImages) {
      return propertyImages.map((image: { uri: string }, index: number) => ({
        id: `image-${index}`,
        uri: image,
        isEnhanced: index % 2 === 0,
        room: ['Living Room', 'Kitchen', 'Master Bedroom', 'Backyard', 'Bathroom', 'Office'][index % 6]
      }))
    }

    // Mock data fallback
    const MOCK_IMAGE_1 = require('../../assets/photo.png')
    const MOCK_IMAGE_2 = require('../../assets/welcome.png')

    return Array.from({ length: 12 }, (_, i) => ({
      id: `mock-${i}`,
      uri: i % 2 === 0 ? MOCK_IMAGE_1 : MOCK_IMAGE_2,
      isEnhanced: i % 3 === 0,
      room: ['Living Room', 'Kitchen', 'Master Bedroom', 'Backyard', 'Bathroom', 'Office'][i % 6]
    }))
  }, [propertyData])

  // Handle scroll for header animation
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y
        const shouldHide = offsetY > 50

        if (shouldHide !== !headerVisible) {
          Animated.timing(headerOpacity, {
            toValue: shouldHide ? 0.95 : 1,
            duration: 200,
            useNativeDriver: true,
          }).start()
          setHeaderVisible(!shouldHide)
        }
      },
    }
  )

  // Handle grid column change with haptic
  const handleGridChange = useCallback(() => {
    hapticFeedback.light()
    const newColumns = gridColumns === 2 ? 3 : 2

    Animated.sequence([
      Animated.timing(gridScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(gridScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()

    setGridColumns(newColumns)
  }, [gridColumns])

  // Handle pinch gesture for grid zoom
  const handlePinchGesture = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true }
  )

  const handlePinchStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const scale = event.nativeEvent.scale

      if (scale > 1.3) {
        setGridColumns(1)
        hapticFeedback.medium()
      } else if (scale < 0.7) {
        setGridColumns(3)
        hapticFeedback.medium()
      }

      Animated.spring(pinchScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start()
    }
  }

  // Handle image press
  const handleImagePress = (index: number) => {
    hapticFeedback.light()
    setCurrentImageIndex(index)
    setIsViewerVisible(true)
  }

  // Toggle property card
  const togglePropertyCard = () => {
    hapticFeedback.light()
    const toValue = propertyCardExpanded ? 0 : 1

    Animated.spring(cardAnimation, {
      toValue,
      tension: 65,
      friction: 10,
      useNativeDriver: true,
    }).start()

    setPropertyCardExpanded(!propertyCardExpanded)
  }

  // Calculate item dimensions
  const itemWidth = (SCREEN_WIDTH - (gridColumns + 1) * 2) / gridColumns
  const itemHeight = itemWidth * 1.2

  // Render grid item
  const renderItem = ({ item, index }: { item: GalleryImage; index: number }) => {
    const itemScale = Animated.multiply(gridScale, pinchScale)

    return (
      <Animated.View
        style={[
          styles.gridItem,
          {
            width: itemWidth,
            height: itemHeight,
            transform: [{ scale: itemScale }],
          },
        ]}
      >
        <Pressable
          onPress={() => handleImagePress(index)}
          style={styles.imageContainer}
        >
          <CachedImage source={item.uri} style={styles.gridImage} />

          {item.isEnhanced && (
            <BlurView intensity={60} style={styles.enhancedBadge}>
              <Text style={styles.enhancedText}>AI</Text>
            </BlurView>
          )}

          {gridColumns === 1 && (
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.4)']}
              style={styles.imageGradient}
            >
              <Text style={styles.roomLabel}>{item.room}</Text>
            </LinearGradient>
          )}
        </Pressable>
      </Animated.View>
    )
  }

  // Prepare viewer images
  const viewerImages = useMemo(() => {
    return galleryImages.map((img: GalleryImage) => ({
      uri: typeof img.uri === 'string' ? img.uri : Image.resolveAssetSource(img.uri).uri
    }))
  }, [galleryImages])

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Main Content */}
      <PinchGestureHandler
        onGestureEvent={handlePinchGesture}
        onHandlerStateChange={handlePinchStateChange}
      >
        <Animated.View style={styles.flex}>
          <FlatList
            data={galleryImages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={gridColumns}
            key={gridColumns}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListHeaderComponent={<View style={{ height: 100 }} />}
            ListFooterComponent={<View style={{ height: 120 }} />}
            columnWrapperStyle={gridColumns > 1 ? styles.row : undefined}
            ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
          />
        </Animated.View>
      </PinchGestureHandler>

      {/* Glassmorphic Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerOpacity,
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, -10],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        <BlurView intensity={80} tint="light" style={styles.headerBlur}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <BackIcon />
            </TouchableOpacity>

            <View style={styles.headerTitle}>
              <Text style={styles.headerTitleText} numberOfLines={1}>
                {propertyData.address}
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleGridChange}>
                <GridIcon columns={gridColumns} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <ShareIcon />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <DownloadIcon />
              </TouchableOpacity>
            </View>
            </View>
          </SafeAreaView>
        </BlurView>
      </Animated.View>

      {/* Floating Property Info Card */}
      <Animated.View
        style={[
          styles.propertyCard,
          {
            transform: [
              {
                translateY: cardAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -180],
                }),
              },
            ],
          },
        ]}
      >
        <BlurView intensity={90} tint="light" style={styles.cardBlur}>
          <TouchableOpacity onPress={togglePropertyCard} activeOpacity={0.9}>
            <View style={styles.cardHandle} />

            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardAddress} numberOfLines={1}>
                    {propertyData.address}
                  </Text>
                  <Text style={styles.cardPrice}>{propertyData.price}</Text>
                </View>

                {propertyData.status && (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{propertyData.status}</Text>
                  </View>
                )}
              </View>

              <Animated.View
                style={[
                  styles.cardDetails,
                  {
                    opacity: cardAnimation,
                    height: cardAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 80],
                    }),
                  },
                ]}
              >
                <View style={styles.propertyStats}>
                  <View style={styles.stat}>
                    <BedIcon />
                    <Text style={styles.statText}>{propertyData.beds} beds</Text>
                  </View>

                  <View style={styles.stat}>
                    <BathIcon />
                    <Text style={styles.statText}>{propertyData.baths} baths</Text>
                  </View>

                  <View style={styles.stat}>
                    <SqftIcon />
                    <Text style={styles.statText}>{propertyData.sqft} sqft</Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.primaryAction}>
                    <LinearGradient
                      colors={['#D4AF37', '#B8860B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionGradient}
                    >
                      <Text style={styles.actionText}>Enhance More</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.secondaryAction}>
                    <Text style={styles.secondaryActionText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>

      {/* Full-screen image viewer */}
      <ImageViewing
        images={viewerImages}
        imageIndex={currentImageIndex}
        visible={isViewerVisible}
        onRequestClose={() => setIsViewerVisible(false)}
        onImageIndexChange={setCurrentImageIndex}
        presentationStyle="overFullScreen"
        backgroundColor="#000000"
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  // Grid styles
  gridContent: {
    paddingHorizontal: 1,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 1,
  },
  gridItem: {
    marginHorizontal: 1,
  },
  imageContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'flex-end',
    padding: 8,
  },
  roomLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  enhancedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  enhancedText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },

  // Header styles
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitleText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Property card styles
  propertyCard: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  cardBlur: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderBottomWidth: 0,
  },
  cardHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardInfo: {
    flex: 1,
  },
  cardAddress: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  cardPrice: {
    fontSize: 17,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  cardDetails: {
    overflow: 'hidden',
  },
  propertyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryAction: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  secondaryAction: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  secondaryActionText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
})
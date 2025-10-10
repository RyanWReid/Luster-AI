import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  FlatList,
  Animated,
  Platform,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import Svg, { Path, Circle, G, Rect } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import ImageViewing from 'react-native-image-viewing'
import { useListings } from '../context/ListingsContext'
import hapticFeedback from '../utils/haptics'
import { PinchGestureHandler, State } from 'react-native-gesture-handler'
import PhotoCollection from '../components/PhotoCollection'
import ComparisonSlider from '../components/ComparisonSlider'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// Icon Components (reuse from previous implementation)
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

const CompareIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8 3v18m8-18v18M3 8h10M11 16h10"
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
  isEnhanced?: boolean
  room?: string
  original?: any
}

export default function GalleryScreenEnhanced() {
  const navigation = useNavigation()
  const route = useRoute()
  const { removeListing } = useListings()

  // State
  const [viewMode, setViewMode] = useState<'grid' | 'collections' | 'compare'>('grid')
  const [gridColumns, setGridColumns] = useState(2)
  const [isViewerVisible, setIsViewerVisible] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showComparisonModal, setShowComparisonModal] = useState(false)
  const [selectedComparison, setSelectedComparison] = useState<{
    before: any
    after: any
  } | null>(null)

  // Animations
  const scrollY = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const viewModeAnim = useRef(new Animated.Value(1)).current
  const headerOpacity = useRef(new Animated.Value(1)).current
  const gridScale = useRef(new Animated.Value(1)).current

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
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(viewModeAnim, {
        toValue: 1,
        tension: 65,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  // Generate gallery images with originals for comparison
  const galleryImages = useMemo<GalleryImage[]>(() => {
    const MOCK_IMAGE_1 = require('../../assets/photo.png')
    const MOCK_IMAGE_2 = require('../../assets/welcome.png')

    return Array.from({ length: 12 }, (_, i) => ({
      id: `image-${i}`,
      uri: i % 2 === 0 ? MOCK_IMAGE_1 : MOCK_IMAGE_2,
      isEnhanced: i % 3 === 0,
      room: ['Living Room', 'Kitchen', 'Master Bedroom', 'Backyard', 'Bathroom', 'Office'][i % 6],
      original: i % 2 === 0 ? MOCK_IMAGE_2 : MOCK_IMAGE_1,
    }))
  }, [propertyData])

  // Generate collections from images
  const collections = useMemo(() => {
    const roomGroups: { [key: string]: GalleryImage[] } = {}

    galleryImages.forEach(image => {
      if (image.room) {
        if (!roomGroups[image.room]) {
          roomGroups[image.room] = []
        }
        roomGroups[image.room].push(image)
      }
    })

    const collections = [
      {
        id: 'enhanced',
        title: 'AI Enhanced',
        count: galleryImages.filter(img => img.isEnhanced).length,
        images: galleryImages.filter(img => img.isEnhanced).map(img => img.uri),
        type: 'enhanced' as const,
      },
      ...Object.entries(roomGroups).map(([room, images]) => ({
        id: room.toLowerCase().replace(' ', '-'),
        title: room,
        count: images.length,
        images: images.map(img => img.uri),
        type: 'room' as const,
      })),
    ]

    return collections
  }, [galleryImages])

  // Handle view mode change
  const handleViewModeChange = (mode: 'grid' | 'collections' | 'compare') => {
    hapticFeedback.light()

    Animated.sequence([
      Animated.timing(viewModeAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(viewModeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()

    setViewMode(mode)

    if (mode === 'compare' && galleryImages.some(img => img.isEnhanced)) {
      const enhanced = galleryImages.find(img => img.isEnhanced)
      if (enhanced && enhanced.original) {
        setSelectedComparison({
          before: enhanced.original,
          after: enhanced.uri,
        })
        setShowComparisonModal(true)
      }
    }
  }

  // Handle collection press
  const handleCollectionPress = (collection: any) => {
    console.log('Collection pressed:', collection.title)
    // You can implement navigation to a filtered view here
  }

  // Calculate item dimensions for grid
  const itemWidth = (SCREEN_WIDTH - (gridColumns + 1) * 2) / gridColumns
  const itemHeight = itemWidth * 1.2

  // Render grid item
  const renderGridItem = ({ item, index }: { item: GalleryImage; index: number }) => (
    <Animated.View
      style={[
        styles.gridItem,
        {
          width: itemWidth,
          height: itemHeight,
          transform: [{ scale: gridScale }],
        },
      ]}
    >
      <Pressable
        onPress={() => {
          setCurrentImageIndex(index)
          setIsViewerVisible(true)
        }}
        onLongPress={() => {
          if (item.isEnhanced && item.original) {
            hapticFeedback.medium()
            setSelectedComparison({
              before: item.original,
              after: item.uri,
            })
            setShowComparisonModal(true)
          }
        }}
        style={styles.imageContainer}
      >
        <Image source={item.uri} style={styles.gridImage} resizeMode="cover" />

        {item.isEnhanced && (
          <BlurView intensity={60} style={styles.enhancedBadge}>
            <Text style={styles.enhancedText}>AI</Text>
          </BlurView>
        )}
      </Pressable>
    </Animated.View>
  )

  // Prepare viewer images
  const viewerImages = useMemo(() => {
    return galleryImages.map(img => ({
      uri: typeof img.uri === 'string' ? img.uri : Image.resolveAssetSource(img.uri).uri
    }))
  }, [galleryImages])

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={{ height: 100 }} />

        {/* View Mode Tabs */}
        <View style={styles.viewModeTabs}>
          <TouchableOpacity
            style={[styles.tab, viewMode === 'grid' && styles.activeTab]}
            onPress={() => handleViewModeChange('grid')}
          >
            <Text style={[styles.tabText, viewMode === 'grid' && styles.activeTabText]}>
              All Photos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, viewMode === 'collections' && styles.activeTab]}
            onPress={() => handleViewModeChange('collections')}
          >
            <Text style={[styles.tabText, viewMode === 'collections' && styles.activeTabText]}>
              Collections
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, viewMode === 'compare' && styles.activeTab]}
            onPress={() => handleViewModeChange('compare')}
          >
            <CompareIcon />
          </TouchableOpacity>
        </View>

        {/* Content based on view mode */}
        <Animated.View style={{ opacity: viewModeAnim, transform: [{ scale: viewModeAnim }] }}>
          {viewMode === 'grid' && (
            <FlatList
              data={galleryImages}
              renderItem={renderGridItem}
              keyExtractor={(item) => item.id}
              numColumns={gridColumns}
              key={gridColumns}
              contentContainerStyle={styles.gridContent}
              scrollEnabled={false}
              columnWrapperStyle={gridColumns > 1 ? styles.row : undefined}
              ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
            />
          )}

          {viewMode === 'collections' && (
            <PhotoCollection
              collections={collections}
              onCollectionPress={handleCollectionPress}
            />
          )}

          {viewMode === 'compare' && selectedComparison && (
            <View style={styles.compareContainer}>
              <ComparisonSlider
                beforeImage={selectedComparison.before}
                afterImage={selectedComparison.after}
                height={400}
              />
              <View style={styles.compareInfo}>
                <Text style={styles.compareTitle}>AI Enhancement Comparison</Text>
                <Text style={styles.compareDescription}>
                  Swipe to see the difference between original and enhanced photos
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

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
              <Text style={styles.headerSubtitle}>
                {galleryImages.length} photos • {galleryImages.filter(i => i.isEnhanced).length} enhanced
              </Text>
            </View>

            <View style={styles.headerActions}>
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

      {/* Comparison Modal */}
      <Modal
        visible={showComparisonModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowComparisonModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setShowComparisonModal(false)}
          >
            <BlurView intensity={80} style={styles.closeBlur}>
              <Text style={styles.closeText}>✕</Text>
            </BlurView>
          </TouchableOpacity>

          {selectedComparison && (
            <ComparisonSlider
              beforeImage={selectedComparison.before}
              afterImage={selectedComparison.after}
              height={SCREEN_HEIGHT * 0.7}
            />
          )}
        </View>
      </Modal>

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
  scrollView: {
    flex: 1,
  },

  // View mode tabs
  viewModeTabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  activeTabText: {
    color: '#111827',
    fontWeight: '600',
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

  // Compare view
  compareContainer: {
    marginTop: 20,
  },
  compareInfo: {
    padding: 20,
    alignItems: 'center',
  },
  compareTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  compareDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
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
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
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

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 100,
  },
  closeBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  closeText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
})
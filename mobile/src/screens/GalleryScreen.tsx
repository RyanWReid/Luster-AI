import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
  TextInput,
  Animated,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import Svg, { Path, Circle } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import ImageViewing from 'react-native-image-viewing'
import { useListings } from '../context/ListingsContext'

const { width } = Dimensions.get('window')
const COLUMN_WIDTH = (width - 36) / 2 // 2 columns with padding

// Back arrow icon
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12l7 7m-7-7l7-7"
      stroke="#374151"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// Download icon
const DownloadIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5m0 0l5-5m-5 5V3"
      stroke="#374151"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// More options icon (three dots)
const MoreIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="5" r="2" fill="#374151" />
    <Circle cx="12" cy="12" r="2" fill="#374151" />
    <Circle cx="12" cy="19" r="2" fill="#374151" />
  </Svg>
)

interface GalleryImage {
  id: string
  uri: any
  height: number
}

export default function GalleryScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { removeListing } = useListings()
  const [isViewerVisible, setIsViewerVisible] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editedAddress, setEditedAddress] = useState('')
  
  // Animation value for menu slide
  const menuSlideAnim = useRef(new Animated.Value(300)).current
  
  const propertyData = (route.params as any)?.property || {
    address: '123 Ryan St.',
    price: '$750,000',
    beds: 4,
    baths: 3,
  }
  
  // Initialize edited address with current address
  useState(() => {
    setEditedAddress(propertyData.address)
  })
  
  // Animate menu when showMenu changes
  useEffect(() => {
    if (showMenu) {
      Animated.spring(menuSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start()
    } else {
      Animated.timing(menuSlideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start()
    }
  }, [showMenu])
  
  // Debug: Log what property data we received
  console.log('GalleryScreen - route.params:', route.params)
  console.log('GalleryScreen - propertyData:', propertyData)
  console.log('GalleryScreen - propertyData.images:', propertyData?.images)
  
  // Use actual images from the property listing or fall back to mock
  const galleryImages = useMemo<GalleryImage[]>(() => {
    // Check if property has enhanced images
    const propertyImages = propertyData?.images || []
    const hasRealImages = propertyImages.length > 0
    
    // If we have real enhanced images, use them
    if (hasRealImages) {
      console.log('GalleryScreen - Using real enhanced images:', propertyImages.length)
      const heights = [180, 220, 160, 240, 200, 180, 220, 160]
      
      return propertyImages.map((image: { uri: string }, index: number) => ({
        id: `real-${index}-${Math.random().toString(36).substring(2, 11)}`,
        uri: image, // Already in { uri: string } format
        height: heights[index % heights.length],
      }))
    }
    
    // Otherwise fall back to mock images
    console.log('GalleryScreen - No enhanced images, using mock data')
    
    // Store required images inside useMemo to avoid re-requiring
    const MOCK_IMAGE_1 = require('../../assets/photo.png')
    const MOCK_IMAGE_2 = require('../../assets/welcome.png')
    
    // Generate unique images array to avoid duplicate key issues
    const heights = [180, 220, 160, 240, 200, 180]
    
    // Use property image or the stored mock images
    const defaultImage = propertyData?.image || MOCK_IMAGE_1
    
    // Create 6 mock images, ensuring unique keys for each
    return heights.map((height, i) => {
      // Create a truly unique ID combining multiple factors
      const uniqueId = `gallery-item-${i}-${Math.random().toString(36).substring(2, 11)}`
      
      // Alternate between images
      const imageSource = i % 2 === 0 ? defaultImage : MOCK_IMAGE_2
      
      return {
        id: uniqueId,
        uri: imageSource,
        height: height,
      }
    })
  }, [propertyData])

  // Split images into two columns for masonry layout
  const [leftColumn, rightColumn] = useMemo(() => {
    const left: GalleryImage[] = []
    const right: GalleryImage[] = []
    
    galleryImages.forEach((image, index) => {
      if (index % 2 === 0) {
        left.push(image)
      } else {
        right.push(image)
      }
    })
    
    return [left, right]
  }, [galleryImages])

  const handleBack = () => {
    navigation.goBack()
  }

  const handleDownload = () => {
    console.log('Download all images')
    // Implement download functionality
  }
  
  const closeMenu = (callback?: () => void) => {
    Animated.timing(menuSlideAnim, {
      toValue: 300,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowMenu(false)
      if (callback) callback()
    })
  }
  
  const handleAddPhotos = () => {
    closeMenu(() => {
      // Navigate to photo selection, passing the current property ID
      navigation.navigate('NewListing' as never, {
        existingPropertyId: propertyData.id,
        propertyData: propertyData,
        mode: 'addToExisting'
      } as never)
    })
  }
  
  const handleDeleteProject = () => {
    closeMenu(() => {
      Alert.alert(
        'Delete Project',
        `Are you sure you want to delete "${propertyData.address}"? This action cannot be undone.`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              // Remove from listings if it has an ID
              if (propertyData.id) {
                removeListing(propertyData.id)
              }
              navigation.goBack()
            }
          }
        ]
      )
    })
  }
  
  const handleEditAddress = () => {
    closeMenu(() => {
      setEditedAddress(propertyData.address)
      setShowEditModal(true)
    })
  }
  
  const handleSaveAddress = () => {
    // TODO: Update the listing with new address
    console.log('New address:', editedAddress)
    propertyData.address = editedAddress
    setShowEditModal(false)
  }

  const handleImagePress = (image: GalleryImage, index: number) => {
    console.log('Image pressed:', image.id, 'at index:', index)
    setCurrentImageIndex(index)
    setIsViewerVisible(true)
  }
  
  // Prepare images for the viewer - needs to be in the format the library expects
  const viewerImages = useMemo(() => {
    return galleryImages.map(img => ({
      uri: typeof img.uri === 'string' ? img.uri : Image.resolveAssetSource(img.uri).uri
    }))
  }, [galleryImages])

  const renderImageColumn = (images: GalleryImage[], columnKey: string, startIndex: number) => (
    <View style={styles.column} key={`column-${columnKey}`}>
      {images.map((image, idx) => {
        // Calculate the actual index in the full gallery
        const actualIndex = columnKey === 'left' 
          ? idx * 2 
          : idx * 2 + 1
        
        // Use a combination of column key and unique image id for the key
        const uniqueKey = `${columnKey}-${idx}-${image.id}`
        
        return (
          <TouchableOpacity
            key={uniqueKey}
            style={[styles.imageContainer, { height: image.height }]}
            onPress={() => handleImagePress(image, actualIndex)}
            activeOpacity={0.9}
          >
            <Image
              source={image.uri}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )
      })}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBack} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <BackIcon />
        </TouchableOpacity>
        
        <Text style={styles.title} numberOfLines={1}>
          {propertyData.address}
        </Text>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={handleDownload}
            style={styles.downloadButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <DownloadIcon />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setShowMenu(true)}
            style={styles.moreButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreIcon />
          </TouchableOpacity>
        </View>
      </View>

      {/* Gallery */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.masonryContainer}>
          {renderImageColumn(leftColumn, 'left', 0)}
          {renderImageColumn(rightColumn, 'right', 1)}
        </View>
      </ScrollView>
      
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
      
      {/* Action Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => closeMenu()}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => closeMenu()}
        >
          <Animated.View 
            style={[
              styles.menuContainer,
              {
                transform: [{ translateY: menuSlideAnim }]
              }
            ]}
          >
            <View style={styles.menuHandle} />
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleAddPhotos}
            >
              <Text style={styles.menuItemText}>Add More Photos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleEditAddress}
            >
              <Text style={styles.menuItemText}>Edit Address</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={handleDeleteProject}
            >
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>
                Delete Project
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.menuItemCancel]}
              onPress={() => closeMenu()}
            >
              <Text style={styles.menuItemText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
      
      {/* Edit Address Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContainer}>
            <Text style={styles.editModalTitle}>Edit Address</Text>
            
            <TextInput
              style={styles.editInput}
              value={editedAddress}
              onChangeText={setEditedAddress}
              placeholder="Enter property address"
              autoFocus={true}
            />
            
            <View style={styles.editModalButtons}>
              <TouchableOpacity 
                style={styles.editModalButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.editModalButtonCancel}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.editModalButton, styles.editModalButtonSave]}
                onPress={handleSaveAddress}
              >
                <Text style={styles.editModalButtonSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Fade Gradient */}
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.95)', 'rgba(255,255,255,1)']}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.bottomFadeGradient}
        pointerEvents="none"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  masonryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  column: {
    flex: 1,
    paddingHorizontal: 4,
  },
  imageContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area bottom
  },
  menuHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  menuItem: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  menuItemText: {
    fontSize: 17,
    color: '#111827',
    textAlign: 'center',
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  menuItemTextDanger: {
    color: '#EF4444',
  },
  menuItemCancel: {
    borderTopWidth: 8,
    borderTopColor: '#F3F4F6',
    marginTop: 0,
  },
  editModalContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 24,
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 24,
  },
  editModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  editModalButtonCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  editModalButtonSave: {
    backgroundColor: '#FFBF35',
  },
  editModalButtonSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomFadeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
})
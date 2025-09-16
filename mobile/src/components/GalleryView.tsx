import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native'
import ImageViewing from 'react-native-image-viewing'
import { useNavigation } from '@react-navigation/native'
import Svg, { Path, Circle } from 'react-native-svg'

const { width } = Dimensions.get('window')
const COLUMN_WIDTH = (width - 36) / 2 // 2 columns with padding

// Camera icon
const CameraIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx="12"
      cy="13"
      r="4"
      stroke="#FFFFFF"
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

interface GalleryViewProps {
  propertyData: any
}

export default function GalleryView({ propertyData }: GalleryViewProps) {
  const navigation = useNavigation()
  const [isViewerVisible, setIsViewerVisible] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Use actual images from the property listing or fall back to mock
  const galleryImages = useMemo<GalleryImage[]>(() => {
    const propertyImages = propertyData?.images || []
    const hasRealImages = propertyImages.length > 0
    
    if (hasRealImages) {
      const heights = [180, 220, 160, 240, 200, 180, 220, 160]
      
      return propertyImages.map((image: any, index: number) => ({
        id: `real-${index}-${Math.random().toString(36).substring(2, 11)}`,
        uri: image,
        height: heights[index % heights.length],
      }))
    }
    
    // Mock images for demo
    const MOCK_IMAGE_1 = require('../../assets/photo.png')
    const MOCK_IMAGE_2 = require('../../assets/welcome.png')
    
    const heights = [180, 220, 160, 240, 200, 180]
    const defaultImage = propertyData?.image || MOCK_IMAGE_1
    
    return heights.map((height, i) => {
      const uniqueId = `gallery-item-${i}-${Math.random().toString(36).substring(2, 11)}`
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

  const handleImagePress = (image: GalleryImage, index: number) => {
    setCurrentImageIndex(index)
    setIsViewerVisible(true)
  }
  
  const handleAddPhotos = () => {
    // Navigate to photo selection, passing the current property ID
    navigation.navigate('NewListing' as never, {
      existingPropertyId: propertyData.id,
      propertyData: propertyData,
      mode: 'addToExisting'
    } as never)
  }
  
  // Prepare images for the viewer
  const viewerImages = useMemo(() => {
    return galleryImages.map(img => ({
      uri: typeof img.uri === 'string' ? img.uri : Image.resolveAssetSource(img.uri).uri
    }))
  }, [galleryImages])

  const renderImageColumn = (images: GalleryImage[], columnKey: string) => (
    <View style={styles.column} key={`column-${columnKey}`}>
      {images.map((image, idx) => {
        const actualIndex = columnKey === 'left' ? idx * 2 : idx * 2 + 1
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
    <View style={styles.container}>
      {/* Photo count badge */}
      <View style={styles.photoCountBadge}>
        <Text style={styles.photoCountText}>
          {galleryImages.length} photos
        </Text>
      </View>

      {/* Gallery */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.masonryContainer}>
          {renderImageColumn(leftColumn, 'left')}
          {renderImageColumn(rightColumn, 'right')}
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
      
      {/* Floating Add Photo Button */}
      <TouchableOpacity 
        style={styles.floatingAddButton}
        onPress={handleAddPhotos}
        activeOpacity={0.8}
      >
        <CameraIcon />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  photoCountBadge: {
    position: 'absolute',
    top: 12,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  photoCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12, // Minimal top padding
    paddingBottom: 80, // Extra bottom padding for floating button
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
  floatingAddButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFBF35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
})
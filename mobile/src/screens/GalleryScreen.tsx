import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import Svg, { Path } from 'react-native-svg'

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

interface GalleryImage {
  id: string
  uri: any
  height: number
}

export default function GalleryScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const propertyData = (route.params as any)?.property || {
    address: '123 Ryan St.',
    price: '$750,000',
    beds: 4,
    baths: 3,
  }
  
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
      
      return propertyImages.map((image, index) => ({
        id: `image-${index}`,
        uri: image, // Already in { uri: string } format
        height: heights[index % heights.length],
      }))
    }
    
    // Otherwise fall back to mock images
    console.log('GalleryScreen - No enhanced images, using mock data')
    const mockImages = [
      require('../../assets/photo.png'),
      require('../../assets/welcome.png'),
      require('../../assets/photo.png'),
      require('../../assets/welcome.png'),
    ]

    const heights = [180, 220, 160, 240]
    
    return mockImages.map((uri, index) => ({
      id: `image-${index}`,
      uri,
      height: heights[index % heights.length],
    }))
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

  const handleImagePress = (image: GalleryImage) => {
    console.log('Image pressed:', image.id)
    // Could navigate to full-screen image viewer
  }

  const renderImageColumn = (images: GalleryImage[], columnKey: string) => (
    <View style={styles.column}>
      {images.map((image) => (
        <TouchableOpacity
          key={image.id}
          style={[styles.imageContainer, { height: image.height }]}
          onPress={() => handleImagePress(image)}
          activeOpacity={0.9}
        >
          <Image
            source={image.uri}
            style={styles.image}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ))}
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
        
        <TouchableOpacity 
          onPress={handleDownload}
          style={styles.downloadButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <DownloadIcon />
        </TouchableOpacity>
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
})
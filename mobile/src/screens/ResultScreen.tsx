import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  Dimensions,
  FlatList,
  PanResponder,
  Animated,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path } from 'react-native-svg'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import { usePhotos } from '../context/PhotoContext'
import { useListings } from '../context/ListingsContext'

const { width, height } = Dimensions.get('window')

// Icons
const CloseIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke="#374151"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

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

const DeleteIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
      stroke="#374151"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const ShareIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8.59 13.51l6.83 3.98m-.01-10.98l-6.82 3.98M21 5a3 3 0 11-6 0 3 3 0 016 0zM9 12a3 3 0 11-6 0 3 3 0 016 0zm12 7a3 3 0 11-6 0 3 3 0 016 0z"
      stroke="#374151"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const RegenerateIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 4v6h6M23 20v-6h-6"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const CameraIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z"
      stroke="#374151"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 17a4 4 0 100-8 4 4 0 000 8z"
      stroke="#374151"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

interface EnhancedImage {
  id: string
  original: any // Image source
  enhanced: any // Enhanced image source
}

export default function ResultScreen() {
  const navigation = useNavigation()
  const { selectedPhotos } = usePhotos()
  const { addListing } = useListings()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showOriginal, setShowOriginal] = useState(false)
  const [containerWidth, setContainerWidth] = useState(width)
  const sliderPosition = useRef(new Animated.Value(width / 2)).current

  // Debug: Log selected photos
  console.log('ResultScreen - selectedPhotos:', selectedPhotos)
  console.log('ResultScreen - selectedPhotos length:', selectedPhotos.length)
  
  // Create enhanced images from selected photos
  // Original = user's photo (before), Enhanced = placeholder (after)
  const [images] = useState<EnhancedImage[]>([
    {
      id: '1',
      original: selectedPhotos && selectedPhotos.length > 0 
        ? { uri: selectedPhotos[0] }
        : require('../../assets/welcome.png'), // Fallback if no photo selected
      enhanced: require('../../assets/photo.png'), // Placeholder for enhanced version
    },
    ...selectedPhotos.slice(1).map((photo, index) => ({
      id: `${index + 2}`,
      original: { uri: photo },
      enhanced: require('../../assets/photo.png'),
    }))
  ].filter(img => img))

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5
      },
      onPanResponderMove: (evt, gestureState) => {
        // Update slider position for before/after comparison
        // Clamp between 0 and container width
        const newPosition = Math.max(0, Math.min(containerWidth, gestureState.moveX))
        sliderPosition.setValue(newPosition)
      },
      onPanResponderRelease: () => {
        // Optional: snap to center or edges
      },
    })
  ).current

  const handleClose = () => {
    navigation.navigate('Dashboard' as never)
  }

  const handleDownload = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status === 'granted') {
        // Download current image
        console.log('Downloading image...')
      }
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  const handleDelete = () => {
    // Remove current image from results
    console.log('Delete current image')
  }

  const handleShare = async () => {
    try {
      if (await Sharing.isAvailableAsync()) {
        // Share current image
        console.log('Sharing image...')
      }
    } catch (error) {
      console.error('Error sharing image:', error)
    }
  }

  const handleRegenerate = () => {
    // Navigate back to processing with same settings
    navigation.navigate('Processing' as never)
  }

  const handleAddMorePhotos = () => {
    // Navigate back to photo upload
    navigation.navigate('NewListing' as never)
  }

  const handleSaveAll = async () => {
    // Create a new listing with the first enhanced image
    if (images.length > 0) {
      const enhancedImage = images[0].enhanced
      addListing({
        address: 'New Listing',
        price: '$---,---',
        beds: 0,
        baths: 0,
        image: enhancedImage,
        isEnhanced: true,
      })
    }
    
    // Save all enhanced images
    console.log('Saving all images...')
    navigation.navigate('Dashboard' as never)
  }

  const renderThumbnail = ({ item, index }: { item: EnhancedImage; index: number }) => (
    <TouchableOpacity
      style={[
        styles.thumbnail,
        index === currentIndex && styles.thumbnailActive,
      ]}
      onPress={() => setCurrentIndex(index)}
    >
      <Image source={item.enhanced} style={styles.thumbnailImage} />
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Result</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <CloseIcon />
        </TouchableOpacity>
      </View>

      {/* Main Image Viewer */}
      <View 
        style={styles.imageContainer}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout
          setContainerWidth(width)
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
          <View style={styles.sliderLine} />
          <View style={styles.sliderCircle}>
            <Text style={styles.sliderArrows}>{'← →'}</Text>
          </View>
        </Animated.View>

        {/* Before/After Labels */}
        <View style={styles.labelContainer}>
          <Text style={styles.beforeLabel}>Before</Text>
          <Text style={styles.afterLabel}>After</Text>
        </View>
      </View>

      {/* Thumbnail Gallery - Only show if multiple images */}
      {images.length > 1 && (
        <View style={styles.thumbnailContainer}>
          <FlatList
            data={images}
            renderItem={renderThumbnail}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailList}
          />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
          <DownloadIcon />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
          <DeleteIcon />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <ShareIcon />
        </TouchableOpacity>
      </View>

      {/* Main Actions */}
      <View style={styles.mainActions}>
        <TouchableOpacity
          style={styles.regenerateButton}
          onPress={handleRegenerate}
          activeOpacity={0.8}
        >
          <RegenerateIcon />
          <Text style={styles.regenerateButtonText}>Regenerate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addPhotosButton}
          onPress={handleAddMorePhotos}
          activeOpacity={0.8}
        >
          <CameraIcon />
          <Text style={styles.addPhotosButtonText}>Add more photos</Text>
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          onPress={handleSaveAll}
          activeOpacity={0.8}
          style={styles.saveButtonTouchable}
        >
          <LinearGradient
            colors={['#fbbf24', '#f59e0b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
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
    width: 4,
    height: '100%',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  sliderCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  sliderArrows: {
    fontSize: 16,
    color: '#374151',
    fontWeight: 'bold',
  },
  labelContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  beforeLabel: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  afterLabel: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  thumbnailContainer: {
    height: 100,
    marginTop: 20,
  },
  thumbnailList: {
    paddingHorizontal: 24,
  },
  thumbnail: {
    width: 80,
    height: 80,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#FCD34D',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 20,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainActions: {
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 20,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#374151',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  regenerateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addPhotosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  addPhotosButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 34,
  },
  saveButtonTouchable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Animated,
  Easing,
  Alert,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import Svg, { Path } from 'react-native-svg'
import { usePhotos } from '../context/PhotoContext'
import { useListings } from '../context/ListingsContext'
import enhancementService from '../services/enhancementService'

// Close icon
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

// Sparkle icon component with animation support
const SparkleIcon = ({ size = 60 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2v6m0 8v6M6 12h6m8 0h-6"
      stroke="#111827"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Path
      d="M12 8a1 1 0 011 1v2h2a1 1 0 110 2h-2v2a1 1 0 11-2 0v-2H9a1 1 0 110-2h2V9a1 1 0 011-1z"
      fill="#111827"
    />
    <Path
      d="M5.5 5.5l2 2m9 9l2 2m0-13l-2 2m-9 9l-2 2"
      stroke="#111827"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
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
  const [currentStatus, setCurrentStatus] = useState('Starting enhancement...')
  const [enhancedUrls, setEnhancedUrls] = useState<string[]>([])
  
  // Debug: Log selected photos
  console.log('ProcessingScreen - selectedPhotos:', selectedPhotos)
  console.log('ProcessingScreen - firstImage:', firstImage)
  console.log('ProcessingScreen - style:', style)
  
  const rotateAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const shimmerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Rotation animation for sparkle icon
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()

    // Pulse animation for sparkle icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start()

    // Shimmer animation for small sparkles
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

    // Process images with real API
    const processImages = async () => {
      try {
        setCurrentStatus('Uploading images...')
        
        // For demo/testing, we'll use the local image URIs as URLs
        // In production, you'd upload these to R2 first and get proper URLs
        const imageUrls = photos.map((photo: string) => photo)
        
        setCurrentStatus('Enhancing images with AI...')
        
        // Process all images
        const results = await enhancementService.enhanceMultipleImages(
          imageUrls,
          style as 'luster' | 'flambient',
          (completed, total, status) => {
            setProcessedCount(completed)
            setCurrentStatus(`Processing image ${completed} of ${total}...`)
          }
        )
        
        // Store enhanced URLs
        setEnhancedUrls(results)
        if (setEnhancedPhotos) {
          setEnhancedPhotos(results)
        }
        
        // Add to listings if we have results
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
          style: style
        })
      } catch (error) {
        console.error('Enhancement failed:', error)
        Alert.alert(
          'Enhancement Failed',
          'There was an error processing your images. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Dashboard' as never)
            }
          ]
        )
      }
    }
    
    // Start processing after a short delay for UI to settle
    const timer = setTimeout(() => {
      processImages()
    }, 500)
    
    return () => clearTimeout(timer)
  }, [navigation, rotateAnim, pulseAnim, shimmerAnim])

  const handleClose = () => {
    // Show confirmation dialog or cancel processing
    navigation.navigate('Dashboard' as never)
  }

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Animated.View
            style={[
              styles.sparkleContainer,
              {
                transform: [{ rotate: spin }, { scale: pulseAnim }],
              },
            ]}
          >
            <SparkleIcon size={50} />
          </Animated.View>
          
          {/* Small animated sparkles */}
          <Animated.View
            style={[
              styles.smallSparkle,
              styles.sparkleTop,
              { opacity: shimmerAnim },
            ]}
          >
            <Text style={styles.sparkleText}>✨</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.smallSparkle,
              styles.sparkleBottom,
              { opacity: shimmerAnim },
            ]}
          >
            <Text style={styles.sparkleText}>✨</Text>
          </Animated.View>
          
          <Text style={styles.title}>
            {processedCount > 0 ? `Enhancing ${processedCount} of ${photoCount}` : 'Analyzing images'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <CloseIcon />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Status Message */}
        <Text style={styles.statusMessage}>
          {currentStatus || 'Please don\'t close the app or lock your device'}
        </Text>

        {/* Preview Image */}
        <View style={styles.imageContainer}>
          <Image
            source={firstImage ? { uri: firstImage } : require('../../assets/photo.png')}
            style={styles.previewImage}
            resizeMode="cover"
          />
          
          {/* Animated overlay to show processing */}
          <Animated.View
            style={[
              styles.processingOverlay,
              {
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0],
                }),
              },
            ]}
          />
        </View>

        {/* Footer Messages */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Good things take time...</Text>
          <Text style={styles.footerSubtitle}>
            epic things take a few more seconds
          </Text>
        </View>
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
    paddingBottom: 40,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  sparkleContainer: {
    marginRight: 12,
  },
  smallSparkle: {
    position: 'absolute',
  },
  sparkleTop: {
    top: -8,
    left: 35,
  },
  sparkleBottom: {
    bottom: -8,
    left: 45,
  },
  sparkleText: {
    fontSize: 16,
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  statusMessage: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  imageContainer: {
    flex: 1,
    maxHeight: 400,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  footer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  footerSubtitle: {
    fontSize: 18,
    color: '#6B7280',
  },
})
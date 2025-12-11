import React, { useRef, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Animated,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Path } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { useListings } from '../context/ListingsContext'

const { width } = Dimensions.get('window')

// Default property image
const defaultPropertyImage = require('../../assets/photo.png')

// Back arrow icon
const BackIcon = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// Mock properties data - 8 properties for "All Properties" view
const allProperties = [
  {
    id: '1',
    address: '1234 King Boulevard',
    price: '$550,000',
    image: defaultPropertyImage,
    status: 'Enhanced',
  },
  {
    id: '2',
    address: '789 Queen Street',
    price: '$425,000',
    image: defaultPropertyImage,
    status: 'Processing',
  },
  {
    id: '3',
    address: '456 Park Avenue',
    price: '$750,000',
    image: defaultPropertyImage,
    status: 'Enhanced',
  },
  {
    id: '4',
    address: '321 Maple Drive',
    price: '$680,000',
    image: defaultPropertyImage,
    status: 'Enhanced',
  },
  {
    id: '5',
    address: '555 Oak Lane',
    price: '$525,000',
    image: defaultPropertyImage,
    status: 'Enhanced',
  },
  {
    id: '6',
    address: '888 Pine Street',
    price: '$615,000',
    image: defaultPropertyImage,
    status: 'Enhanced',
  },
  {
    id: '7',
    address: '999 Elm Avenue',
    price: '$495,000',
    image: defaultPropertyImage,
    status: 'Processing',
  },
  {
    id: '8',
    address: '777 Cedar Court',
    price: '$720,000',
    image: defaultPropertyImage,
    status: 'Enhanced',
  },
]

// Property Card Component
const PropertyCard = ({ item, onPress }: { item: any; onPress: (item: any) => void }) => {
  const cardScale = useRef(new Animated.Value(1)).current
  const isFailed = item.status === 'failed'

  // Debug image source
  const imageUri = typeof item.image === 'object' && item.image.uri ? item.image.uri : null
  console.log('🖼️ PropertyCard rendering:', {
    id: item.id,
    address: item.address,
    imageType: typeof item.image,
    imageSource: imageUri || 'local require()',
    fullUri: imageUri,
  })

  const handlePressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.96,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(cardScale, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start()
  }

  const handleImageLoadStart = () => {
    console.log('🔄 Image load started for:', item.id)
  }

  const handleImageLoadEnd = () => {
    console.log('✅ Image loaded successfully for:', item.id)
  }

  const handleImageError = (error: any) => {
    console.error('❌ Image load FAILED for:', item.id)
    console.error('Error details:', {
      nativeEvent: error.nativeEvent,
      error: error.nativeEvent?.error,
      message: error.nativeEvent?.message,
      uri: imageUri,
    })

    // Try to fetch the URL directly to see what's happening
    if (imageUri) {
      console.log('🔍 Attempting direct fetch to debug...')
      fetch(imageUri, { method: 'HEAD' })
        .then(response => {
          console.log('Direct fetch response:', {
            status: response.status,
            statusText: response.statusText,
            headers: {
              'content-type': response.headers.get('content-type'),
              'content-length': response.headers.get('content-length'),
              'location': response.headers.get('location'),
            },
          })
        })
        .catch(fetchError => {
          console.error('Direct fetch also failed:', fetchError.message)
        })
    }
  }

  return (
    <Animated.View
      style={[
        styles.gridCard,
        {
          transform: [{ scale: cardScale }],
        },
        isFailed && styles.failedCard,
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(item)}
      >
        <View style={styles.cardImageContainer}>
          <Image
            source={item.image}
            style={styles.gridImage}
            onLoadStart={handleImageLoadStart}
            onLoadEnd={handleImageLoadEnd}
            onError={handleImageError}
          />
          {isFailed && (
            <View style={styles.failedOverlay}>
              <View style={styles.failedBadge}>
                <Text style={styles.failedBadgeText}>Failed</Text>
              </View>
            </View>
          )}
        </View>
        <BlurView intensity={60} tint="light" style={styles.gridOverlay}>
          <Text style={[styles.gridAddress, isFailed && styles.failedAddress]} numberOfLines={2}>
            {item.address}
          </Text>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function AllPropertiesScreen() {
  const navigation = useNavigation()
  const { listings, removeListing, clearListings } = useListings()

  // Use real listings if available, otherwise use mock data as fallback
  const displayData = listings.length > 0 ? listings : allProperties

  console.log('=== ALL PROPERTIES SCREEN MOUNTED ===')
  console.log('Listings count:', listings.length)
  console.log('Display data count:', displayData.length)
  console.log('Display data:', displayData.map(d => ({ id: d.id, address: d.address })))

  // Emergency clear all data - triple tap header to trigger
  const [tapCount, setTapCount] = useState(0)
  const tapTimer = useRef<NodeJS.Timeout>()

  const handleHeaderTripleTap = () => {
    setTapCount(prev => prev + 1)

    if (tapTimer.current) clearTimeout(tapTimer.current)

    tapTimer.current = setTimeout(() => {
      if (tapCount >= 2) {
        console.log('🗑️ EMERGENCY CLEAR - Deleting all listings')
        clearListings()
        Alert.alert('Success', 'All old listings cleared! Pull down to refresh.')
      }
      setTapCount(0)
    }, 500)
  }

  const handlePropertyPress = (item: any) => {
    console.log('Property pressed:', item.id, 'status:', item.status)
    // Navigate based on property status
    if (item.status === 'failed') {
      // Property failed - show error and offer to delete
      Alert.alert(
        'Enhancement Failed',
        item.error || 'An unknown error occurred during enhancement.',
        [
          {
            text: 'Continue',
            onPress: () => {
              removeListing(item.id)
            },
          },
        ],
        { cancelable: false }
      )
    } else if (item.status === 'processing') {
      // Property is still processing - go to ProcessingScreen
      navigation.navigate('Processing' as never, {
        propertyId: item.id,
        photos: item.originalImages?.map((img: any) => img.uri) || [],
        photoCount: item.originalImages?.length || 0,
      } as never)
    } else if (item.status === 'ready') {
      // Processing done, ready to save - go to ResultScreen
      navigation.navigate('Result' as never, {
        propertyId: item.id,
        enhancedPhotos: item.images?.map((img: any) => img.uri) || [],
        originalPhotos: item.originalImages?.map((img: any) => img.uri) || [],
      } as never)
    } else {
      // Completed - go to Project gallery
      navigation.navigate('Project' as never, {
        property: item,
      } as never)
    }
  }

  return (
    <View style={styles.container}>
      {/* Iridescent gradient background */}
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={['#FFF5F7', '#F7F0FF', '#F0F8FF', '#FFF8F0']}
          locations={[0, 0.3, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <BackIcon size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleHeaderTripleTap} activeOpacity={1}>
            <Text style={styles.headerTitle}>All Properties</Text>
          </TouchableOpacity>
          <View style={styles.backButton} />
        </View>

        {/* Properties Grid */}
        <FlatList
          data={displayData}
          renderItem={({ item }) => <PropertyCard item={item} onPress={handlePropertyPress} />}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.propertyRow}
          contentContainerStyle={styles.propertyGrid}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  propertyGrid: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  propertyRow: {
    gap: 16,
    marginBottom: 16,
  },
  gridCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageContainer: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    paddingHorizontal: 14,
    paddingBottom: 14,
    justifyContent: 'flex-end',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  gridAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  failedCard: {
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  failedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  failedBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  failedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  failedAddress: {
    color: '#ef4444',
  },
})

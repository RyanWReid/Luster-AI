import React, { useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Animated,
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

  return (
    <Animated.View
      style={[
        styles.gridCard,
        {
          transform: [{ scale: cardScale }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(item)}
      >
        <View style={styles.cardImageContainer}>
          <Image source={item.image} style={styles.gridImage} />
        </View>
        <BlurView intensity={60} tint="light" style={styles.gridOverlay}>
          <Text style={styles.gridAddress} numberOfLines={2}>
            {item.address}
          </Text>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function AllPropertiesScreen() {
  const navigation = useNavigation()
  const { listings } = useListings()

  // Use real listings if available, otherwise use mock data as fallback
  const displayData = listings.length > 0 ? listings : allProperties

  const handlePropertyPress = (item: any) => {
    console.log('Property pressed:', item.id, 'status:', item.status)
    // Navigate based on property status
    if (item.status === 'processing') {
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
          <Text style={styles.headerTitle}>All Properties</Text>
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
})

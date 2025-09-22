import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { useListings } from '../context/ListingsContext'
import { usePhotos } from '../context/PhotoContext'

const { width, height } = Dimensions.get('window')

// Default property image
const defaultPropertyImage = require('../../assets/photo.png')

// Modern coin icon
const CoinIcon = ({ size = 20, color = '#D4AF37' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <Text style={{
      position: 'absolute',
      left: size/2 - 4,
      top: size/2 - 8,
      fontSize: 14,
      fontWeight: '700',
      color: color
    }}>C</Text>
  </Svg>
)


// Star icon
const StarIcon = ({ size = 16, color = '#D4AF37' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2l2.582 7.953h8.364l-6.764 4.914 2.582 7.953L12 17.906 5.236 22.82l2.582-7.953L1.054 9.953h8.364L12 2z" />
  </Svg>
)


// Trending icon
const TrendingIcon = ({ size = 20, color = '#666' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 6l-9.5 9.5-5-5L1 18"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17 6h6v6"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// Mock properties data
const mockProperties = [
  {
    id: '1',
    address: '1234 King Boulevard',
    price: '$550,000',
    beds: 5,
    baths: 4,
    squareFeet: '2,850',
    image: defaultPropertyImage,
    status: 'Enhanced',
    date: '2 hours ago',
  },
  {
    id: '2',
    address: '789 Queen Street',
    price: '$425,000',
    beds: 3,
    baths: 2,
    squareFeet: '1,650',
    image: defaultPropertyImage,
    status: 'Processing',
    date: '5 hours ago',
  },
  {
    id: '3',
    address: '456 Park Avenue',
    price: '$750,000',
    beds: 4,
    baths: 3,
    squareFeet: '3,200',
    image: defaultPropertyImage,
    status: 'Enhanced',
    date: 'Yesterday',
  },
]

export default function DashboardScreenNew() {
  const navigation = useNavigation()
  const { listings } = useListings()
  const { creditBalance, isLoadingCredits } = usePhotos()

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleEnhancePhoto = () => {
    navigation.navigate('NewListing' as never)
  }

  const handleCreditsPress = () => {
    navigation.navigate('Credits' as never)
  }

  const handlePropertyPress = (item: any) => {
    navigation.navigate('Project' as never, { property: item } as never)
  }

  const AnimatedCard = ({ item, index }: { item: any; index: number }) => {
    const cardScale = useRef(new Animated.Value(1)).current

    const handlePressIn = () => {
      Animated.spring(cardScale, {
        toValue: 0.97,
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
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => handlePropertyPress(item)}
        >
          <Image source={item.image} style={styles.gridImage} />
          <BlurView intensity={90} tint="light" style={styles.gridOverlay}>
            <Text style={styles.gridPrice}>{item.price}</Text>
            <Text style={styles.gridAddress} numberOfLines={1}>
              {item.address}
            </Text>
            <Text style={styles.gridSpecs}>
              {item.beds} bed • {item.baths} bath
            </Text>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    )
  }


  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#FFFFFF', '#F8F8FA', '#F0F0F5']}
        style={styles.backgroundGradient}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View>
              <Text style={styles.greeting}>Good afternoon</Text>
              <Text style={styles.title}>Your Properties</Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={handleCreditsPress}
                style={styles.creditButton}
                activeOpacity={0.7}
              >
                <BlurView intensity={20} tint="light" style={styles.creditBlur}>
                  <CoinIcon size={18} />
                  <Text style={styles.creditText}>{creditBalance || 10}</Text>
                </BlurView>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Stats Cards */}
          <Animated.View
            style={[
              styles.statsContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <BlurView intensity={25} tint="light" style={styles.statCard}>
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>Properties</Text>
              <View style={styles.statTrend}>
                <TrendingIcon size={14} color="#4CAF50" />
                <Text style={styles.statChange}>+12%</Text>
              </View>
            </BlurView>

            <BlurView intensity={25} tint="light" style={styles.statCard}>
              <Text style={styles.statNumber}>18</Text>
              <Text style={styles.statLabel}>Enhanced</Text>
              <View style={styles.statTrend}>
                <StarIcon size={12} />
                <Text style={styles.statChange}>75%</Text>
              </View>
            </BlurView>

            <BlurView intensity={25} tint="light" style={styles.statCard}>
              <Text style={styles.statNumber}>$2.4M</Text>
              <Text style={styles.statLabel}>Total Value</Text>
              <View style={styles.statTrend}>
                <TrendingIcon size={14} color="#4CAF50" />
                <Text style={styles.statChange}>+8%</Text>
              </View>
            </BlurView>
          </Animated.View>


          {/* Recent Properties */}
          <Animated.View
            style={[
              styles.propertiesSection,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Properties</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
                data={mockProperties}
                renderItem={({ item, index }) => <AnimatedCard item={item} index={index} />}
                keyExtractor={(item) => item.id}
                horizontal={false}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.propertyRow}
                contentContainerStyle={styles.propertyGrid}
            />
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Bottom Fade Gradient */}
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.95)', 'rgba(255,255,255,1)']}
          locations={[0, 0.3, 0.7, 1]}
          style={styles.bottomFadeGradient}
          pointerEvents="none"
        />
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  creditButton: {
    // Removed extra styling
  },
  creditBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    gap: 6,
  },
  creditText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  // Stats Section
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  statChange: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
  },
  // Properties Section
  propertiesSection: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 15,
    color: '#D4AF37',
    fontWeight: '500',
  },
  propertyGrid: {
    gap: 12,
  },
  propertyRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  // Grid Card
  gridCard: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  gridImage: {
    width: '100%',
    height: 140,
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingTop: 20,
  },
  gridPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.3,
  },
  gridAddress: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginTop: 2,
  },
  gridSpecs: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomFadeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
})
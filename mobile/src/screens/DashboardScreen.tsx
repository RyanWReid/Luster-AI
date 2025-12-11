import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { useListings } from '../context/ListingsContext'
import { usePhotos } from '../context/PhotoContext'

const { width } = Dimensions.get('window')

// Default property image
const defaultPropertyImage = require('../../assets/photo.png')

// Luster logo for button
const lusterWhiteLogo = require('../../assets/luster-white-logo.png')

// Search icon
const SearchIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      stroke="#9CA3AF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// Star icon for the main button
const StarIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="white">
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill="white"
    />
  </Svg>
)

// Settings icon
const SettingsIcon = ({ color = '#9CA3AF' }: { color?: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15a3 3 0 100-6 3 3 0 000 6z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// Coin icon for credits
const CoinIcon = ({ color = '#F59E0B' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill="none" />
    <Path
      d="M12 17V7M15 9.5A2.5 2.5 0 0012.5 7h-1A2.5 2.5 0 009 9.5 2.5 2.5 0 0011.5 12H12.5A2.5 2.5 0 0115 14.5 2.5 2.5 0 0112.5 17h-1A2.5 2.5 0 019 14.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// Grid view icon
const GridIcon = ({ color = '#6B7280' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 3h7v7H3V3zM14 3h7v7h-7V3zM3 14h7v7H3v-7zM14 14h7v7h-7v-7z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// List view icon
const ListIcon = ({ color = '#6B7280' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 6h16M4 12h16M4 18h16"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// Arrow up/down icon for sorting
const ArrowIcon = ({ direction = 'down', color = '#6B7280' }: { direction?: 'up' | 'down', color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d={direction === 'down' ? "M6 9l6 6 6-6" : "M18 15l-6-6-6 6"}
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// Mock data for properties
const mockProperties = [
  {
    id: '1',
    address: '1234 King Blvd',
    price: '$550,000',
    beds: 5,
    baths: 4,
    squareFeet: 2850,
    image: defaultPropertyImage,
    images: [], // No enhanced images for mock data
    originalImages: [],
    isEnhanced: false,
    propertyType: 'Single Family',
    yearBuilt: 2020,
    lotSize: '0.25 acres',
  },
  {
    id: '2',
    address: '789 Queen Street',
    price: '$425,000',
    beds: 3,
    baths: 2,
    squareFeet: 1650,
    image: defaultPropertyImage,
    images: [],
    originalImages: [],
    isEnhanced: false,
    propertyType: 'Condo',
    yearBuilt: 2018,
    lotSize: 'N/A',
  },
  {
    id: '3',
    address: '456 Park Avenue',
    price: '$750,000',
    beds: 4,
    baths: 3,
    squareFeet: 3200,
    image: defaultPropertyImage,
    images: [],
    originalImages: [],
    isEnhanced: false,
    propertyType: 'Single Family',
    yearBuilt: 2019,
    lotSize: '0.35 acres',
  },
]

type FilterTag = 'Recent' | 'Price'
type ViewMode = 'grid' | 'list'
type SortOrder = 'asc' | 'desc'

export default function DashboardScreen() {
  const navigation = useNavigation()
  const { listings, syncFromBackend } = useListings()
  const { creditBalance, isLoadingCredits } = usePhotos()
  const [selectedFilter, setSelectedFilter] = useState<FilterTag>('Recent')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [searchText, setSearchText] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Sync listings from backend on mount
  useEffect(() => {
    console.log('🏠 DashboardScreen mounted - syncing listings from backend')
    syncFromBackend()
  }, []) // Empty deps array = run once on mount

  // Debug: Log listings
  console.log('DashboardScreen - listings count:', listings.length)
  if (listings.length > 0) {
    console.log('DashboardScreen - first listing:', listings[0])
    console.log('DashboardScreen - first listing images:', listings[0].images)
  }

  const filterTags: FilterTag[] = ['Recent', 'Price']

  const handleFilterPress = (tag: FilterTag) => {
    if (selectedFilter === tag) {
      // If same filter, toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // If different filter, set it and default sort order
      setSelectedFilter(tag)
      setSortOrder(tag === 'Price' ? 'asc' : 'desc')
    }
  }

  const handleEnhancePhoto = () => {
    // Navigate to new listing screen
    navigation.navigate('NewListing' as never)
  }

  const handleProfile = () => {
    // Navigate to profile/settings screen
    console.log('Navigate to profile')
    // navigation.navigate('Profile' as never)
  }

  const handleCreditsPress = () => {
    navigation.navigate('Credits' as never)
  }

  const handlePropertyPress = (item: any) => {
    // Pass the full property data including images array
    navigation.navigate('Project' as never, { 
      property: {
        id: item.id,
        address: item.address,
        price: item.price,
        beds: item.beds,
        baths: item.baths,
        image: item.image,
        images: item.images, // Pass all enhanced images
        originalImages: item.originalImages, // Pass original images too
        isEnhanced: item.isEnhanced,
        // Add any additional property data if available
        squareFeet: item.squareFeet,
        propertyType: item.propertyType,
        yearBuilt: item.yearBuilt,
        lotSize: item.lotSize,
        mlsNumber: item.mlsNumber,
        listingStatus: item.listingStatus,
        description: item.description,
      }
    } as never)
  }

  const renderPropertyCard = ({ item }: { item: any }) => {
    if (viewMode === 'list') {
      // List view - original full-width card design
      return (
        <TouchableOpacity
          style={styles.propertyCardList}
          activeOpacity={0.9}
          onPress={() => handlePropertyPress(item)}
        >
          <Image source={item.image} style={styles.propertyImageList} />
          {item.isEnhanced && (
            <View style={styles.enhancedBadgeList}>
              <Text style={styles.enhancedTextList}>Enhanced</Text>
            </View>
          )}
          <View style={styles.propertyInfoList}>
            <Text style={styles.propertyAddressList}>{item.address}</Text>
            <View style={styles.propertyDetailsList}>
              <Text style={styles.propertyPriceList}>{item.price}</Text>
              <Text style={styles.propertySpecsList}>
                {item.beds} Bed   {item.baths} Bath
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )
    }

    // Grid view - compact 2-column layout
    return (
      <TouchableOpacity
        style={styles.propertyCard}
        activeOpacity={0.9}
        onPress={() => handlePropertyPress(item)}
      >
        <Image source={item.image} style={styles.propertyImage} />
        {item.isEnhanced && (
          <View style={styles.enhancedBadgeGrid}>
            <Text style={styles.enhancedTextGrid}>Enhanced</Text>
          </View>
        )}
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyAddress} numberOfLines={1}>
            {item.address}
          </Text>
          <View style={styles.propertyDetails}>
            <Text style={styles.propertyPrice}>{item.price}</Text>
            <Text style={styles.propertySpecs}>
              {item.beds} Bed • {item.baths} Bath
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.creditButton}
              onPress={handleCreditsPress}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.creditBadge}
              >
                <CoinIcon />
                {isLoadingCredits ? (
                  <ActivityIndicator size="small" color="#F59E0B" style={styles.creditLoading} />
                ) : (
                  <Text style={styles.creditText}>{creditBalance}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handleProfile}
            >
              <SettingsIcon color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Filter Tags and View Toggle */}
        <View style={styles.filterSection}>
          <View style={styles.filterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps='handled'
              contentContainerStyle={styles.filterContent}
            >
              {filterTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.filterTag,
                    selectedFilter === tag && styles.filterTagActive,
                  ]}
                  onPress={() => handleFilterPress(tag)}
                  activeOpacity={0.7}
                >
                  <View style={styles.filterTagContent}>
                    <Text
                      style={[
                        styles.filterTagText,
                        selectedFilter === tag && styles.filterTagTextActive,
                      ]}
                      allowFontScaling={false}
                      numberOfLines={1}
                    >
                      {tag}
                    </Text>
                    {selectedFilter === tag && (
                      <ArrowIcon
                        direction={sortOrder === 'asc' ? 'up' : 'down'}
                        color={selectedFilter === tag ? '#4F46E5' : '#6B7280'}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
              onPress={() => setViewMode('grid')}
            >
              <GridIcon color={viewMode === 'grid' ? '#4F46E5' : '#9CA3AF'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <ListIcon color={viewMode === 'list' ? '#4F46E5' : '#9CA3AF'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Property List */}
        <FlatList
          data={[
            ...listings.map(listing => ({
              id: listing.id,
              address: listing.address,
              price: listing.price,
              beds: listing.beds,
              baths: listing.baths,
              image: listing.image,
              images: listing.images, // Include all enhanced images
              originalImages: listing.originalImages, // Include original images
              isEnhanced: listing.isEnhanced,
              squareFeet: listing.squareFeet,
            })),
            ...mockProperties,
          ]}
          renderItem={renderPropertyCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            viewMode === 'grid' && styles.gridContent
          ]}
          showsVerticalScrollIndicator={false}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render when switching views
        />
      </View>

      {/* Custom Bottom Navigation */}
      <View style={styles.bottomNavWrapper}>
        <LinearGradient
          colors={['#FFEDC3', '#F8F8F8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bottomNav}
        >
          <View style={styles.bottomNavContent}>
            {/* Content removed - just keeping the gradient bar */}
          </View>
        </LinearGradient>

        {/* Center Enhance Button - Outside gradient to avoid clipping */}
        <TouchableOpacity
          onPress={handleEnhancePhoto}
          activeOpacity={0.8}
          style={styles.enhanceButtonContainer}
        >
          <LinearGradient
            colors={['#FFB535', '#FFCF55']}  // Orange to lighter yellow gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}  // Horizontal gradient left to right
            style={styles.enhanceButton}
          >
            <Image source={lusterWhiteLogo} style={styles.lusterLogo} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  creditButton: {
    borderRadius: 20,
  },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  creditText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  creditLoading: {
    marginLeft: 4,
  },
  settingsButton: {
    padding: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  filterContainer: {
    flex: 1,
    height: 44,
    maxHeight: 44,
  },
  filterContent: {
    paddingHorizontal: 24,
    alignItems: 'center', // Center items vertically
    paddingVertical: 10,
  },
  filterTag: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    height: 40, // Fixed height
    justifyContent: 'center', // Center text vertically
    alignItems: 'center', // Center text horizontally
  },
  filterTagActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
  },
  filterTagText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151', // Darker gray for better visibility
    fontWeight: '500',
    textAlign: 'center',
  },
  filterTagTextActive: {
    color: '#78350F', // Even darker brown for active state
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  propertyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 6,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  propertyInfo: {
    padding: 12,
  },
  propertyAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  propertyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4F46E5',
  },
  propertySpecs: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  bottomNavWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'visible', // Allow button to float
  },
  bottomNav: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20, // Reduced from 34 (40% less) - still accounts for home indicator
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden', // Ensure gradient respects border radius
  },
  bottomNavContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12, // Reduced from 20 (40% less)
    paddingBottom: 24,  // Reduced from 12 (40% less)
    paddingHorizontal: 24,
    position: 'relative',
  },
  bottomNavSpacer: {
    width: 40,
  },
  bottomNavButton: {
    padding: 8,
  },
  enhanceButtonContainer: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -32 }],
    bottom: 28, // Adjusted for shorter nav height
  },
  enhanceButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  lusterLogo: {
    width: 38,
    height: 38,
    resizeMode: 'contain',
  },
  // New styles for grid/list view and updated filters
  filterSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    height: 44,
  },
  filterTagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 24,
  },
  viewButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  viewButtonActive: {
    backgroundColor: '#EEF2FF',
  },
  gridContent: {
    paddingHorizontal: 18,
    paddingBottom: 100,
  },
  // List view styles - matching original design
  propertyCardList: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  propertyImageList: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  propertyInfoList: {
    padding: 16,
  },
  propertyAddressList: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  propertyDetailsList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyPriceList: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  propertySpecsList: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  enhancedBadgeList: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    zIndex: 1,
  },
  enhancedTextList: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
    textTransform: 'uppercase',
  },
  enhancedBadgeGrid: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  enhancedTextGrid: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16A34A',
    textTransform: 'uppercase',
  },
})
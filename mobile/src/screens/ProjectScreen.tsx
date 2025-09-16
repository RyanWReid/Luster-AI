import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { FallbackPagerView } from '../utils/fallbackPagerView'
import Svg, { Path, Circle } from 'react-native-svg'
import { triggerHaptic } from '../utils/haptic'

// Import the three screen components
import GalleryView from '../components/GalleryView'
import PropertyInfoView from '../components/PropertyInfoView'
import ToolsView from '../components/ToolsView'

const { width } = Dimensions.get('window')

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

// Page indicator component
const PageIndicator = ({ active }: { active: boolean }) => {
  const scale = useRef(new Animated.Value(active ? 1.2 : 1)).current

  React.useEffect(() => {
    Animated.spring(scale, {
      toValue: active ? 1.2 : 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start()
  }, [active])

  return (
    <Animated.View
      style={[
        styles.indicator,
        active ? styles.indicatorActive : styles.indicatorInactive,
        {
          transform: [{ scale }],
        },
      ]}
    />
  )
}

export default function ProjectScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const pagerRef = useRef<any>(null)
  const [currentPage, setCurrentPage] = useState(0)
  
  // Get property data from navigation params
  const propertyData = (route.params as any)?.property || {
    id: '1',
    address: '123 Main St',
    price: '$750,000',
    beds: 4,
    baths: 3,
    squareFeet: 2450,
    propertyType: 'Single Family',
    yearBuilt: 2018,
    lotSize: '0.25 acres',
    mlsNumber: '123456',
    listingStatus: 'Active',
    description: 'Beautiful modern home with stunning views and premium finishes throughout.',
    images: [],
    originalImages: [],
  }

  const handleBack = () => {
    navigation.goBack()
  }

  const handlePageChange = (e: any) => {
    const page = e.nativeEvent.position
    setCurrentPage(page)
    
    // Haptic feedback on page change
    triggerHaptic('light')
  }

  const goToPage = (page: number) => {
    pagerRef.current?.setPage(page)
  }

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
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Page Indicators */}
      <View style={styles.indicatorContainer}>
        <TouchableOpacity onPress={() => goToPage(0)}>
          <PageIndicator active={currentPage === 0} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => goToPage(1)}>
          <PageIndicator active={currentPage === 1} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => goToPage(2)}>
          <PageIndicator active={currentPage === 2} />
        </TouchableOpacity>
      </View>

      {/* Swipeable Pages */}
      <FallbackPagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageChange}
      >
        {/* Screen 1: Gallery */}
        <View key="1" style={styles.page}>
          <GalleryView propertyData={propertyData} />
        </View>

        {/* Screen 2: Property Info */}
        <View key="2" style={styles.page}>
          <PropertyInfoView propertyData={propertyData} />
        </View>

        {/* Screen 3: Tools */}
        <View key="3" style={styles.page}>
          <ToolsView propertyData={propertyData} />
        </View>
      </FallbackPagerView>
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
  headerSpacer: {
    width: 40,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    gap: 10,
  },
  indicator: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
  },
  indicatorActive: {
    backgroundColor: '#FFBF35',
  },
  indicatorInactive: {
    backgroundColor: '#E5E7EB',
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
})
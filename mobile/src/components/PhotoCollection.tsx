import React, { useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native'
import CachedImage from './CachedImage'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import hapticFeedback from '../utils/haptics'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = SCREEN_WIDTH * 0.7
const CARD_SPACING = 12

interface Collection {
  id: string
  title: string
  count: number
  images: any[]
  type: 'room' | 'enhanced' | 'exterior' | 'virtual'
}

interface PhotoCollectionProps {
  collections: Collection[]
  onCollectionPress: (collection: Collection) => void
}

export default function PhotoCollection({ collections, onCollectionPress }: PhotoCollectionProps) {
  const scrollX = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 400,
      useNativeDriver: true,
    }).start()
  }, [])

  const handlePress = (collection: Collection) => {
    hapticFeedback.light()
    onCollectionPress(collection)
  }

  const renderCollection = (collection: Collection, index: number) => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_SPACING),
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1) * (CARD_WIDTH + CARD_SPACING),
    ]

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.92, 1, 0.92],
      extrapolate: 'clamp',
    })

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    })

    return (
      <Animated.View
        key={collection.id}
        style={[
          styles.collectionCard,
          {
            width: CARD_WIDTH,
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => handlePress(collection)}
          style={styles.cardTouchable}
        >
          <View style={styles.imageGrid}>
            {collection.images.slice(0, 4).map((image, imgIndex) => (
              <View
                key={`${collection.id}-img-${imgIndex}`}
                style={[
                  styles.gridImage,
                  imgIndex === 0 && collection.images.length === 1 && styles.fullImage,
                ]}
              >
                <CachedImage source={image} style={styles.image} />
              </View>
            ))}
          </View>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              <Text style={styles.collectionTitle}>{collection.title}</Text>
              <Text style={styles.collectionCount}>{collection.count} photos</Text>
            </View>

            {collection.type === 'enhanced' && (
              <View style={styles.enhancedIndicator}>
                <BlurView intensity={70} style={styles.enhancedBlur}>
                  <Text style={styles.enhancedText}>AI Enhanced</Text>
                </BlurView>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Collections</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {collections.map((collection, index) => renderCollection(collection, index))}
      </Animated.ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  seeAll: {
    fontSize: 15,
    color: '#D4AF37',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  collectionCard: {
    height: 200,
    marginRight: CARD_SPACING,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  cardTouchable: {
    flex: 1,
  },
  imageGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridImage: {
    width: '50%',
    height: '50%',
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
  },
  cardContent: {
    padding: 16,
  },
  collectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  collectionCount: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  enhancedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  enhancedBlur: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  enhancedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4AF37',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
})
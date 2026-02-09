import React, { useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native'
import CachedImage from '../components/CachedImage'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Path } from 'react-native-svg'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useListings } from '../context/ListingsContext'
import hapticFeedback from '../utils/haptics'
import type { PropertyListing } from '../types'

const { width } = Dimensions.get('window')

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

// Plus icon for new project
const PlusIcon = () => (
  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14M5 12h14"
      stroke="#D4AF37"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// Checkmark icon
const CheckIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke="#FFFFFF"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// New Project Card Component
const NewProjectCard = ({
  onPress,
  isSelected
}: {
  onPress: () => void
  isSelected: boolean
}) => {
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
        styles.newProjectCard,
        isSelected && styles.selectedCard,
        { transform: [{ scale: cardScale }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.newProjectContent}
      >
        <View style={styles.newProjectIconContainer}>
          <PlusIcon />
        </View>
        <Text style={styles.newProjectText}>New Project</Text>

        {isSelected && (
          <View style={styles.selectedBadge}>
            <CheckIcon />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

// Existing Project Card Component
const ProjectCard = ({
  item,
  onPress,
  isSelected,
}: {
  item: PropertyListing
  onPress: () => void
  isSelected: boolean
}) => {
  const cardScale = useRef(new Animated.Value(1)).current
  const photoCount = item.images?.length || 0

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
        isSelected && styles.selectedCard,
        { transform: [{ scale: cardScale }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <View style={styles.cardImageContainer}>
          <CachedImage
            source={item.image}
            style={styles.gridImage}
          />

          {isSelected && (
            <View style={styles.selectedOverlay}>
              <View style={styles.selectedBadgeLarge}>
                <CheckIcon />
              </View>
            </View>
          )}
        </View>
        <BlurView intensity={60} tint="light" style={styles.gridOverlay}>
          <Text style={styles.gridAddress} numberOfLines={1}>
            {item.address}
          </Text>
          <Text style={styles.photoCount}>
            {photoCount} photo{photoCount !== 1 ? 's' : ''}
          </Text>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function ProjectSelectionScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { listings } = useListings()

  // Get params from Confirmation screen
  const params = route.params as any
  const currentSelectedId = params?.selectedProjectId ?? null

  // Filter existing projects that are completed (can add to)
  const existingProjects = listings.filter(
    (l: PropertyListing) => l.status === 'completed' || l.status === 'ready'
  )

  const handleSelectProject = (projectId: string | null) => {
    hapticFeedback.medium()

    // Navigate back to Confirmation with selected project
    navigation.navigate('Confirmation' as never, {
      ...params,
      selectedProjectId: projectId,
    } as never)
  }

  const handleBack = () => {
    hapticFeedback.light()
    navigation.goBack()
  }

  // Render header for the list (New Project card)
  const ListHeader = () => (
    <View style={styles.headerSection}>
      <Text style={styles.sectionTitle}>Create New</Text>
      <NewProjectCard
        onPress={() => handleSelectProject(null)}
        isSelected={currentSelectedId === null}
      />

      {existingProjects.length > 0 && (
        <Text style={[styles.sectionTitle, styles.existingTitle]}>
          Add to Existing
        </Text>
      )}
    </View>
  )

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
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <BackIcon size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Project</Text>
          <View style={styles.backButton} />
        </View>

        {/* Projects Grid */}
        <FlatList
          data={existingProjects}
          renderItem={({ item }) => (
            <ProjectCard
              item={item}
              onPress={() => handleSelectProject(item.id)}
              isSelected={currentSelectedId === item.id}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={existingProjects.length > 0 ? styles.propertyRow : undefined}
          contentContainerStyle={styles.propertyGrid}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No existing projects yet
            </Text>
          }
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
  headerSection: {
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  existingTitle: {
    marginTop: 24,
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
  selectedCard: {
    borderWidth: 3,
    borderColor: '#D4AF37',
  },
  newProjectCard: {
    marginBottom: 8,
    maxWidth: (width - 48) / 2,
  },
  newProjectContent: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 14,
  },
  newProjectIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  newProjectText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
  },
  cardImageContainer: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  gridAddress: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 18,
  },
  photoCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
  },
})

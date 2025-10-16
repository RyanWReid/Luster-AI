import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Image,
  Alert,
  TextInput,
  Share,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Path, Circle } from 'react-native-svg'
import * as ImagePicker from 'expo-image-picker'
import ImageViewing from 'react-native-image-viewing'
import { useListings } from '../context/ListingsContext'
import hapticFeedback from '../utils/haptics'

const { width, height } = Dimensions.get('window')
const PHOTO_SIZE = (width - 48) / 2 // 2 columns with padding

// Icons
const BackIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke="#111827"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const PlusIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14m-7-7h14"
      stroke="#FFF"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const MenuIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="5" r="1.5" fill="#111827" />
    <Circle cx="12" cy="12" r="1.5" fill="#111827" />
    <Circle cx="12" cy="19" r="1.5" fill="#111827" />
  </Svg>
)

const ImageIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"
      stroke="#D4AF37"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="8.5" cy="8.5" r="1.5" stroke="#D4AF37" strokeWidth="2" />
    <Path
      d="M21 15l-5-5L5 21"
      stroke="#D4AF37"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const SparklesIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364 6.364l-2.121-2.121M6.757 8.757L4.636 6.636m12.728 0l-2.121 2.121M6.757 15.243l-2.121 2.121"
      stroke="#D4AF37"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const TrashIcon = ({ color = "#EF4444" }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const MoveIcon = ({ color = "#374151" }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 13h6m-3-3v6m-9-3h4m14 0h-4M3 16.5V7a2 2 0 012-2h14a2 2 0 012 2v9.5M9 21h6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const SaveIcon = ({ color = "#374151" }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5m0 0l5-5m-5 5V3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const ShareIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
      stroke="#374151"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const DownloadIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
      stroke="#374151"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

export default function ProjectScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { listings, addListing, updateListingName, removeListing } = useListings()

  // Get property ID from navigation params
  const propertyIdFromParams = (route.params as any)?.property?.id || '1'

  // Get current property data from listings context (source of truth)
  const propertyData = listings.find(l => l.id === propertyIdFromParams) || (route.params as any)?.property || {
    id: '1',
    address: 'New Project',
    price: '$---,---',
    beds: 0,
    baths: 0,
    image: null,
    images: [], // Enhanced photos only
  }

  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [showSelectionFooter, setShowSelectionFooter] = useState(false)

  // Simple fade animation
  const fadeAnim = useRef(new Animated.Value(0)).current
  // Selection footer slide animation
  const selectionSlideAnim = useRef(new Animated.Value(300)).current

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [])

  // Animate selection footer in/out
  React.useEffect(() => {
    if (isSelectionMode) {
      // Show footer and animate in
      setShowSelectionFooter(true)
      Animated.spring(selectionSlideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start()
    } else {
      // Animate out, then hide footer
      Animated.spring(selectionSlideAnim, {
        toValue: 300,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setShowSelectionFooter(false)
        }
      })
    }
  }, [isSelectionMode])

  const handleBack = () => {
    hapticFeedback.light()
    navigation.goBack()
  }

  const handleShare = async () => {
    hapticFeedback.medium()
    try {
      await Share.share({
        message: `Check out these ${enhancedPhotos.length} enhanced photos from ${propertyData.address}!`,
      })
    } catch (error) {
      console.error('Share error:', error)
    }
  }

  const handleExport = async () => {
    hapticFeedback.medium()
    Alert.alert(
      'Export Photos',
      `Export all ${enhancedPhotos.length} photos to your photo library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            // TODO: Implement actual export logic
            Alert.alert('Success', `${enhancedPhotos.length} photos exported!`)
          },
        },
      ]
    )
  }

  const handleMenu = () => {
    hapticFeedback.medium()
    Alert.alert(
      'Project Options',
      'Choose an action',
      [
        {
          text: 'Edit Name',
          onPress: handleEditName,
        },
        {
          text: 'Delete Project',
          style: 'destructive',
          onPress: handleDeleteProject,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    )
  }

  const handleEditName = () => {
    hapticFeedback.light()
    Alert.prompt(
      'Edit Project Name',
      'Enter a new name for this project',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (newName) => {
            if (newName && newName.trim()) {
              updateListingName(propertyData.id, newName.trim())
              hapticFeedback.notification('success')
            }
          },
        },
      ],
      'plain-text',
      propertyData.address
    )
  }

  const handleDeleteProject = () => {
    Alert.alert(
      'Delete Project?',
      'This will permanently delete all enhanced photos in this project.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeListing(propertyData.id)
            hapticFeedback.notification('success')
            navigation.goBack()
          },
        },
      ]
    )
  }

  const handleAddPhotos = async () => {
    // TODO(human): Implement add photos functionality
    // This should:
    // 1. Open image picker (camera or library)
    // 2. Allow multiple selection
    // 3. Upload to backend for enhancement
    // 4. Add enhanced photos to propertyData.images array

    hapticFeedback.medium()
    Alert.alert(
      'Add Photos',
      'This feature will allow you to add more photos to enhance.',
      [{ text: 'OK' }]
    )
  }

  const handlePhotoPress = (index: number) => {
    if (isSelectionMode) {
      togglePhotoSelection(propertyData.images[index].uri)
    } else {
      hapticFeedback.light()
      setSelectedImageIndex(index)
      setIsImageViewerVisible(true)
    }
  }

  const handlePhotoLongPress = (photoUri: string) => {
    hapticFeedback.medium()
    if (!isSelectionMode) {
      setIsSelectionMode(true)
      setSelectedPhotos([photoUri])
    }
  }

  const togglePhotoSelection = (photoUri: string) => {
    hapticFeedback.light()
    setSelectedPhotos(prev =>
      prev.includes(photoUri)
        ? prev.filter(uri => uri !== photoUri)
        : [...prev, photoUri]
    )
  }

  const handleCancelSelection = () => {
    hapticFeedback.light()
    setIsSelectionMode(false)
    setSelectedPhotos([])
  }

  const handleDeleteSelected = () => {
    hapticFeedback.medium()
    Alert.alert(
      'Delete Photos',
      `Delete ${selectedPhotos.length} photo${selectedPhotos.length > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement actual deletion logic
            hapticFeedback.notification('success')
            setIsSelectionMode(false)
            setSelectedPhotos([])
          },
        },
      ]
    )
  }

  const handleShareSelected = async () => {
    hapticFeedback.medium()
    try {
      await Share.share({
        message: `Sharing ${selectedPhotos.length} enhanced photo${selectedPhotos.length > 1 ? 's' : ''} from ${propertyData.address}`,
      })
    } catch (error) {
      console.error('Share error:', error)
    }
  }

  const handleSaveSelected = async () => {
    hapticFeedback.medium()
    Alert.alert(
      'Save Photos',
      `Save ${selectedPhotos.length} photo${selectedPhotos.length > 1 ? 's' : ''} to your device?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            // TODO: Implement actual save logic
            Alert.alert('Success', `${selectedPhotos.length} photo${selectedPhotos.length > 1 ? 's' : ''} saved!`)
            hapticFeedback.notification('success')
          },
        },
      ]
    )
  }

  const handleMoveSelected = () => {
    hapticFeedback.medium()
    // Get other properties for move options
    const otherProperties = listings.filter(l => l.id !== propertyData.id)

    if (otherProperties.length === 0) {
      Alert.alert('No Other Projects', 'Create another project first to move photos.')
      return
    }

    Alert.alert(
      'Move Photos',
      `Select a project to move ${selectedPhotos.length} photo${selectedPhotos.length > 1 ? 's' : ''} to:`,
      [
        ...otherProperties.slice(0, 3).map(prop => ({
          text: prop.address,
          onPress: () => {
            // TODO: Implement actual move logic
            Alert.alert('Success', `Moved ${selectedPhotos.length} photo${selectedPhotos.length > 1 ? 's' : ''} to ${prop.address}`)
            hapticFeedback.notification('success')
            setIsSelectionMode(false)
            setSelectedPhotos([])
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    )
  }

  const enhancedPhotos = propertyData.images || []
  const photoCount = enhancedPhotos.length

  return (
    <View style={styles.container}>
      {/* Iridescent gradient background */}
      <LinearGradient
        colors={['#FFF5F7', '#F7F0FF', '#F0F8FF', '#FFF8F0']}
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <BlurView intensity={60} tint="light" style={styles.headerButtonBlur}>
              <BackIcon />
            </BlurView>
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {propertyData.address}
          </Text>

          <TouchableOpacity onPress={handleMenu} style={styles.headerButton}>
            <BlurView intensity={60} tint="light" style={styles.headerButtonBlur}>
              <MenuIcon />
            </BlurView>
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Photo Gallery Section */}
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            {/* Photo Grid */}
            {photoCount === 0 ? (
              <BlurView intensity={60} tint="light" style={styles.emptyState}>
                <SparklesIcon />
                <Text style={styles.emptyStateTitle}>No Photos Yet</Text>
                <Text style={styles.emptyStateText}>
                  Add photos to enhance them with AI
                </Text>
                <TouchableOpacity onPress={handleAddPhotos} style={styles.emptyStateButton}>
                  <LinearGradient
                    colors={['#D4AF37', '#C19A2E']}
                    style={styles.emptyStateButtonGradient}
                  >
                    <PlusIcon />
                    <Text style={styles.emptyStateButtonText}>Add Photos</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </BlurView>
            ) : (
              <View style={styles.photoGrid}>
                {enhancedPhotos.map((photo: any, index: number) => {
                  const photoUri = typeof photo === 'string' ? photo : photo.uri
                  const isSelected = selectedPhotos.includes(photoUri)

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handlePhotoPress(index)}
                      onLongPress={() => handlePhotoLongPress(photoUri)}
                      activeOpacity={0.8}
                      style={styles.photoContainer}
                    >
                      <BlurView intensity={80} tint="light" style={styles.photoCard}>
                        <Image
                          source={{ uri: photoUri }}
                          style={styles.photoImage}
                          resizeMode="cover"
                        />

                        {isSelectionMode && (
                          <View style={styles.checkboxContainer}>
                            <BlurView intensity={80} tint="light" style={styles.checkbox}>
                              {isSelected && (
                                <View style={styles.checkboxSelected} />
                              )}
                            </BlurView>
                          </View>
                        )}

                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.3)']}
                          style={styles.photoOverlay}
                        />
                      </BlurView>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Floating Action Bar */}
        {!isSelectionMode && photoCount > 0 && (
          <Animated.View
            style={[
              styles.floatingActionBar,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.floatingActionBarContainer}>
              <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFillObject} />
              <View style={styles.floatingActionBarContent}>
                <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
                  <ShareIcon />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleExport} style={styles.actionButton}>
                  <DownloadIcon />
                  <Text style={styles.actionButtonText}>Export</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Selection Mode Footer */}
        {showSelectionFooter && (
          <Animated.View
            style={[
              styles.selectionFooter,
              {
                transform: [{ translateY: selectionSlideAnim }],
              },
            ]}
          >
            <BlurView intensity={80} tint="light" style={styles.selectionFooterContainer}>
              {/* Iridescent gradient overlay */}
              <LinearGradient
                colors={['rgba(255, 245, 247, 0.4)', 'rgba(247, 240, 255, 0.4)', 'rgba(240, 248, 255, 0.3)']}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              <View style={styles.selectionContent}>
                {/* Header with count and cancel */}
                <View style={styles.selectionHeader}>
                  <View style={styles.countBadgeContainer}>
                    <BlurView intensity={60} tint="light" style={styles.countBadgeBlur}>
                      <Text style={styles.selectionCount}>
                        {selectedPhotos.length} selected
                      </Text>
                    </BlurView>
                  </View>
                  <TouchableOpacity onPress={handleCancelSelection} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>

                {/* Action Buttons */}
                <View style={styles.selectionActions}>
                  <TouchableOpacity
                    onPress={handleShareSelected}
                    style={styles.actionIconButton}
                    disabled={selectedPhotos.length === 0}
                  >
                    <BlurView intensity={70} tint="light" style={styles.actionIconCircle}>
                      <ShareIcon />
                    </BlurView>
                    <Text style={styles.actionIconLabel}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSaveSelected}
                    style={styles.actionIconButton}
                    disabled={selectedPhotos.length === 0}
                  >
                    <BlurView intensity={70} tint="light" style={styles.actionIconCircle}>
                      <SaveIcon color="#6B7280" />
                    </BlurView>
                    <Text style={styles.actionIconLabel}>Save</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleMoveSelected}
                    style={styles.actionIconButton}
                    disabled={selectedPhotos.length === 0}
                  >
                    <BlurView intensity={70} tint="light" style={styles.actionIconCircle}>
                      <MoveIcon color="#6B7280" />
                    </BlurView>
                    <Text style={styles.actionIconLabel}>Move</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleDeleteSelected}
                    style={styles.actionIconButton}
                    disabled={selectedPhotos.length === 0}
                  >
                    <BlurView intensity={70} tint="light" style={[styles.actionIconCircle, styles.deleteIconCircle]}>
                      <TrashIcon color="#EF4444" />
                    </BlurView>
                    <Text style={[styles.actionIconLabel, styles.deleteIconLabel]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        )}

        {/* Bottom Fade Gradient - hidden in selection mode */}
        {!isSelectionMode && (
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.95)', 'rgba(255,255,255,1)']}
            locations={[0, 0.3, 0.7, 1]}
            style={styles.bottomFadeGradient}
            pointerEvents="none"
          />
        )}
      </SafeAreaView>

      {/* Image Viewer */}
      <ImageViewing
        images={enhancedPhotos.map((photo: any) => ({
          uri: typeof photo === 'string' ? photo : photo.uri,
        }))}
        imageIndex={selectedImageIndex}
        visible={isImageViewerVisible}
        onRequestClose={() => setIsImageViewerVisible(false)}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerButtonBlur: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  countBadge: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  addButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  photoContainer: {
    width: PHOTO_SIZE,
    marginBottom: 0,
  },
  photoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  photoImage: {
    width: '100%',
    height: PHOTO_SIZE * 1.2,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  checkboxContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D4AF37',
  },
  emptyState: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyStateButton: {
    marginTop: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  emptyStateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#D4AF37',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionButtonBlur: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  floatingActionBar: {
    position: 'absolute',
    bottom: 55,
    marginHorizontal: 20,
    left: 0,
    right: 0,
  },
  floatingActionBarContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(248, 248, 248, 0.75)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  floatingActionBarContent: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  selectionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  selectionFooterContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  selectionContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  countBadgeContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  countBadgeBlur: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
  },
  selectionCount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: 0.2,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
  },
  selectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 8,
  },
  actionIconButton: {
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  actionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.2,
  },
  deleteIconCircle: {
    backgroundColor: 'rgba(254, 242, 242, 0.9)',
    borderColor: 'rgba(254, 226, 226, 0.5)',
  },
  deleteIconLabel: {
    color: '#EF4444',
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

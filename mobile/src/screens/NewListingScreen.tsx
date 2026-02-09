import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native'
import CachedImage from '../components/CachedImage'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import { Camera } from 'expo-camera'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Path, Circle } from 'react-native-svg'
import { usePhotos } from '../context/PhotoContext'
import hapticFeedback from '../utils/haptics'

const { width } = Dimensions.get('window')

// Back icon
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

// Plus icon
const PlusIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14m-7-7h14"
      stroke="#D4AF37"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// Camera icon
const CameraIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z"
      stroke="#D4AF37"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx="12"
      cy="13"
      r="4"
      stroke="#D4AF37"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// Close icon for removing photos
const CloseIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke="#111827"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

const StepIndicator = ({ currentStep, totalSteps }: StepIndicatorProps) => {
  return (
    <View style={styles.stepContainer}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <View
          key={step}
          style={[
            styles.stepDot,
            step === currentStep && styles.stepDotActive,
            step < currentStep && styles.stepDotCompleted,
          ]}
        />
      ))}
    </View>
  )
}

export default function NewListingScreen() {
  const navigation = useNavigation()
  const { selectedPhotos, setSelectedPhotos } = usePhotos()
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [currentStep] = useState(1)

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current
  const blobAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Initialize with photos from context if available
    if (selectedPhotos.length > 0) {
      setSelectedImages(selectedPhotos)
    }

    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()

    // Background blob animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(blobAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(blobAnim, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start()
  }, [])

  const handleClose = () => {
    hapticFeedback.light()
    navigation.goBack()
  }

  const pickImage = async () => {
    hapticFeedback.medium()
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      allowsMultipleSelection: true,
    })

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => asset.uri)
      console.log('NewListingScreen - Images picked:', newImages)
      setSelectedImages([...selectedImages, ...newImages])
      hapticFeedback.notification('success')
    }
  }

  const takePhoto = async () => {
    hapticFeedback.medium()
    const { status } = await Camera.requestCameraPermissionsAsync()

    if (status !== 'granted') {
      alert('Camera permission is required to take photos')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    })

    if (!result.canceled && result.assets) {
      const newImage = result.assets[0].uri
      console.log('NewListingScreen - Photo taken:', newImage)
      setSelectedImages([...selectedImages, newImage])
      hapticFeedback.notification('success')
    }
  }

  const handleContinue = () => {
    if (selectedImages.length > 0) {
      hapticFeedback.medium()
      console.log('NewListingScreen - Storing images:', selectedImages)
      setSelectedPhotos(selectedImages)
      navigation.navigate('StyleSelection' as never)
    }
  }

  const removeImage = (index: number) => {
    hapticFeedback.light()
    setSelectedImages(selectedImages.filter((_, i) => i !== index))
  }

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

      {/* Organic blob animations */}
      <Animated.View
        style={[
          styles.blobContainer1,
          {
            transform: [
              {
                translateY: blobAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 30],
                }),
              },
              {
                translateX: blobAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 182, 193, 0.15)', 'rgba(255, 218, 185, 0.1)', 'transparent']}
          style={styles.blob}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.blobContainer2,
          {
            transform: [
              {
                translateY: blobAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -25],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(230, 190, 255, 0.15)', 'rgba(190, 220, 255, 0.1)', 'transparent']}
          style={styles.blob}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <BlurView intensity={60} tint="light" style={styles.backButtonBlur}>
              <BackIcon />
            </BlurView>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>New Listing</Text>

          <View style={styles.backButton} />
        </Animated.View>

        {/* Step Indicator */}
        <Animated.View
          style={[
            styles.stepIndicatorWrapper,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <StepIndicator currentStep={currentStep} totalSteps={3} />
        </Animated.View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View
            style={[
              styles.mainSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>Add photo</Text>
            <Text style={styles.sectionDescription}>
              Upload interior or exterior photos
            </Text>

            {/* Photo Grid */}
            <View style={styles.photoGrid}>
              {selectedImages.map((uri, index) => (
                <Animated.View key={index} style={styles.photoItem}>
                  <BlurView intensity={40} tint="light" style={styles.photoCard}>
                    <CachedImage source={uri} style={styles.uploadedPhoto} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removeImage(index)}
                    >
                      <BlurView intensity={80} tint="light" style={styles.removeButtonBlur}>
                        <CloseIcon />
                      </BlurView>
                    </TouchableOpacity>
                  </BlurView>
                </Animated.View>
              ))}
            </View>

            {/* Upload Buttons */}
            <View style={styles.uploadButtons}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.uploadButton}>
                <BlurView intensity={60} tint="light" style={styles.uploadButtonBlur}>
                  <PlusIcon />
                  <Text style={styles.uploadButtonText}>Add photo</Text>
                </BlurView>
              </TouchableOpacity>

              <TouchableOpacity onPress={takePhoto} activeOpacity={0.8} style={styles.uploadButton}>
                <BlurView intensity={60} tint="light" style={styles.uploadButtonBlur}>
                  <CameraIcon />
                  <Text style={styles.uploadButtonText}>Take photo</Text>
                </BlurView>
              </TouchableOpacity>
            </View>

            {selectedImages.length === 0 && (
              <Text style={styles.uploadHint}>Start by uploading your first photo</Text>
            )}
          </Animated.View>
        </ScrollView>

        {/* Continue Button */}
        <Animated.View
          style={[
            styles.bottomContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleContinue}
            disabled={selectedImages.length === 0}
            activeOpacity={0.8}
            style={styles.continueButtonTouchable}
          >
            <LinearGradient
              colors={
                selectedImages.length === 0 ? ['#D1D5DB', '#D1D5DB'] : ['#D4AF37', '#B8860B']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButton}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={{ marginLeft: 8 }}>
                <Path
                  d="M5 12h14m-7-7l7 7-7 7"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  blobContainer1: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 400,
    height: 400,
  },
  blobContainer2: {
    position: 'absolute',
    bottom: -150,
    right: -150,
    width: 450,
    height: 450,
  },
  blob: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  backButtonBlur: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  stepIndicatorWrapper: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  stepDotActive: {
    width: 24,
    height: 8,
    backgroundColor: '#D4AF37',
  },
  stepDotCompleted: {
    backgroundColor: '#10B981',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  mainSection: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  photoItem: {
    width: (width - 48 - 24) / 2,
    aspectRatio: 1,
    padding: 6,
  },
  photoCard: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  uploadedPhoto: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  removeButtonBlur: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  uploadButtons: {
    marginTop: 20,
    gap: 12,
  },
  uploadButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  uploadButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    gap: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  uploadHint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 24,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  continueButtonTouchable: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
})

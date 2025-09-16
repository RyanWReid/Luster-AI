import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import { Camera } from 'expo-camera'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle } from 'react-native-svg'
import { usePhotos } from '../context/PhotoContext'

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

// Plus icon
const PlusIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14m-7-7h14"
      stroke="#92400E"
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
      stroke="#92400E"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx="12"
      cy="13"
      r="4"
      stroke="#92400E"
      strokeWidth="2"
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
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => (
        <React.Fragment key={step}>
          <TouchableOpacity
            style={[
              styles.stepCircle,
              step === currentStep && styles.stepCircleActive,
              step < currentStep && styles.stepCircleCompleted,
            ]}
            disabled={step > currentStep}
          >
            <Text
              style={[
                styles.stepText,
                step === currentStep && styles.stepTextActive,
                step < currentStep && styles.stepTextCompleted,
              ]}
            >
              {step < currentStep ? '✓' : step === currentStep ? `Step ${step}` : step}
            </Text>
          </TouchableOpacity>
          {index < totalSteps - 1 && (
            <View
              style={[
                styles.stepLine,
                step < currentStep && styles.stepLineCompleted,
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  )
}

export default function NewListingScreen() {
  const navigation = useNavigation()
  const { selectedPhotos, setSelectedPhotos } = usePhotos()
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [currentStep] = useState(1)

  // Initialize with photos from context if available
  useEffect(() => {
    if (selectedPhotos.length > 0) {
      setSelectedImages(selectedPhotos)
    }
  }, [])

  const handleClose = () => {
    navigation.goBack()
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      allowsMultipleSelection: true,
    })

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri)
      console.log('NewListingScreen - Images picked:', newImages)
      setSelectedImages([...selectedImages, ...newImages])
    }
  }

  const takePhoto = async () => {
    // Request camera permission
    const { status } = await Camera.requestCameraPermissionsAsync()
    
    if (status !== 'granted') {
      alert('Camera permission is required to take photos')
      return
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    })

    if (!result.canceled && result.assets) {
      const newImage = result.assets[0].uri
      console.log('NewListingScreen - Photo taken:', newImage)
      setSelectedImages([...selectedImages, newImage])
    }
  }

  const handleContinue = () => {
    if (selectedImages.length > 0) {
      // Store images in context
      console.log('NewListingScreen - Storing images:', selectedImages)
      setSelectedPhotos(selectedImages)
      // Navigate to style selection (step 2)
      navigation.navigate('StyleSelection' as never)
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index))
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>New Listing</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <CloseIcon />
        </TouchableOpacity>
      </View>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} totalSteps={3} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Add Photo Section */}
        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>Add photo</Text>
          <Text style={styles.sectionDescription}>
            Upload an interior or exterior photo
          </Text>

          {/* Photo Upload Area */}
          <View style={styles.photoGrid}>
            {selectedImages.map((uri, index) => (
              <View key={index} style={styles.photoItem}>
                <Image source={{ uri }} style={styles.uploadedPhoto} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removeImage(index)}
                >
                  <CloseIcon />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Photo Button */}
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              <View style={styles.addPhotoContent}>
                <PlusIcon />
                <Text style={styles.addPhotoText}>Add photo</Text>
              </View>
            </TouchableOpacity>

            {/* Camera Button */}
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={takePhoto}
              activeOpacity={0.8}
            >
              <View style={styles.addPhotoContent}>
                <CameraIcon />
                <Text style={styles.addPhotoText}>Take photo</Text>
              </View>
            </TouchableOpacity>
          </View>

          {selectedImages.length === 0 && (
            <Text style={styles.uploadHint}>Upload an interior photo</Text>
          )}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={selectedImages.length === 0}
          activeOpacity={0.8}
          style={styles.continueButtonTouchable}
        >
          <LinearGradient
            colors={selectedImages.length === 0 ? ['#D1D5DB', '#D1D5DB'] : ['#fbbf24', '#f59e0b']}
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
    paddingBottom: 20,
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
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  stepCircle: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  stepCircleActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  stepTextActive: {
    color: '#92400E',
    fontWeight: '600',
  },
  stepTextCompleted: {
    color: '#FFFFFF',
  },
  stepLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  stepLineCompleted: {
    backgroundColor: '#10B981',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  photoSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  photoItem: {
    width: '50%',
    padding: 8,
    aspectRatio: 1,
  },
  uploadedPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    marginTop: 24,
  },
  addPhotoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  uploadHint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  continueButtonTouchable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
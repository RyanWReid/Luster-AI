import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../context/AuthContext'
import enhancementService from '../services/enhancementService'

const STYLE_PRESETS = [
  { id: 'luster', name: 'Luster', icon: 'sparkles' },
  { id: 'flambient', name: 'Flambient', icon: 'sunny' },
]

export default function HomeScreen() {
  const { credits, refreshCredits, synced } = useAuth()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string>('luster')
  const [processing, setProcessing] = useState(false)
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null)

  // Refresh credits when user is synced
  useEffect(() => {
    if (synced) {
      refreshCredits()
    }
  }, [synced])

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: false,
    })

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri)
      setEnhancedImageUrl(null)
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.9,
      allowsEditing: false,
    })

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri)
      setEnhancedImageUrl(null)
    }
  }

  const handleEnhance = async () => {
    if (!selectedImage) {
      Alert.alert('No image', 'Please select an image first')
      return
    }
    if (credits <= 0) {
      Alert.alert('No credits', 'Purchase more credits to continue')
      return
    }

    try {
      setProcessing(true)

      // Start enhancement job - sends image to backend which processes and stores output in R2
      const enhanceResult = await enhancementService.enhanceImage({
        imageUrl: selectedImage,
        style: selectedStyle as 'luster' | 'flambient',
      })

      // Poll for completion
      const jobResult = await enhancementService.pollJobStatus(
        enhanceResult.job_id,
        (status) => {
          console.log(`Enhancement status: ${status}`)
        }
      )

      if (jobResult.status === 'succeeded' && jobResult.enhanced_image_url) {
        setEnhancedImageUrl(jobResult.enhanced_image_url)
        // Refresh credits after successful enhancement
        await refreshCredits()
        Alert.alert('Success', 'Your photo has been enhanced!')
      } else {
        Alert.alert('Enhancement failed', jobResult.error || 'Unknown error')
      }
    } catch (error: any) {
      console.error('Enhancement error:', error)
      Alert.alert('Error', error.message || 'Failed to enhance photo')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.creditBar}>
          <Text style={styles.creditText}>Credits: {credits}</Text>
          <TouchableOpacity style={styles.buyButton}>
            <Text style={styles.buyButtonText}>Buy More</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.uploadSection}>
          {selectedImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  setSelectedImage(null)
                  setEnhancedImageUrl(null)
                }}
              >
                <Ionicons name="close-circle" size={32} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Ionicons name="images" size={32} color="#D4AF37" />
                <Text style={styles.uploadButtonText}>Choose Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                <Ionicons name="camera" size={32} color="#D4AF37" />
                <Text style={styles.uploadButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {enhancedImageUrl && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>Enhanced Result</Text>
            <Image
              source={{ uri: enhancedImageUrl }}
              style={styles.resultImage}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={styles.stylesSection}>
          <Text style={styles.sectionTitle}>Enhancement Style</Text>
          <View style={styles.styleGrid}>
            {STYLE_PRESETS.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleCard,
                  selectedStyle === style.id && styles.styleCardSelected,
                ]}
                onPress={() => setSelectedStyle(style.id)}
              >
                <Ionicons
                  name={style.icon as any}
                  size={32}
                  color={selectedStyle === style.id ? '#D4AF37' : '#9ca3af'}
                />
                <Text
                  style={[
                    styles.styleCardText,
                    selectedStyle === style.id && styles.styleCardTextSelected,
                  ]}
                >
                  {style.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.enhanceButton,
            (!selectedImage || processing) && styles.enhanceButtonDisabled,
          ]}
          onPress={handleEnhance}
          disabled={!selectedImage || processing}
        >
          {processing ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator color="#0a0a0a" size="small" />
              <Text style={styles.enhanceButtonText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.enhanceButtonText}>Enhance Photo</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  creditBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  creditText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
  },
  buyButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buyButtonText: {
    color: '#0a0a0a',
    fontWeight: '600',
  },
  uploadSection: {
    padding: 16,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
  },
  imageContainer: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  resultSection: {
    padding: 16,
  },
  resultImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
  },
  stylesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  styleCard: {
    width: '47%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  styleCardSelected: {
    borderColor: '#D4AF37',
    backgroundColor: '#1a1a0a',
  },
  styleCardText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
  },
  styleCardTextSelected: {
    color: '#D4AF37',
    fontWeight: '600',
  },
  enhanceButton: {
    backgroundColor: '#D4AF37',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  enhanceButtonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  enhanceButtonText: {
    color: '#0a0a0a',
    fontSize: 18,
    fontWeight: '600',
  },
})

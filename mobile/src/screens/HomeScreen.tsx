import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import CachedImage from '../components/CachedImage'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../context/AuthContext'
import enhancementService from '../services/enhancementService'
import { useErrorHandler } from '../hooks/useErrorHandler'

const STYLE_PRESETS = [
  { id: 'luster', name: 'Luster', icon: 'sparkles' },
  { id: 'flambient', name: 'Flambient', icon: 'sunny' },
]

export default function HomeScreen() {
  const { credits, refreshCredits, synced } = useAuth()
  const { handleError } = useErrorHandler()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string>('luster')
  const [processing, setProcessing] = useState(false)
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Refresh credits when user is synced
  useEffect(() => {
    if (synced) {
      refreshCredits()
    }
  }, [synced])

  // Refresh credits when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (synced) {
        refreshCredits()
      }
    }, [synced])
  )

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refreshCredits()
    setRefreshing(false)
  }, [refreshCredits])

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
      setError(null)
      setEnhancedImageUrl(null)

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
        // Convert relative URL to absolute URL
        const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://luster-ai-production.up.railway.app'
        const fullUrl = jobResult.enhanced_image_url.startsWith('http')
          ? jobResult.enhanced_image_url
          : `${API_BASE_URL}${jobResult.enhanced_image_url}`
        console.log('Enhanced image URL:', fullUrl)
        setEnhancedImageUrl(fullUrl)
        // Refresh credits after successful enhancement
        await refreshCredits()
        Alert.alert('Success', 'Your photo has been enhanced!')
      } else {
        // Refund should happen automatically on backend
        await refreshCredits()
        setError(jobResult.error || 'Enhancement failed')
      }
    } catch (err: unknown) {
      // Use centralized error handler - handles rate limits, auth, credits, etc.
      handleError(err, {
        onRetry: handleEnhance,
        onHandled: (info) => {
          // Only show inline error for unknown/validation errors
          if (info.type === 'unknown' || info.type === 'validation') {
            setError(info.message)
          } else {
            setError(null) // Alert handles it
          }
        },
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.creditBar}>
          <Text style={styles.creditText}>Credits: {credits}</Text>
          <TouchableOpacity style={styles.buyButton}>
            <Text style={styles.buyButtonText}>Buy More</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.uploadSection}>
          {selectedImage ? (
            <View style={styles.imageContainer}>
              <CachedImage source={selectedImage} style={styles.previewImage} />
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
            <CachedImage
              source={enhancedImageUrl}
              style={styles.resultImage}
              contentFit="contain"
            />
          </View>
        )}

        {error && (
          <View style={styles.errorSection}>
            <View style={styles.errorHeader}>
              <Ionicons name="close-circle" size={32} color="#ef4444" />
              <Text style={styles.errorTitle}>Enhancement Failed</Text>
            </View>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => setError(null)}
            >
              <Text style={styles.retryButtonText}>Dismiss</Text>
            </TouchableOpacity>
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
  errorSection: {
    padding: 16,
    margin: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '500',
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

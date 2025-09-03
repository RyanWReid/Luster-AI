import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'

const STYLE_PRESETS = [
  { id: 'dusk', name: 'Twilight Sky', icon: 'partly-sunny' },
  { id: 'lawn', name: 'Perfect Lawn', icon: 'leaf' },
  { id: 'sky', name: 'Blue Sky', icon: 'sunny' },
  { id: 'staging', name: 'Virtual Staging', icon: 'home' },
]

export default function HomeScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string>('dusk')
  const [credits, setCredits] = useState(3)

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    })

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri)
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      allowsEditing: false,
    })

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri)
    }
  }

  const handleEnhance = () => {
    if (!selectedImage) {
      Alert.alert('No image', 'Please select an image first')
      return
    }
    if (credits <= 0) {
      Alert.alert('No credits', 'Purchase more credits to continue')
      return
    }
    
    Alert.alert('Coming Soon', 'Enhancement processing will be implemented here')
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
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close-circle" size={32} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Ionicons name="images" size={32} color="#6366f1" />
                <Text style={styles.uploadButtonText}>Choose Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                <Ionicons name="camera" size={32} color="#6366f1" />
                <Text style={styles.uploadButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

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
                  color={selectedStyle === style.id ? '#6366f1' : '#9ca3af'}
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
          style={[styles.enhanceButton, !selectedImage && styles.enhanceButtonDisabled]}
          onPress={handleEnhance}
          disabled={!selectedImage}
        >
          <Text style={styles.enhanceButtonText}>Enhance Photo</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  creditText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  buyButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buyButtonText: {
    color: 'white',
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
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  imageContainer: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  stylesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  styleCard: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  styleCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f9ff',
  },
  styleCardText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  styleCardTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  enhanceButton: {
    backgroundColor: '#6366f1',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  enhanceButtonDisabled: {
    opacity: 0.5,
  },
  enhanceButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
})
import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
} from 'react-native'
import CachedImage from '../components/CachedImage'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { RootStackParamList } from '../navigation/RootNavigator'

type StyleSelectionNavigationProp = StackNavigationProp<RootStackParamList>
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Path } from 'react-native-svg'
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

// Check icon
const CheckIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke="white"
      strokeWidth="3"
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

type StyleOption = 'Neutral' | 'Bright' | 'Warm' | 'Evening' | 'Noir' | 'Soft'
type BackendStyle = 'neutral' | 'bright' | 'warm' | 'evening' | 'noir' | 'soft'

interface StyleCardProps {
  title: StyleOption
  image: any
  isSelected: boolean
  onSelect: () => void
}

const StyleCard = ({ title, image, isSelected, onSelect }: StyleCardProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    hapticFeedback.light()
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start()
  }

  return (
    <Animated.View
      style={[
        styles.styleCard,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={[styles.cardWrapper, isSelected && styles.cardWrapperSelected]}>
          {isSelected && (
            <LinearGradient
              colors={['#D4AF37', '#F59E0B', '#D4AF37']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.selectionGradient}
            />
          )}
          <BlurView
            intensity={40}
            tint="light"
            style={styles.imageContainer}
          >
            <CachedImage source={image} style={styles.styleImage} />
            {isSelected && (
              <View style={styles.checkmarkContainer}>
                <LinearGradient
                  colors={['#D4AF37', '#B8860B']}
                  style={styles.checkmark}
                >
                  <CheckIcon />
                </LinearGradient>
              </View>
            )}
          </BlurView>
        </View>
        <Text style={styles.styleTitle}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function StyleSelectionScreen() {
  const navigation = useNavigation<StyleSelectionNavigationProp>()
  const { selectedPhotos } = usePhotos()
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null)
  const [selectedBackendStyle, setSelectedBackendStyle] = useState<BackendStyle | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const currentStep = 2

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current
  const blobAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
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

  // Style options with unique thumbnails
  // Maps to backend styles: neutral, bright, warm, evening, noir, soft
  const styleOptions = [
    { title: 'Neutral' as StyleOption, image: require('../../assets/thumbnails/Neutral.png'), backendStyle: 'neutral' as BackendStyle },
    { title: 'Bright' as StyleOption, image: require('../../assets/thumbnails/Bright.png'), backendStyle: 'bright' as BackendStyle },
    { title: 'Warm' as StyleOption, image: require('../../assets/thumbnails/Warm.png'), backendStyle: 'warm' as BackendStyle },
    { title: 'Evening' as StyleOption, image: require('../../assets/thumbnails/Evening.png'), backendStyle: 'evening' as BackendStyle },
    { title: 'Noir' as StyleOption, image: require('../../assets/thumbnails/Noir.png'), backendStyle: 'noir' as BackendStyle },
    { title: 'Soft' as StyleOption, image: require('../../assets/thumbnails/Cozy.png'), backendStyle: 'soft' as BackendStyle },
  ]

  const handleClose = () => {
    hapticFeedback.light()
    navigation.goBack()
  }

  const handleChooseStyle = () => {
    if (selectedStyle && selectedBackendStyle) {
      hapticFeedback.medium()
      navigation.navigate('Confirmation', {
        style: selectedStyle,
        backendStyle: selectedBackendStyle,
        photoCount: selectedPhotos.length || 1,
      })
    }
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
              styles.vibeSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text style={styles.vibeTitle}>Pick the vibe</Text>
            <Text style={styles.vibeSubtitle}>Choose a style</Text>

            {/* Style Cards Grid */}
            <View style={styles.styleGrid}>
              {styleOptions.map((option, index) => (
                <StyleCard
                  key={index}
                  title={option.title}
                  image={option.image}
                  isSelected={selectedIndex === index}
                  onSelect={() => {
                    hapticFeedback.selection()
                    setSelectedStyle(option.title)
                    setSelectedBackendStyle(option.backendStyle)
                    setSelectedIndex(index)
                  }}
                />
              ))}
            </View>
          </Animated.View>
        </ScrollView>

        {/* Choose Button */}
        <Animated.View
          style={[
            styles.bottomContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleChooseStyle}
            disabled={!selectedStyle}
            activeOpacity={0.8}
            style={styles.chooseButtonTouchable}
          >
            <LinearGradient
              colors={!selectedStyle ? ['#D1D5DB', '#D1D5DB'] : ['#D4AF37', '#B8860B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.chooseButton}
            >
              <Text style={styles.chooseButtonText}>Choose this style</Text>
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
    marginBottom: 24,
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
  vibeSection: {
    paddingHorizontal: 24,
    flex: 1,
  },
  vibeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  vibeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  styleCard: {
    width: (width - 48 - 24) / 3,
    marginHorizontal: 6,
    marginBottom: 20,
    alignItems: 'center',
  },
  cardWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  cardWrapperSelected: {
    padding: 3,
  },
  selectionGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  styleImage: {
    width: '100%',
    height: '100%',
  },
  styleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  checkmark: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  chooseButtonTouchable: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  chooseButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
})

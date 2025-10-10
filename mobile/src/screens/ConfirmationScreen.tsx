import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Path, Circle } from 'react-native-svg'
import { usePhotos } from '../context/PhotoContext'
import hapticFeedback from '../utils/haptics'

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

// Edit icon
const EditIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke="#6B7280"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke="#6B7280"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// Coin icon
const CoinIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke="#D4AF37" strokeWidth="2" />
    <Path
      d="M12 6v12M8 9h8M8 15h8"
      stroke="#D4AF37"
      strokeWidth="2"
      strokeLinecap="round"
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

interface SummaryRowProps {
  label: string
  value: string
  onEdit: () => void
}

const SummaryRow = ({ label, value, onEdit }: SummaryRowProps) => (
  <BlurView intensity={60} tint="light" style={styles.summaryRowBlur}>
    <View style={styles.summaryContent}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
    <TouchableOpacity style={styles.editButton} onPress={onEdit}>
      <EditIcon />
    </TouchableOpacity>
  </BlurView>
)

export default function ConfirmationScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { selectedPhotos } = usePhotos()
  const currentStep = 3

  // Get data from previous screens
  const selectedStyle = (route.params as any)?.style || 'Flambient'
  const photoCount = selectedPhotos.length || 1
  const tokenCost = photoCount * 2 // Example: 2 tokens per photo

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

  const handleClose = () => {
    hapticFeedback.light()
    navigation.navigate('Main' as never)
  }

  const handleEditVibe = () => {
    hapticFeedback.light()
    navigation.navigate('StyleSelection' as never)
  }

  const handleEditPhotos = () => {
    hapticFeedback.light()
    navigation.navigate('NewListing' as never)
  }

  const handleConfirm = () => {
    hapticFeedback.medium()

    const styleMapping: { [key: string]: 'luster' | 'flambient' } = {
      Luster: 'luster',
      Flambient: 'flambient',
      Minimalist: 'flambient',
    }

    const apiStyle = styleMapping[selectedStyle] || 'luster'

    navigation.navigate('Processing' as never, {
      style: apiStyle,
      photos: selectedPhotos,
      photoCount: photoCount,
    })
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

          <Text style={styles.headerTitle}>Confirm</Text>

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
              styles.summarySection,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Vibe Selection */}
            <SummaryRow label="Vibe" value={selectedStyle} onEdit={handleEditVibe} />

            {/* Photos Count */}
            <SummaryRow
              label="Photos"
              value={`${photoCount} Photo${photoCount > 1 ? 's' : ''}`}
              onEdit={handleEditPhotos}
            />

            {/* Cost Display */}
            <BlurView intensity={60} tint="light" style={styles.costCard}>
              <View style={styles.costHeader}>
                <CoinIcon />
                <Text style={styles.costLabel}>Total Cost</Text>
              </View>
              <View style={styles.costValueContainer}>
                <Text style={styles.costValue}>{tokenCost}</Text>
                <Text style={styles.costUnit}>Credits</Text>
              </View>
              <Text style={styles.costDetail}>
                {photoCount} photo{photoCount > 1 ? 's' : ''} × 2 credits each
              </Text>
            </BlurView>
          </Animated.View>
        </ScrollView>

        {/* Confirm Button */}
        <Animated.View
          style={[
            styles.bottomContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleConfirm}
            activeOpacity={0.8}
            style={styles.confirmButtonTouchable}
          >
            <LinearGradient
              colors={['#D4AF37', '#B8860B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmButton}
            >
              <Text style={styles.confirmButtonText}>Start Enhancement</Text>
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
  summarySection: {
    paddingHorizontal: 24,
    gap: 16,
  },
  summaryRowBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  costCard: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    marginTop: 8,
    overflow: 'hidden',
  },
  costHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  costLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  costValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  costValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: -1,
  },
  costUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#D4AF37',
  },
  costDetail: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  confirmButtonTouchable: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
})

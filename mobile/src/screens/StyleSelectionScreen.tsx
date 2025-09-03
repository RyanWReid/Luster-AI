import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path } from 'react-native-svg'

const { width } = Dimensions.get('window')

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

type StyleOption = 'Flambient' | 'Minimalist' | 'Luster'

interface StyleCardProps {
  title: StyleOption
  image: any
  isSelected: boolean
  onSelect: () => void
  index: number
}

const StyleCard = ({ title, image, isSelected, onSelect, index }: StyleCardProps) => (
  <TouchableOpacity
    style={styles.styleCard}
    onPress={onSelect}
    activeOpacity={0.9}
  >
    <View style={[styles.imageContainer, isSelected && styles.imageContainerSelected]}>
      <Image source={image} style={styles.styleImage} />
      {isSelected && (
        <View style={styles.checkmark}>
          <CheckIcon />
        </View>
      )}
    </View>
    <Text style={styles.styleTitle}>{title}</Text>
  </TouchableOpacity>
)

export default function StyleSelectionScreen() {
  const navigation = useNavigation()
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const currentStep = 2

  // Create 3x3 grid - 3 rows of each style
  const styleOptions = [
    { title: 'Flambient' as StyleOption, image: require('../../assets/photo.png') },
    { title: 'Minimalist' as StyleOption, image: require('../../assets/photo.png') },
    { title: 'Luster' as StyleOption, image: require('../../assets/photo.png') },
    { title: 'Flambient' as StyleOption, image: require('../../assets/photo.png') },
    { title: 'Minimalist' as StyleOption, image: require('../../assets/photo.png') },
    { title: 'Luster' as StyleOption, image: require('../../assets/photo.png') },
    { title: 'Flambient' as StyleOption, image: require('../../assets/photo.png') },
    { title: 'Minimalist' as StyleOption, image: require('../../assets/photo.png') },
    { title: 'Luster' as StyleOption, image: require('../../assets/photo.png') },
  ]

  const handleClose = () => {
    navigation.goBack()
  }

  const handleChooseStyle = () => {
    if (selectedStyle) {
      // Navigate to confirmation screen with selected style
      navigation.navigate('Confirmation' as never, { 
        style: selectedStyle,
        photoCount: 10 // This should come from previous screen in real app
      })
    }
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

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Pick the vibe */}
        <View style={styles.vibeSection}>
          <Text style={styles.vibeTitle}>Pick the vibe</Text>
          <Text style={styles.vibeSubtitle}>Choose a style</Text>
          
          {/* Style Cards Grid */}
          <View style={styles.styleGrid}>
            {styleOptions.map((option, index) => (
              <StyleCard
                key={index}
                index={index}
                title={option.title}
                image={option.image}
                isSelected={selectedIndex === index}
                onSelect={() => {
                  setSelectedStyle(option.title)
                  setSelectedIndex(index)
                }}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Choose Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          onPress={handleChooseStyle}
          disabled={!selectedStyle}
          activeOpacity={0.8}
          style={styles.chooseButtonTouchable}
        >
          <LinearGradient
            colors={!selectedStyle ? ['#D1D5DB', '#D1D5DB'] : ['#fbbf24', '#f59e0b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.chooseButton}
          >
            <Text style={styles.chooseButtonText}>Choose this style</Text>
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
    marginBottom: 24,
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
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
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
    width: (width - 48 - 24) / 3, // 3 columns with padding
    marginHorizontal: 6,
    marginBottom: 20,
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  imageContainerSelected: {
    borderColor: '#FCD34D',
    borderWidth: 3,
  },
  styleImage: {
    width: '100%',
    height: '100%',
  },
  styleTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  chooseButtonTouchable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  chooseButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
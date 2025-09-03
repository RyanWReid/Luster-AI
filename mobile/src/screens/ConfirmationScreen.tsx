import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path } from 'react-native-svg'

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

// Edit icon
const EditIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke="#374151"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke="#374151"
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
            disabled={step >= currentStep}
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
                step <= currentStep && styles.stepLineCompleted,
              ]}
            />
          )}
        </React.Fragment>
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
  <View style={styles.summaryRow}>
    <View style={styles.summaryContent}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
    <TouchableOpacity style={styles.editButton} onPress={onEdit}>
      <EditIcon />
    </TouchableOpacity>
  </View>
)

export default function ConfirmationScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const currentStep = 3

  // Get data from previous screens (in a real app, this would come from route params or context)
  const selectedStyle = (route.params as any)?.style || 'Flambient'
  const photoCount = (route.params as any)?.photoCount || 10
  const tokenCost = photoCount * 2 // Example: 2 tokens per photo

  const handleClose = () => {
    navigation.navigate('Dashboard' as never)
  }

  const handleEditVibe = () => {
    navigation.navigate('StyleSelection' as never)
  }

  const handleEditPhotos = () => {
    navigation.navigate('NewListing' as never)
  }

  const handleConfirm = () => {
    // Process the enhancement request
    console.log('Processing enhancement with:', {
      style: selectedStyle,
      photos: photoCount,
      cost: tokenCost,
    })
    // Navigate to processing screen
    navigation.navigate('Processing' as never)
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
        <View style={styles.summarySection}>
          {/* Vibe Selection */}
          <SummaryRow
            label="Vibe"
            value={selectedStyle}
            onEdit={handleEditVibe}
          />

          {/* Photos Count */}
          <SummaryRow
            label="Photos"
            value={`${photoCount} Photos`}
            onEdit={handleEditPhotos}
          />

          {/* Cost Display */}
          <View style={styles.costSection}>
            <Text style={styles.costLabel}>Cost:</Text>
            <Text style={styles.costValue}>
              {tokenCost} <Text style={styles.tokensText}>Tokens</Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          onPress={handleConfirm}
          activeOpacity={0.8}
          style={styles.confirmButtonTouchable}
        >
          <LinearGradient
            colors={['#fbbf24', '#f59e0b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmButton}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
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
  },
  scrollContent: {
    paddingBottom: 20,
  },
  summarySection: {
    paddingHorizontal: 24,
    flex: 1,
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    color: '#6B7280',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  costSection: {
    paddingVertical: 40,
    alignItems: 'flex-start',
  },
  costLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  costValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F59E0B',
  },
  tokensText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#F59E0B',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  confirmButtonTouchable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
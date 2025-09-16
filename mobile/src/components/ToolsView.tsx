import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native'
import { triggerHaptic } from '../utils/haptic'
import { copyToClipboard } from '../utils/clipboard'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { useListings } from '../context/ListingsContext'

// Icons
const AIIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      stroke="#FFBF35"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const DownloadIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5m0 0l5-5m-5 5V3"
      stroke="#6B7280"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const ShareIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle cx="18" cy="5" r="3" stroke="#6B7280" strokeWidth="2" />
    <Circle cx="6" cy="12" r="3" stroke="#6B7280" strokeWidth="2" />
    <Circle cx="18" cy="19" r="3" stroke="#6B7280" strokeWidth="2" />
    <Path
      d="M8.59 13.51l6.83 3.98m-.01-10.98l-6.82 3.98"
      stroke="#6B7280"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const CopyIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Rect
      x="9"
      y="9"
      width="13"
      height="13"
      rx="2"
      stroke="#6B7280"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
      stroke="#6B7280"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const TrashIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
      stroke="#EF4444"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const CheckIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke="#10B981"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

interface ToolsViewProps {
  propertyData: any
}

type ToneType = 'professional' | 'friendly' | 'luxury'

export default function ToolsView({ propertyData }: ToolsViewProps) {
  const navigation = useNavigation()
  const { removeListing } = useListings()
  const [showMLSModal, setShowMLSModal] = useState(false)
  const [selectedTone, setSelectedTone] = useState<ToneType>('professional')
  const [generatedDescription, setGeneratedDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateMLSDescription = async () => {
    setIsGenerating(true)
    triggerHaptic('medium')

    // Simulate AI generation (replace with actual API call)
    setTimeout(() => {
      const descriptions = {
        professional: `Exceptional ${propertyData.propertyType || 'Single Family'} residence offering ${propertyData.squareFeet?.toLocaleString() || '2,450'} square feet of meticulously designed living space. This ${propertyData.beds}-bedroom, ${propertyData.baths}-bathroom home built in ${propertyData.yearBuilt || '2020'} showcases modern architecture and premium finishes throughout. Located at ${propertyData.address}, this property features an open-concept floor plan, gourmet kitchen with high-end appliances, and master suite with spa-inspired bath. The ${propertyData.lotSize || '0.25-acre'} lot provides ample outdoor entertaining space with mature landscaping. Recent updates include new HVAC system and smart home technology. Conveniently located near top-rated schools, shopping, and dining. This turnkey property represents exceptional value at ${propertyData.price}.`,
        
        friendly: `Welcome to your dream home at ${propertyData.address}! This beautiful ${propertyData.beds}-bedroom, ${propertyData.baths}-bathroom home is perfect for creating lasting memories. With ${propertyData.squareFeet?.toLocaleString() || '2,450'} square feet of thoughtfully designed space, there's room for everyone to spread out and relax. The heart of the home features a stunning kitchen that flows seamlessly into the living areas - perfect for both everyday living and entertaining friends. You'll love the peaceful master retreat and the private backyard oasis on this ${propertyData.lotSize || 'quarter-acre'} lot. Built in ${propertyData.yearBuilt || '2020'}, this home has been lovingly maintained and is move-in ready. Come see why this special property listed at ${propertyData.price} won't last long!`,
        
        luxury: `Presenting an extraordinary ${propertyData.propertyType || 'estate'} in one of the area's most coveted locations. This architectural masterpiece spans ${propertyData.squareFeet?.toLocaleString() || '2,450'} square feet of refined elegance, featuring ${propertyData.beds} sumptuous bedrooms and ${propertyData.baths} spa-inspired bathrooms. Constructed in ${propertyData.yearBuilt || '2020'} with uncompromising attention to detail, this residence exemplifies sophisticated living with soaring ceilings, designer finishes, and seamless indoor-outdoor flow. The gourmet chef's kitchen features top-of-the-line appliances and custom cabinetry. The luxurious master suite offers a private sanctuary with panoramic views. Set on ${propertyData.lotSize || 'a quarter-acre of manicured grounds'}, this exceptional offering at ${propertyData.price} represents a rare opportunity for the discerning buyer seeking unparalleled quality and lifestyle.`
      }

      setGeneratedDescription(descriptions[selectedTone])
      setIsGenerating(false)
      triggerHaptic('medium')
    }, 2000)
  }

  const handleCopyDescription = async () => {
    await copyToClipboard(generatedDescription)
    setCopied(true)
    triggerHaptic('light')
    
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const handleShareListing = async () => {
    try {
      await Share.share({
        message: `Check out this property!\n\n${propertyData.address}\n${propertyData.price}\n${propertyData.beds} beds, ${propertyData.baths} baths\n\nView more details in the Luster AI app!`,
        title: `Property Listing - ${propertyData.address}`,
      })
    } catch (error) {
      console.log('Error sharing:', error)
    }
  }

  const handleDownloadPhotos = () => {
    Alert.alert(
      'Download Photos',
      `Download all ${propertyData.images?.length || 6} enhanced photos to your device?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Download', 
          onPress: () => {
            // TODO: Implement actual download
            Alert.alert('Success', 'Photos downloaded to your gallery')
          }
        }
      ]
    )
  }

  const handleCopyInfo = async () => {
    const info = `${propertyData.address}
${propertyData.price}
${propertyData.beds} beds, ${propertyData.baths} baths
${propertyData.squareFeet ? `${propertyData.squareFeet.toLocaleString()} sq ft` : ''}
${propertyData.propertyType || 'Single Family'}
${propertyData.yearBuilt ? `Built in ${propertyData.yearBuilt}` : ''}
${propertyData.lotSize || ''}
${propertyData.mlsNumber ? `MLS #${propertyData.mlsNumber}` : ''}`

    await copyToClipboard(info)
    Alert.alert('Copied!', 'Property info copied to clipboard')
  }

  const handleDeleteProject = () => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${propertyData.address}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (propertyData.id) {
              removeListing(propertyData.id)
            }
            navigation.goBack()
          }
        }
      ]
    )
  }

  const ToolButton = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    danger = false 
  }: { 
    icon: React.ReactNode
    title: string
    subtitle: string
    onPress: () => void
    danger?: boolean 
  }) => (
    <TouchableOpacity 
      style={[styles.toolButton, danger && styles.toolButtonDanger]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.toolIcon, danger && styles.toolIconDanger]}>
        {icon}
      </View>
      <View style={styles.toolContent}>
        <Text style={[styles.toolTitle, danger && styles.toolTitleDanger]}>
          {title}
        </Text>
        <Text style={[styles.toolSubtitle, danger && styles.toolSubtitleDanger]}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Listing Tools</Text>

        {/* Primary CTA - MLS Generator */}
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => setShowMLSModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.primaryIcon}>
            <AIIcon />
          </View>
          <View style={styles.primaryContent}>
            <Text style={styles.primaryTitle}>Generate MLS Description</Text>
            <Text style={styles.primarySubtitle}>AI-powered listing description</Text>
          </View>
        </TouchableOpacity>

        {/* Other Tools */}
        <View style={styles.toolsGrid}>
          <ToolButton
            icon={<DownloadIcon />}
            title="Download Photos"
            subtitle={`${propertyData.images?.length || 6} enhanced images`}
            onPress={handleDownloadPhotos}
          />

          <ToolButton
            icon={<ShareIcon />}
            title="Share Listing"
            subtitle="Send to clients"
            onPress={handleShareListing}
          />

          <ToolButton
            icon={<CopyIcon />}
            title="Copy Info"
            subtitle="Property details"
            onPress={handleCopyInfo}
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <ToolButton
            icon={<TrashIcon />}
            title="Delete Project"
            subtitle="This cannot be undone"
            onPress={handleDeleteProject}
            danger={true}
          />
        </View>
      </ScrollView>

      {/* MLS Generator Modal */}
      <Modal
        visible={showMLSModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMLSModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Generate MLS Description</Text>

            {/* Tone Selector */}
            <Text style={styles.toneLabel}>Select Tone:</Text>
            <View style={styles.toneSelector}>
              {(['professional', 'friendly', 'luxury'] as ToneType[]).map((tone) => (
                <TouchableOpacity
                  key={tone}
                  style={[
                    styles.toneButton,
                    selectedTone === tone && styles.toneButtonActive
                  ]}
                  onPress={() => setSelectedTone(tone)}
                >
                  <Text style={[
                    styles.toneButtonText,
                    selectedTone === tone && styles.toneButtonTextActive
                  ]}>
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Generated Description or Generate Button */}
            {!generatedDescription && !isGenerating && (
              <TouchableOpacity
                style={styles.generateButton}
                onPress={generateMLSDescription}
              >
                <Text style={styles.generateButtonText}>Generate Description</Text>
              </TouchableOpacity>
            )}

            {/* Loading State */}
            {isGenerating && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFBF35" />
                <Text style={styles.loadingText}>Generating description...</Text>
              </View>
            )}

            {/* Generated Description */}
            {generatedDescription && !isGenerating && (
              <>
                <ScrollView style={styles.descriptionContainer}>
                  <Text style={styles.generatedDescription}>
                    {generatedDescription}
                  </Text>
                </ScrollView>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, copied && styles.copiedButton]}
                    onPress={handleCopyDescription}
                  >
                    {copied ? (
                      <>
                        <CheckIcon />
                        <Text style={styles.copiedButtonText}>Copied!</Text>
                      </>
                    ) : (
                      <Text style={styles.actionButtonText}>Copy</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={generateMLSDescription}
                  >
                    <Text style={styles.actionButtonText}>Regenerate</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowMLSModal(false)
                setGeneratedDescription('')
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFBF35',
  },
  primaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFBF35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  primaryContent: {
    flex: 1,
  },
  primaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  primarySubtitle: {
    fontSize: 14,
    color: '#92400E',
  },
  toolsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  toolButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  toolButtonDanger: {
    backgroundColor: '#FEE2E2',
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toolIconDanger: {
    backgroundColor: '#FECACA',
  },
  toolContent: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  toolTitleDanger: {
    color: '#DC2626',
  },
  toolSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  toolSubtitleDanger: {
    color: '#EF4444',
  },
  dangerZone: {
    marginTop: 12,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  toneLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  toneSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  toneButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  toneButtonActive: {
    backgroundColor: '#FFBF35',
  },
  toneButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  toneButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#FFBF35',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  descriptionContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    maxHeight: 200,
    marginBottom: 16,
  },
  generatedDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  copiedButton: {
    backgroundColor: '#D1FAE5',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  copiedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
})
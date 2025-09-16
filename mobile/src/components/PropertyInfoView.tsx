import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native'
import Svg, { Path, G, Circle, Rect } from 'react-native-svg'

// Icons
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

const HomeIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
      stroke="#FFBF35"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 22V12h6v10"
      stroke="#FFBF35"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const CalendarIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect
      x="3"
      y="4"
      width="18"
      height="18"
      rx="2"
      ry="2"
      stroke="#FFBF35"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 2v4M8 2v4M3 10h18"
      stroke="#FFBF35"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const MapIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
      stroke="#FFBF35"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx="12"
      cy="10"
      r="3"
      stroke="#FFBF35"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

interface PropertyInfoViewProps {
  propertyData: any
}

export default function PropertyInfoView({ propertyData }: PropertyInfoViewProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [localPropertyData, setLocalPropertyData] = useState(propertyData)
  const [editedData, setEditedData] = useState(propertyData)

  const formatPrice = (price: string) => {
    // Ensure price has dollar sign
    return price.startsWith('$') ? price : `$${price}`
  }

  const handleSaveEdit = () => {
    // Update local state with edited data
    setLocalPropertyData(editedData)
    // TODO: Save to context/database - for now just update local state
    console.log('Saving edited data:', editedData)
    setShowEditModal(false)
  }

  return (
    <View style={styles.container}>
      {/* Edit Button */}
      <TouchableOpacity 
        style={styles.editButton}
        onPress={() => {
          setEditedData(localPropertyData)
          setShowEditModal(true)
        }}
      >
        <EditIcon />
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Price Section */}
        <View style={styles.priceSection}>
          <Text style={styles.price}>{formatPrice(localPropertyData.price)}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.stat}>{localPropertyData.beds} bd</Text>
            <Text style={styles.statDivider}>•</Text>
            <Text style={styles.stat}>{localPropertyData.baths} ba</Text>
            {localPropertyData.squareFeet && (
              <>
                <Text style={styles.statDivider}>•</Text>
                <Text style={styles.stat}>{localPropertyData.squareFeet.toLocaleString()} sf</Text>
              </>
            )}
          </View>
        </View>

        {/* Property Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Property Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <HomeIcon />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>
                {localPropertyData.propertyType || 'Single Family'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <CalendarIcon />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Year Built</Text>
              <Text style={styles.detailValue}>
                {localPropertyData.yearBuilt || '2020'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MapIcon />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Lot Size</Text>
              <Text style={styles.detailValue}>
                {localPropertyData.lotSize || '0.25 acres'}
              </Text>
            </View>
          </View>

          {localPropertyData.mlsNumber && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Text style={styles.mlsIcon}>#</Text>
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>MLS Number</Text>
                <Text style={styles.detailValue}>{localPropertyData.mlsNumber}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Description Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Description</Text>
          <Text style={styles.description}>
            {localPropertyData.description || 
              'Beautiful modern home with stunning views and premium finishes throughout. This property features an open floor plan, gourmet kitchen with high-end appliances, spacious master suite, and beautifully landscaped outdoor spaces perfect for entertaining.'}
          </Text>
        </View>

        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            localPropertyData.listingStatus === 'Active' && styles.statusActive,
            localPropertyData.listingStatus === 'Pending' && styles.statusPending,
            localPropertyData.listingStatus === 'Sold' && styles.statusSold,
          ]}>
            <Text style={[
              styles.statusText,
              localPropertyData.listingStatus === 'Active' && styles.statusTextActive,
            ]}>
              {localPropertyData.listingStatus || 'Active'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Property Info</Text>
            
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Price</Text>
              <TextInput
                style={styles.input}
                value={editedData.price}
                onChangeText={(text) => setEditedData({...editedData, price: text})}
                placeholder="$750,000"
              />

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Beds</Text>
                  <TextInput
                    style={styles.input}
                    value={String(editedData.beds)}
                    onChangeText={(text) => setEditedData({...editedData, beds: parseInt(text) || 0})}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Baths</Text>
                  <TextInput
                    style={styles.input}
                    value={String(editedData.baths)}
                    onChangeText={(text) => setEditedData({...editedData, baths: parseInt(text) || 0})}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Square Feet</Text>
              <TextInput
                style={styles.input}
                value={String(editedData.squareFeet || '')}
                onChangeText={(text) => setEditedData({...editedData, squareFeet: parseInt(text) || 0})}
                keyboardType="numeric"
                placeholder="2,450"
              />

              <Text style={styles.inputLabel}>Property Type</Text>
              <TextInput
                style={styles.input}
                value={editedData.propertyType || ''}
                onChangeText={(text) => setEditedData({...editedData, propertyType: text})}
                placeholder="Single Family"
              />

              <Text style={styles.inputLabel}>Year Built</Text>
              <TextInput
                style={styles.input}
                value={String(editedData.yearBuilt || '')}
                onChangeText={(text) => setEditedData({...editedData, yearBuilt: parseInt(text) || 0})}
                keyboardType="numeric"
                placeholder="2020"
              />

              <Text style={styles.inputLabel}>Lot Size</Text>
              <TextInput
                style={styles.input}
                value={editedData.lotSize || ''}
                onChangeText={(text) => setEditedData({...editedData, lotSize: text})}
                placeholder="0.25 acres"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editedData.description || ''}
                onChangeText={(text) => setEditedData({...editedData, description: text})}
                placeholder="Property description..."
                multiline
                numberOfLines={4}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalButtonCancel}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalButtonSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
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
  editButton: {
    position: 'absolute',
    top: 12,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  editButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  priceSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  statDivider: {
    fontSize: 16,
    color: '#D1D5DB',
    marginHorizontal: 8,
  },
  card: {
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mlsIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFBF35',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusSold: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusTextActive: {
    color: '#065F46',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalButtonSave: {
    backgroundColor: '#FFBF35',
  },
  modalButtonSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
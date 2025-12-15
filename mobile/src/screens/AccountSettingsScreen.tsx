import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'

// Brand colors
const GOLD = '#D4AF37'
const GOLD_LIGHT = 'rgba(212, 175, 55, 0.1)'

// Icons
const BackIcon = ({ color = '#000' }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M12 19l-7-7 7-7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const ChevronRightIcon = ({ color = '#C7C7CC' }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18l6-6-6-6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const UserIcon = ({ color = GOLD }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.5" />
  </Svg>
)

const MailIcon = ({ color = GOLD }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M22 6l-10 7L2 6"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const PhoneIcon = ({ color = GOLD }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const CameraIcon = ({ color = GOLD }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.5" />
  </Svg>
)

const TrashIcon = ({ color = '#FF3B30' }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

interface SettingRowProps {
  icon: React.ReactNode
  title: string
  subtitle?: string
  value?: string
  onPress?: () => void
  showArrow?: boolean
  isLast?: boolean
  destructive?: boolean
}

const SettingRow = ({
  icon,
  title,
  subtitle,
  value,
  onPress,
  showArrow = true,
  isLast = false,
  destructive = false,
}: SettingRowProps) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start()
    }
  }

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start()
    }
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.settingRow, !isLast && styles.settingRowBorder]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
      >
        <View style={styles.settingLeft}>
          <View style={[styles.iconContainer, destructive && styles.iconContainerDestructive]}>
            {icon}
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, destructive && styles.settingTitleDestructive]}>
              {title}
            </Text>
            {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
          </View>
        </View>
        <View style={styles.settingRight}>
          {value && <Text style={styles.settingValue}>{value}</Text>}
          {showArrow && <ChevronRightIcon />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

interface SectionProps {
  title?: string
  children: React.ReactNode
}

const Section = ({ title, children }: SectionProps) => (
  <View style={styles.section}>
    {title && <Text style={styles.sectionTitle}>{title}</Text>}
    <View style={styles.sectionCard}>{children}</View>
  </View>
)

export default function AccountSettingsScreen() {
  const navigation = useNavigation()
  const { user, signOut } = useAuth()

  // Get display name from email
  const displayName = user?.email?.split('@')[0] || 'User'
  const email = user?.email || 'Not signed in'

  const handleEditName = () => {
    Alert.prompt(
      'Edit Name',
      'Enter your display name',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (name: string | undefined) => {
            if (name && name.trim()) {
              Alert.alert('Name Updated', `Your name has been changed to ${name.trim()}`)
            }
          },
        },
      ],
      'plain-text',
      displayName
    )
  }

  const handleEditEmail = () => {
    Alert.alert(
      'Change Email',
      'To change your email address, we\'ll send a verification link to your new email.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            Alert.prompt(
              'New Email',
              'Enter your new email address',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Send Verification',
                  onPress: (newEmail: string | undefined) => {
                    if (newEmail && newEmail.includes('@')) {
                      Alert.alert('Verification Sent', `Check ${newEmail} for a verification link.`)
                    }
                  },
                },
              ],
              'plain-text',
              '' // keyboardType would need native module for email-address
            )
          },
        },
      ]
    )
  }

  const handleEditPhone = () => {
    Alert.prompt(
      'Phone Number',
      'Enter your phone number for account recovery',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (phone: string | undefined) => {
            if (phone) {
              Alert.alert('Phone Updated', 'Your phone number has been saved.')
            }
          },
        },
      ],
      'plain-text',
      '' // keyboardType would need native module for phone-pad
    )
  }

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose a new profile photo',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => Alert.alert('Camera', 'Camera coming soon') },
        { text: 'Choose from Library', onPress: () => Alert.alert('Library', 'Photo library coming soon') },
      ]
    )
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, all photos, and subscription. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Type "DELETE" to confirm account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm Delete',
                  style: 'destructive',
                  onPress: () => {
                    signOut()
                    Alert.alert('Account Deleted', 'Your account has been permanently deleted.')
                  },
                },
              ]
            )
          },
        },
      ]
    )
  }

  // Get initials for avatar
  const getInitials = () => {
    return displayName[0].toUpperCase()
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FAFAFA', '#F5F5F7', '#FFFFFF']}
        style={styles.backgroundGradient}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Profile Photo */}
          <TouchableOpacity
            style={styles.profilePhotoSection}
            onPress={handleChangePhoto}
            activeOpacity={0.8}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>{getInitials()}</Text>
            </View>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>

          {/* Profile Information */}
          <Section title="PROFILE">
            <SettingRow
              icon={<UserIcon />}
              title="Name"
              value={displayName}
              onPress={handleEditName}
            />
            <SettingRow
              icon={<MailIcon />}
              title="Email"
              value={email}
              onPress={handleEditEmail}
            />
            <SettingRow
              icon={<PhoneIcon />}
              title="Phone"
              value="Not set"
              onPress={handleEditPhone}
              isLast
            />
          </Section>

          {/* Danger Zone */}
          <Section title="DANGER ZONE">
            <SettingRow
              icon={<TrashIcon />}
              title="Delete Account"
              subtitle="Permanently delete your account and all data"
              onPress={handleDeleteAccount}
              destructive
              showArrow={false}
              isLast
            />
          </Section>

          {/* Info Text */}
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              Your account information is securely stored and encrypted. We never share your personal data with third parties.
            </Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Profile Photo
  profilePhotoSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: GOLD_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileInitials: {
    fontSize: 40,
    fontWeight: '600',
    color: GOLD,
  },
  changePhotoText: {
    fontSize: 15,
    fontWeight: '500',
    color: GOLD,
  },

  // Sections
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: GOLD_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerDestructive: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },
  settingTitleDestructive: {
    color: '#FF3B30',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 15,
    color: '#8E8E93',
    maxWidth: 180,
  },

  // Info Section
  infoSection: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
    textAlign: 'center',
  },

  bottomSpacer: {
    height: 40,
  },
})

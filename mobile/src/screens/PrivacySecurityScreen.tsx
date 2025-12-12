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
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'

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

const LockIcon = ({ color = GOLD }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="1.5" />
    <Path
      d="M7 11V7a5 5 0 0110 0v4"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
)

const FingerprintIcon = ({ color = GOLD }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 10v4M7.5 7a5.5 5.5 0 019 0M4 9.5a9 9 0 0116 0M12 18a6 6 0 006-6"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
)

const EyeOffIcon = ({ color = GOLD }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const TrashIcon = ({ color = GOLD }) => (
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

const FileTextIcon = ({ color = GOLD }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const DownloadIcon = ({ color = GOLD }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const ExternalLinkIcon = ({ color = '#C7C7CC' }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
      stroke={color}
      strokeWidth="2"
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
  showExternal?: boolean
  toggle?: boolean
  toggleValue?: boolean
  onToggleChange?: (value: boolean) => void
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
  showExternal = false,
  toggle = false,
  toggleValue = false,
  onToggleChange,
  isLast = false,
  destructive = false,
}: SettingRowProps) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    if (!toggle && onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start()
    }
  }

  const handlePressOut = () => {
    if (!toggle && onPress) {
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
        activeOpacity={toggle ? 1 : 0.7}
        disabled={toggle && !onPress}
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
          {toggle ? (
            <Switch
              value={toggleValue}
              onValueChange={onToggleChange}
              trackColor={{ false: '#E5E5EA', true: GOLD }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E5E5EA"
            />
          ) : showExternal ? (
            <ExternalLinkIcon />
          ) : (
            showArrow && <ChevronRightIcon />
          )}
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

export default function PrivacySecurityScreen() {
  const navigation = useNavigation()
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [hidePhotosInRecents, setHidePhotosInRecents] = useState(true)

  const handleExportData = () => {
    Alert.alert(
      'Export Your Data',
      'We\'ll prepare a download of all your data including photos, enhancement history, and account information. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => Alert.alert('Export Started', 'You\'ll receive an email when your data is ready to download.'),
        },
      ]
    )
  }

  const handleDeleteData = () => {
    Alert.alert(
      'Delete All Photos',
      'This will permanently delete all your photos and enhancement history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => Alert.alert('Photos Deleted', 'All your photos have been permanently deleted.'),
        },
      ]
    )
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
          <Text style={styles.headerTitle}>Privacy & Security</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Security */}
          <Section title="SECURITY">
            <SettingRow
              icon={<FingerprintIcon />}
              title="Face ID / Touch ID"
              subtitle="Require biometrics to open the app"
              toggle
              toggleValue={biometricEnabled}
              onToggleChange={setBiometricEnabled}
            />
            <SettingRow
              icon={<LockIcon />}
              title="Change Password"
              subtitle="Update your account password"
              onPress={() => Alert.alert('Change Password', 'Password change coming soon')}
              isLast
            />
          </Section>

          {/* Privacy */}
          <Section title="PRIVACY">
            <SettingRow
              icon={<EyeOffIcon />}
              title="Hide Photos in Recents"
              subtitle="Don't show enhanced photos in photo library recents"
              toggle
              toggleValue={hidePhotosInRecents}
              onToggleChange={setHidePhotosInRecents}
              isLast
            />
          </Section>

          {/* Legal */}
          <Section title="LEGAL">
            <SettingRow
              icon={<FileTextIcon />}
              title="Privacy Policy"
              showExternal
              onPress={() => Linking.openURL('https://luster.ai/privacy')}
            />
            <SettingRow
              icon={<FileTextIcon />}
              title="Terms of Service"
              showExternal
              onPress={() => Linking.openURL('https://luster.ai/terms')}
              isLast
            />
          </Section>

          {/* Data */}
          <Section title="YOUR DATA">
            <SettingRow
              icon={<DownloadIcon />}
              title="Export My Data"
              subtitle="Download a copy of all your data"
              onPress={handleExportData}
            />
            <SettingRow
              icon={<TrashIcon color="#FF3B30" />}
              title="Delete All Photos"
              subtitle="Permanently remove all photos and history"
              onPress={handleDeleteData}
              destructive
              isLast
            />
          </Section>

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

  // Sections
  section: {
    marginTop: 28,
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
  },

  bottomSpacer: {
    height: 40,
  },
})

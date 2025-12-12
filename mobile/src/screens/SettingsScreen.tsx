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
  Image,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { usePhotos } from '../context/PhotoContext'

const { width: screenWidth } = Dimensions.get('window')

// Brand colors
const GOLD = '#D4AF37'
const GOLD_LIGHT = 'rgba(212, 175, 55, 0.1)'
const GOLD_MEDIUM = 'rgba(212, 175, 55, 0.15)'

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

const CreditCardIcon = ({ color = GOLD }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.5" />
    <Path d="M2 10h20" stroke={color} strokeWidth="1.5" />
  </Svg>
)

const BellIcon = ({ color = GOLD }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 01-3.46 0"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const ImageIcon = ({ color = GOLD }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.5" />
    <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
    <Path d="M21 15l-5-5L5 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

const ShieldIcon = ({ color = GOLD }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const HelpIcon = ({ color = GOLD }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
    <Path
      d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const InfoIcon = ({ color = GOLD }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
    <Path
      d="M12 16v-4M12 8h.01"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const LogOutIcon = ({ color = '#8E8E93' }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const SparkleIcon = ({ color = GOLD }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3v2M12 19v2M5.64 5.64l1.41 1.41M16.95 16.95l1.41 1.41M3 12h2M19 12h2M5.64 18.36l1.41-1.41M16.95 7.05l1.41-1.41"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.5" />
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
  value?: string | React.ReactNode
  onPress?: () => void
  showArrow?: boolean
  showExternal?: boolean
  toggle?: boolean
  toggleValue?: boolean
  onToggleChange?: (value: boolean) => void
  isLast?: boolean
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
          <View style={styles.iconContainer}>{icon}</View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>{title}</Text>
            {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
          </View>
        </View>
        <View style={styles.settingRight}>
          {value && typeof value === 'string' ? (
            <Text style={styles.settingValue}>{value}</Text>
          ) : value ? (
            value
          ) : null}
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

export default function SettingsScreen() {
  const navigation = useNavigation()
  const { user, signOut } = useAuth()
  const { creditBalance } = usePhotos()
  const [notifications, setNotifications] = useState(true)

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'default',
          onPress: () => signOut(),
        },
      ],
      { cancelable: true }
    )
  }

  // Get user initials
  const getInitials = () => {
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  return (
    <View style={styles.container}>
      {/* Background */}
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
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Profile Section */}
          <TouchableOpacity
            style={styles.profileCard}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Edit Profile', 'Profile editing coming soon!')}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>{getInitials()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.email?.split('@')[0] || 'User'}
              </Text>
              <Text style={styles.profileEmail}>{user?.email || 'Not signed in'}</Text>
            </View>
            <ChevronRightIcon color="#C7C7CC" />
          </TouchableOpacity>

          {/* Credits Card */}
          <TouchableOpacity
            style={styles.creditsCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Credits' as never)}
          >
            <LinearGradient
              colors={['#1C1C1E', '#2C2C2E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.creditsGradient}
            >
              <View style={styles.creditsContent}>
                <View style={styles.creditsLeft}>
                  <Text style={styles.creditsLabel}>Available Credits</Text>
                  <View style={styles.creditsValueRow}>
                    <Text style={styles.creditsValue}>{creditBalance ?? 0}</Text>
                    <View style={styles.creditsBadge}>
                      <SparkleIcon color="#FFF" />
                    </View>
                  </View>
                  <Text style={styles.creditsSubtext}>
                    {creditBalance === 0 ? 'Get credits to enhance photos' : 'Ready to enhance'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.buyButton}
                  onPress={() => navigation.navigate('Credits' as never)}
                >
                  <Text style={styles.buyButtonText}>Buy More</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Preferences */}
          <Section title="PREFERENCES">
            <SettingRow
              icon={<BellIcon />}
              title="Push Notifications"
              subtitle="Get notified when photos are ready"
              toggle
              toggleValue={notifications}
              onToggleChange={setNotifications}
              isLast
            />
          </Section>

          {/* Account */}
          <Section title="ACCOUNT">
            <SettingRow
              icon={<CreditCardIcon />}
              title="Subscription"
              value="Free"
              onPress={() => navigation.navigate('Credits' as never)}
            />
            <SettingRow
              icon={<ShieldIcon />}
              title="Privacy & Security"
              onPress={() => navigation.navigate('PrivacySecurity' as never)}
            />
            <SettingRow
              icon={<UserIcon />}
              title="Account Settings"
              onPress={() => navigation.navigate('AccountSettings' as never)}
              isLast
            />
          </Section>

          {/* Support */}
          <Section title="SUPPORT">
            <SettingRow
              icon={<HelpIcon />}
              title="Help Center"
              showExternal
              onPress={() => Alert.alert('Help Center', 'Opening help center...')}
            />
            <SettingRow
              icon={<InfoIcon />}
              title="About Luster"
              value="v1.0.0"
              onPress={() =>
                Alert.alert(
                  'Luster AI',
                  'Version 1.0.0\n\nProfessional photo enhancement for real estate.\n\nMade with ❤️ for real estate professionals.'
                )
              }
              isLast
            />
          </Section>

          {/* Sign Out */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <View style={styles.signOutContent}>
              <LogOutIcon />
              <Text style={styles.signOutText}>Sign Out</Text>
            </View>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Luster AI © 2024
            </Text>
          </View>
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

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GOLD_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 22,
    fontWeight: '600',
    color: GOLD,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Credits Card
  creditsCard: {
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  creditsGradient: {
    padding: 20,
  },
  creditsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creditsLeft: {
    flex: 1,
  },
  creditsLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  creditsValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  creditsValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  creditsBadge: {
    marginLeft: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditsSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  buyButton: {
    backgroundColor: GOLD,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
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
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
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

  // Sign Out
  signOutButton: {
    marginTop: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  signOutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },

  // Footer
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#C7C7CC',
  },
})

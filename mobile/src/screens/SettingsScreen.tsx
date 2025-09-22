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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Path, Circle } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'

// Icon components
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

// Settings icons
const NotificationIcon = ({ color = '#000' }) => (
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

const SecurityIcon = ({ color = '#000' }) => (
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

const HelpIcon = ({ color = '#000' }) => (
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

const AboutIcon = ({ color = '#000' }) => (
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

const StarIcon = ({ size = 24, color = '#D4AF37' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2l2.582 7.953h8.364l-6.764 4.914 2.582 7.953L12 17.906 5.236 22.82l2.582-7.953L1.054 9.953h8.364L12 2z" />
  </Svg>
)

interface SettingRowProps {
  icon: React.ReactNode
  title: string
  value?: string
  onPress?: () => void
  showArrow?: boolean
  toggle?: boolean
  toggleValue?: boolean
  onToggleChange?: (value: boolean) => void
}

const SettingRow = ({
  icon,
  title,
  value,
  onPress,
  showArrow = true,
  toggle = false,
  toggleValue = false,
  onToggleChange,
}: SettingRowProps) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    if (!toggle) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start()
    }
  }

  const handlePressOut = () => {
    if (!toggle) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start()
    }
  }

  return (
    <Animated.View style={[styles.settingRow, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.settingTouchable}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={toggle ? 1 : 0.7}
        disabled={toggle}
      >
        <View style={styles.settingLeft}>
          <View style={styles.iconContainer}>{icon}</View>
          <Text style={styles.settingTitle}>{title}</Text>
        </View>
        <View style={styles.settingRight}>
          {value && <Text style={styles.settingValue}>{value}</Text>}
          {toggle ? (
            <Switch
              value={toggleValue}
              onValueChange={onToggleChange}
              trackColor={{ false: '#E5E5EA', true: '#D4AF37' }}
              thumbColor="#FFFFFF"
            />
          ) : (
            showArrow && <ChevronRightIcon />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function SettingsScreen() {
  const navigation = useNavigation()
  const { user, signOut } = useAuth()
  const [notifications, setNotifications] = useState(true)
  const [autoEnhance, setAutoEnhance] = useState(false)
  const [highQuality, setHighQuality] = useState(true)

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ],
      { cancelable: false }
    )
  }

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#FFFFFF', '#F8F8FA', '#F0F0F5']}
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

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <BlurView intensity={30} tint="light" style={styles.profileCard}>
              <View style={styles.profileAvatar}>
                <StarIcon size={32} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>John Appleseed</Text>
                <Text style={styles.profileEmail}>{user?.email || 'john@luster.ai'}</Text>
              </View>
            </BlurView>
          </View>

          {/* Settings Groups */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PREFERENCES</Text>
            <BlurView intensity={20} tint="light" style={styles.sectionCard}>
              <SettingRow
                icon={<NotificationIcon />}
                title="Notifications"
                toggle
                toggleValue={notifications}
                onToggleChange={setNotifications}
              />
              <View style={styles.separator} />
              <SettingRow
                icon={<StarIcon size={20} />}
                title="Auto-Enhance"
                toggle
                toggleValue={autoEnhance}
                onToggleChange={setAutoEnhance}
              />
              <View style={styles.separator} />
              <SettingRow
                icon={<StarIcon size={20} />}
                title="High Quality Output"
                toggle
                toggleValue={highQuality}
                onToggleChange={setHighQuality}
              />
            </BlurView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACCOUNT</Text>
            <BlurView intensity={20} tint="light" style={styles.sectionCard}>
              <SettingRow
                icon={<SecurityIcon />}
                title="Privacy & Security"
                onPress={() => Alert.alert('Privacy & Security', 'Coming soon')}
              />
              <View style={styles.separator} />
              <SettingRow
                icon={<StarIcon size={20} />}
                title="Subscription"
                value="Pro"
                onPress={() => navigation.navigate('Credits' as never)}
              />
              <View style={styles.separator} />
              <SettingRow
                icon={<StarIcon size={20} />}
                title="Usage History"
                onPress={() => Alert.alert('Usage History', 'Coming soon')}
              />
            </BlurView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SUPPORT</Text>
            <BlurView intensity={20} tint="light" style={styles.sectionCard}>
              <SettingRow
                icon={<HelpIcon />}
                title="Help Center"
                onPress={() => Alert.alert('Help Center', 'Coming soon')}
              />
              <View style={styles.separator} />
              <SettingRow
                icon={<AboutIcon />}
                title="About Luster"
                value="v1.0.0"
                onPress={() => Alert.alert('Luster AI', 'Version 1.0.0\nEnhance your property listings')}
              />
            </BlurView>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <BlurView intensity={30} tint="light" style={styles.signOutBlur}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </BlurView>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Bottom Fade Gradient */}
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.95)', 'rgba(255,255,255,1)']}
          locations={[0, 0.3, 0.7, 1]}
          style={styles.bottomFadeGradient}
          pointerEvents="none"
        />
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
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 4,
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
  profileSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    letterSpacing: 0.3,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  settingRow: {
    backgroundColor: 'transparent',
  },
  settingTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 15,
    color: '#666',
    marginRight: 8,
  },
  separator: {
    height: 0.5,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginLeft: 56,
  },
  signOutButton: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  signOutBlur: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#FF3B30',
  },
  bottomSpacer: {
    height: 40,
  },
  bottomFadeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
})
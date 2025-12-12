'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DesktopLayout } from '@/app/components/features/desktop-layout'
import { ToastProvider, useErrorToast, useSuccessToast } from '@/app/components/ui/toast'
import { SettingsNav, SettingsSection } from '@/app/components/settings/settings-nav'
import { SettingsTabs } from '@/app/components/settings/settings-tabs'
import { AccountSection } from '@/app/components/settings/sections/account-section'
import { SubscriptionSection } from '@/app/components/settings/sections/subscription-section'
import { PreferencesSection } from '@/app/components/settings/sections/preferences-section'
import { SupportSection } from '@/app/components/settings/sections/support-section'
import { ProfileEditModal } from '@/app/components/settings/profile-edit-modal'
import type { UserProfile, UserPlan, ReferralCode, User as UserType } from '@/app/types'

const APP_VERSION = '1.0.0'

interface PreferencesState {
  emailNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
  autoDownload: boolean
  highQualityDefault: boolean
}

function SettingsContent() {
  const [user, setUser] = useState<UserType | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [plan, setPlan] = useState<UserPlan | null>(null)
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null)
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<SettingsSection>('account')
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [preferences, setPreferences] = useState<PreferencesState>({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    autoDownload: false,
    highQualityDefault: true,
  })

  const router = useRouter()
  const supabase = createClientComponentClient()
  const errorToast = useErrorToast()
  const successToast = useSuccessToast()

  // Mock data for development
  const mockProfile: UserProfile = {
    id: '1',
    user_id: 'user1',
    full_name: 'John Doe',
    phone: '+1 (555) 123-4567',
    avatar_url: undefined,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-16T14:20:00Z',
  }

  const mockPlan: UserPlan = {
    id: '1',
    user_id: 'user1',
    plan_type: 'free',
    credits_included: 10,
    price_monthly: undefined,
    features: [
      'Standard quality processing (1024x1024)',
      'Basic enhancement styles',
      'Email support',
      '5 photos per month',
    ],
    active: true,
    expires_at: undefined,
    created_at: '2024-01-15T10:30:00Z',
  }

  const mockReferral: ReferralCode = {
    id: '1',
    user_id: 'user1',
    code: 'JOHN2024',
    credits_reward: 5,
    uses_count: 3,
    max_uses: 10,
    active: true,
    created_at: '2024-01-15T10:30:00Z',
    expires_at: undefined,
  }

  useEffect(() => {
    checkAuth()
    loadUserData()
  }, [])

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/onboarding')
        return
      }

      setUser({
        id: session.user.id,
        email: session.user.email || '',
        created_at: session.user.created_at,
        updated_at: session.user.updated_at || session.user.created_at,
      })
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/onboarding')
    }
  }

  const loadUserData = async () => {
    setLoading(true)
    try {
      // For now, use mock data
      await new Promise((resolve) => setTimeout(resolve, 800))
      setProfile(mockProfile)
      setPlan(mockPlan)
      setReferralCode(mockReferral)
      setCredits(25)
    } catch (error) {
      console.error('Error loading user data:', error)
      errorToast('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/onboarding')
    } catch (error) {
      console.error('Logout error:', error)
      errorToast('Failed to sign out')
    }
  }

  const handleSaveProfile = async (data: { full_name: string; phone: string }) => {
    try {
      // In a real app, this would update the backend
      setProfile((prev) =>
        prev ? { ...prev, full_name: data.full_name, phone: data.phone } : null
      )
      successToast('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      errorToast('Failed to update profile')
      throw error
    }
  }

  const handleCopyReferralCode = async () => {
    if (!referralCode) return

    try {
      await navigator.clipboard.writeText(referralCode.code)
      successToast('Referral code copied!')
    } catch (error) {
      console.error('Error copying referral code:', error)
      errorToast('Failed to copy code')
    }
  }

  const handleUpgradePlan = () => {
    successToast(
      'Upgrade to Pro or Enterprise for premium quality processing (1536x1024, HD) and additional features!'
    )
  }

  const handleBuyCredits = () => {
    // Would navigate to credit purchase flow
    successToast('Credit purchase flow coming soon!')
  }

  const handlePreferenceChange = (key: keyof PreferencesState, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
    successToast('Preference updated')
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return (
          <AccountSection
            user={user}
            profile={profile}
            onEditProfile={() => setIsProfileModalOpen(true)}
            onSignOut={handleLogout}
          />
        )
      case 'subscription':
        return (
          <SubscriptionSection
            plan={plan}
            credits={credits}
            referralCode={referralCode}
            onUpgrade={handleUpgradePlan}
            onBuyCredits={handleBuyCredits}
            onCopyReferralCode={handleCopyReferralCode}
          />
        )
      case 'preferences':
        return (
          <PreferencesSection
            preferences={preferences}
            onPreferenceChange={handlePreferenceChange}
          />
        )
      case 'support':
        return <SupportSection appVersion={APP_VERSION} onSignOut={handleLogout} />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <DesktopLayout title="Settings">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-neutral-600">Loading settings...</p>
          </div>
        </div>
      </DesktopLayout>
    )
  }

  return (
    <DesktopLayout title="Settings">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Mobile Tabs - Sticky at top on mobile */}
        <div className="lg:hidden sticky top-0 z-10">
          <SettingsTabs activeSection={activeSection} onSectionChange={setActiveSection} />
        </div>

        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-72 flex-shrink-0 border-r border-neutral-200 bg-neutral-50 p-6">
          <SettingsNav activeSection={activeSection} onSectionChange={setActiveSection} />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-6 lg:py-8">{renderSection()}</div>
        </main>
      </div>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />
    </DesktopLayout>
  )
}

export default function SettingsPage() {
  return (
    <ToastProvider>
      <SettingsContent />
    </ToastProvider>
  )
}

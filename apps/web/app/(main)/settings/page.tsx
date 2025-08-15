'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DesktopLayout } from '@/app/components/features/desktop-layout'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { ToastProvider, useErrorToast, useSuccessToast } from '@/app/components/ui/toast'
import {
  User,
  Mail,
  Phone,
  Lock,
  Crown,
  Gift,
  CreditCard,
  LogOut,
  ChevronRight,
  Copy,
  Star,
  Zap,
  Shield,
  Settings as SettingsIcon,
  Bell,
  HelpCircle,
  ExternalLink
} from 'lucide-react'
import type { UserProfile, UserPlan, ReferralCode, User as UserType } from '@/app/types'

interface SettingsContentProps {}

function SettingsContent({}: SettingsContentProps) {
  const [user, setUser] = useState<UserType | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [plan, setPlan] = useState<UserPlan | null>(null)
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null)
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState('')
  
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
    updated_at: '2024-01-16T14:20:00Z'
  }

  const mockPlan: UserPlan = {
    id: '1',
    user_id: 'user1',
    plan_type: 'free',
    credits_included: 10,
    price_monthly: undefined,
    features: ['Standard quality processing (1024x1024)', 'Basic enhancement styles', 'Email support', '5 photos per month'],
    active: true,
    expires_at: undefined,
    created_at: '2024-01-15T10:30:00Z'
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
    expires_at: undefined
  }

  useEffect(() => {
    checkAuth()
    loadUserData()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/onboarding')
        return
      }

      setUser({
        id: session.user.id,
        email: session.user.email || '',
        created_at: session.user.created_at,
        updated_at: session.user.updated_at || session.user.created_at
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
      await new Promise(resolve => setTimeout(resolve, 1000))
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

  const handleEditField = (field: string, currentValue: string) => {
    setEditingField(field)
    setTempValue(currentValue)
  }

  const handleSaveField = async (field: string) => {
    if (!tempValue.trim()) {
      errorToast('Field cannot be empty')
      return
    }

    try {
      // In a real app, this would update the backend
      if (profile && field === 'full_name') {
        setProfile({ ...profile, full_name: tempValue.trim() })
      }
      if (profile && field === 'phone') {
        setProfile({ ...profile, phone: tempValue.trim() })
      }
      
      setEditingField(null)
      successToast('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      errorToast('Failed to update profile')
    }
  }

  const handleCancelEdit = () => {
    setEditingField(null)
    setTempValue('')
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
    // Would navigate to plan selection/payment flow
    successToast('Upgrade to Pro or Enterprise for premium quality processing (1536x1024, HD) and additional features!')
  }

  const getPlanBadgeVariant = (planType: string) => {
    switch (planType) {
      case 'pro': return 'primary'
      case 'enterprise': return 'success'
      default: return 'neutral'
    }
  }

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'pro': return <Zap className="h-4 w-4" />
      case 'enterprise': return <Crown className="h-4 w-4" />
      default: return <Star className="h-4 w-4" />
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
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Full Name
                </label>
                {editingField === 'full_name' ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      onClick={() => handleSaveField('full_name')}
                      variant="primary"
                                         >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="ghost"
                                         >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-900">
                      {profile?.full_name || 'Not set'}
                    </span>
                    <Button
                      onClick={() => handleEditField('full_name', profile?.full_name || '')}
                      variant="ghost"
                                         >
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Email Address
                </label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-neutral-400" />
                  <span className="text-neutral-900">{user?.email}</span>
                  <Badge variant="success">Verified</Badge>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Phone Number
                </label>
                {editingField === 'phone' ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="flex-1"
                      type="tel"
                      autoFocus
                    />
                    <Button
                      onClick={() => handleSaveField('phone')}
                      variant="primary"
                                         >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="ghost"
                                         >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-neutral-400" />
                      <span className="text-neutral-900">
                        {profile?.phone || 'Not set'}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleEditField('phone', profile?.phone || '')}
                      variant="ghost"
                                         >
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Plan & Credits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Plan & Credits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Plan */}
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    {plan && getPlanIcon(plan.plan_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900 capitalize">
                        {plan?.plan_type || 'Free'} Plan
                      </span>
                      {plan && (
                        <Badge variant={getPlanBadgeVariant(plan.plan_type) as any}>
                          {plan.plan_type === 'free' ? 'Current' : 'Active'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600">
                      {plan?.credits_included} credits included monthly • {plan?.plan_type === 'free' ? 'Standard quality (1024x1024)' : 'Premium quality (1536x1024, HD)'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleUpgradePlan}
                  variant="primary"
                                   rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Upgrade
                </Button>
              </div>

              {/* Credits Balance */}
              <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <span className="font-medium text-primary-900">
                      {credits} Credits
                    </span>
                    <p className="text-sm text-primary-700">
                      Available for enhancement
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                                 >
                  Buy More
                </Button>
              </div>

              {/* Plan Features */}
              {plan && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-neutral-900">Plan Features</h4>
                  <div className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-neutral-600">
                        <Shield className="h-3 w-3 text-success-600" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referral System */}
          {referralCode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Referral Program
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-neutral-900">Your Referral Code</h4>
                        <p className="text-sm text-neutral-600">
                          Share with friends to earn {referralCode.credits_reward} credits each
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-white rounded-lg border">
                        <code className="text-primary-600 font-mono font-medium">
                          {referralCode.code}
                        </code>
                      </div>
                      <Button
                        onClick={handleCopyReferralCode}
                        variant="primary"
                                               leftIcon={<Copy className="h-4 w-4" />}
                      >
                        Copy
                      </Button>
                    </div>

                    <div className="flex items-center justify-between text-sm text-neutral-600">
                      <span>Uses: {referralCode.uses_count}/{referralCode.max_uses}</span>
                      <span>Earned: {referralCode.uses_count * referralCode.credits_reward} credits</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settings Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                App Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <button className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-neutral-600" />
                  <span className="text-neutral-900">Notifications</span>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </button>

              <button className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-neutral-600" />
                  <span className="text-neutral-900">Privacy & Security</span>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </button>

              <button className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-neutral-600" />
                  <span className="text-neutral-900">Help & Support</span>
                </div>
                <ExternalLink className="h-4 w-4 text-neutral-400" />
              </button>
            </CardContent>
          </Card>

          {/* Sign Out */}
          <Card>
            <CardContent className="p-4">
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="lg"
                className="w-full text-error-600 hover:text-error-700 hover:bg-error-50"
                leftIcon={<LogOut className="h-5 w-5" />}
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>

          {/* App Info */}
          <div className="text-center pb-8 space-y-2">
            <p className="text-sm text-neutral-600">Luster AI v1.0.0</p>
            <p className="text-xs text-neutral-500">
              Made with ❤️ for real estate professionals
            </p>
          </div>
        </div>
      </div>
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
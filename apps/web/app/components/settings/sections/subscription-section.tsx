'use client'

import * as React from 'react'
import { CreditCard, Zap, Crown, Star, Shield, ChevronRight, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { SettingsRow, SettingsGroup } from '../settings-row'
import type { UserPlan, ReferralCode } from '@/app/types'

interface SubscriptionSectionProps {
  plan: UserPlan | null
  credits: number
  referralCode: ReferralCode | null
  onUpgrade: () => void
  onBuyCredits: () => void
  onCopyReferralCode: () => void
}

export function SubscriptionSection({
  plan,
  credits,
  referralCode,
  onUpgrade,
  onBuyCredits,
  onCopyReferralCode,
}: SubscriptionSectionProps) {
  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'pro':
        return <Zap className="h-6 w-6 text-primary-600" />
      case 'enterprise':
        return <Crown className="h-6 w-6 text-primary-600" />
      default:
        return <Star className="h-6 w-6 text-neutral-600" />
    }
  }

  const getPlanBadgeVariant = (planType: string): 'primary' | 'success' | 'neutral' => {
    switch (planType) {
      case 'pro':
        return 'primary'
      case 'enterprise':
        return 'success'
      default:
        return 'neutral'
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan Display */}
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-soft">
                {plan && getPlanIcon(plan.plan_type)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-neutral-900 capitalize">
                    {plan?.plan_type || 'Free'} Plan
                  </span>
                  {plan && (
                    <Badge variant={getPlanBadgeVariant(plan.plan_type)}>
                      {plan.plan_type === 'free' ? 'Current' : 'Active'}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-neutral-600 mt-0.5">
                  {plan?.credits_included} credits/month •{' '}
                  {plan?.plan_type === 'free' ? 'Standard quality' : 'Premium quality'}
                </p>
              </div>
            </div>
            {plan?.plan_type === 'free' && (
              <Button variant="primary" onClick={onUpgrade} rightIcon={<ChevronRight className="h-4 w-4" />}>
                Upgrade
              </Button>
            )}
          </div>

          {/* Plan Features */}
          {plan && (
            <div className="p-4 bg-white border border-neutral-200 rounded-xl">
              <h4 className="text-sm font-medium text-neutral-900 mb-3">Plan Features</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-neutral-600">
                    <Shield className="h-4 w-4 text-success-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credits Balance */}
      <Card className="border-primary-200 bg-primary-50/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-900">{credits}</p>
                <p className="text-sm text-primary-700">Credits available</p>
              </div>
            </div>
            <Button variant="primary" onClick={onBuyCredits}>
              Buy More
            </Button>
          </div>

          {/* Credit usage hint */}
          {credits < 5 && (
            <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
              <p className="text-sm text-warning-800">
                Running low on credits! Each photo enhancement uses 1 credit.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Program */}
      {referralCode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">🎁</span>
              Referral Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-xl">
              <p className="text-sm text-neutral-600 mb-3">
                Share your code and earn {referralCode.credits_reward} credits for each friend who signs up!
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-white rounded-lg border border-neutral-200">
                  <code className="text-primary-600 font-mono font-semibold text-lg">
                    {referralCode.code}
                  </code>
                </div>
                <Button variant="primary" onClick={onCopyReferralCode}>
                  Copy
                </Button>
              </div>
              <div className="flex items-center justify-between mt-3 text-sm text-neutral-600">
                <span>
                  Used: {referralCode.uses_count}/{referralCode.max_uses}
                </span>
                <span className="font-medium text-success-600">
                  +{referralCode.uses_count * referralCode.credits_reward} credits earned
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      <SettingsGroup title="Billing">
        <SettingsRow
          variant="link"
          icon={<Receipt className="h-5 w-5" />}
          label="Billing History"
          description="View past invoices and payments"
          onClick={() => {
            // Would navigate to billing history
            alert('Billing history would open here')
          }}
        />
        <SettingsRow
          variant="link"
          icon={<CreditCard className="h-5 w-5" />}
          label="Payment Methods"
          description="Manage your payment methods"
          onClick={() => {
            // Would navigate to payment methods
            alert('Payment methods would open here')
          }}
        />
      </SettingsGroup>
    </div>
  )
}

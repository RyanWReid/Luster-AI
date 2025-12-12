'use client'

import * as React from 'react'
import { HelpCircle, MessageCircle, FileText, Shield, LogOut } from 'lucide-react'
import { Card, CardContent } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { SettingsRow, SettingsGroup } from '../settings-row'

interface SupportSectionProps {
  appVersion: string
  onSignOut: () => void
}

export function SupportSection({ appVersion, onSignOut }: SupportSectionProps) {
  return (
    <div className="space-y-6">
      {/* Help & Support */}
      <SettingsGroup title="Help">
        <SettingsRow
          variant="link"
          icon={<HelpCircle className="h-5 w-5" />}
          label="Help Center"
          description="Browse FAQs and guides"
          onClick={() => {
            window.open('https://help.luster.ai', '_blank')
          }}
          external
        />
        <SettingsRow
          variant="link"
          icon={<MessageCircle className="h-5 w-5" />}
          label="Contact Support"
          description="Get help from our team"
          onClick={() => {
            window.open('mailto:support@luster.ai', '_blank')
          }}
          external
        />
      </SettingsGroup>

      {/* Legal */}
      <SettingsGroup title="Legal">
        <SettingsRow
          variant="link"
          icon={<FileText className="h-5 w-5" />}
          label="Terms of Service"
          description="Read our terms and conditions"
          onClick={() => {
            window.open('/terms', '_blank')
          }}
          external
        />
        <SettingsRow
          variant="link"
          icon={<Shield className="h-5 w-5" />}
          label="Privacy Policy"
          description="Learn how we protect your data"
          onClick={() => {
            window.open('/privacy', '_blank')
          }}
          external
        />
      </SettingsGroup>

      {/* About */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            {/* Logo */}
            <div className="w-16 h-16 mx-auto bg-primary-100 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-600">L</span>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Luster AI</h3>
              <p className="text-sm text-neutral-500">Version {appVersion}</p>
            </div>

            <p className="text-sm text-neutral-600">
              Professional photo enhancement for real estate
            </p>

            <p className="text-xs text-neutral-400">
              Made with ❤️ for real estate professionals
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out (Desktop) */}
      <div className="hidden lg:block">
        <Button
          variant="ghost"
          size="lg"
          onClick={onSignOut}
          leftIcon={<LogOut className="h-5 w-5" />}
          className="w-full text-error-600 hover:text-error-700 hover:bg-error-50"
        >
          Sign Out
        </Button>
      </div>
    </div>
  )
}

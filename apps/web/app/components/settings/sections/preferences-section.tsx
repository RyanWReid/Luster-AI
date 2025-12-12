'use client'

import * as React from 'react'
import { Bell, Mail, Smartphone, Image, Download, Moon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { SettingsRow, SettingsGroup } from '../settings-row'

interface PreferencesState {
  emailNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
  autoDownload: boolean
  highQualityDefault: boolean
}

interface PreferencesSectionProps {
  preferences: PreferencesState
  onPreferenceChange: (key: keyof PreferencesState, value: boolean) => void
}

export function PreferencesSection({ preferences, onPreferenceChange }: PreferencesSectionProps) {
  return (
    <div className="space-y-6">
      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <SettingsRow
            variant="toggle"
            icon={<Mail className="h-5 w-5" />}
            label="Email Notifications"
            description="Get notified when your photos are ready"
            checked={preferences.emailNotifications}
            onChange={(checked) => onPreferenceChange('emailNotifications', checked)}
          />
          <SettingsRow
            variant="toggle"
            icon={<Smartphone className="h-5 w-5" />}
            label="Push Notifications"
            description="Receive push notifications on your device"
            checked={preferences.pushNotifications}
            onChange={(checked) => onPreferenceChange('pushNotifications', checked)}
          />
          <SettingsRow
            variant="toggle"
            icon={<Mail className="h-5 w-5" />}
            label="Marketing Emails"
            description="Receive tips, updates, and special offers"
            checked={preferences.marketingEmails}
            onChange={(checked) => onPreferenceChange('marketingEmails', checked)}
          />
        </CardContent>
      </Card>

      {/* Enhancement Defaults */}
      <SettingsGroup title="Enhancement Defaults">
        <SettingsRow
          variant="toggle"
          icon={<Image className="h-5 w-5" />}
          label="High Quality by Default"
          description="Use premium quality settings when available"
          checked={preferences.highQualityDefault}
          onChange={(checked) => onPreferenceChange('highQualityDefault', checked)}
        />
        <SettingsRow
          variant="toggle"
          icon={<Download className="h-5 w-5" />}
          label="Auto-Download"
          description="Automatically download enhanced photos"
          checked={preferences.autoDownload}
          onChange={(checked) => onPreferenceChange('autoDownload', checked)}
        />
      </SettingsGroup>

      {/* Display (Future) */}
      <SettingsGroup title="Display">
        <SettingsRow
          variant="value"
          icon={<Moon className="h-5 w-5" />}
          label="Theme"
          description="Choose your preferred appearance"
          value="Light"
          onClick={() => {
            // Would open theme picker
            alert('Theme picker coming soon!')
          }}
        />
      </SettingsGroup>
    </div>
  )
}

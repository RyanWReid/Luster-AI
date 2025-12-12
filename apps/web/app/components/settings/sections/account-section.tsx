'use client'

import * as React from 'react'
import { User, Mail, Shield, Smartphone, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { SettingsRow, SettingsGroup } from '../settings-row'
import type { UserProfile, User as UserType } from '@/app/types'

interface AccountSectionProps {
  user: UserType | null
  profile: UserProfile | null
  onEditProfile: () => void
  onSignOut: () => void
}

export function AccountSection({ user, profile, onEditProfile, onSignOut }: AccountSectionProps) {
  const [showDangerZone, setShowDangerZone] = React.useState(false)

  // Get initials for avatar fallback
  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?'

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Profile'}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-xl font-semibold text-primary-700">{initials}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-neutral-900 truncate">
                {profile?.full_name || 'No name set'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-neutral-400" />
                <span className="text-sm text-neutral-600 truncate">{user?.email}</span>
                <Badge variant="success" className="ml-1">Verified</Badge>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-2 mt-1">
                  <Smartphone className="h-4 w-4 text-neutral-400" />
                  <span className="text-sm text-neutral-600">{profile.phone}</span>
                </div>
              )}
            </div>

            {/* Edit Button */}
            <Button variant="secondary" onClick={onEditProfile}>
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <SettingsGroup title="Security">
        <SettingsRow
          variant="value"
          icon={<Shield className="h-5 w-5" />}
          label="Authentication"
          description="How you sign in to your account"
          value="Magic Link"
        />
      </SettingsGroup>

      {/* Connected Accounts */}
      <SettingsGroup title="Connected Accounts">
        <SettingsRow
          variant="value"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          }
          label="Google"
          description="Sign in with Google"
          value={<Badge variant="neutral">Not connected</Badge>}
        />
        <SettingsRow
          variant="value"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
            </svg>
          }
          label="Apple"
          description="Sign in with Apple"
          value={<Badge variant="neutral">Not connected</Badge>}
        />
      </SettingsGroup>

      {/* Danger Zone */}
      <div className="space-y-2">
        <button
          onClick={() => setShowDangerZone(!showDangerZone)}
          className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider px-1 hover:text-neutral-700 transition-colors"
        >
          Danger Zone
          {showDangerZone ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>

        {showDangerZone && (
          <div className="space-y-2 animate-fade-in">
            <SettingsRow
              variant="link"
              icon={<Trash2 className="h-5 w-5 text-error-500" />}
              label="Delete Account"
              description="Permanently delete your account and all data"
              onClick={() => {
                // Would show delete confirmation modal
                alert('Delete account confirmation would appear here')
              }}
              className="border-error-200 hover:border-error-300"
            />
          </div>
        )}
      </div>

      {/* Sign Out Button (Mobile) */}
      <div className="lg:hidden pt-4">
        <Button
          variant="ghost"
          onClick={onSignOut}
          className="w-full text-error-600 hover:text-error-700 hover:bg-error-50"
        >
          Sign Out
        </Button>
      </div>
    </div>
  )
}

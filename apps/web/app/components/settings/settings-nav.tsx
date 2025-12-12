'use client'

import * as React from 'react'
import { cn } from '@/app/lib/utils'
import { User, CreditCard, Settings, HelpCircle, LucideIcon } from 'lucide-react'

export type SettingsSection = 'account' | 'subscription' | 'preferences' | 'support'

interface NavItem {
  id: SettingsSection
  label: string
  icon: LucideIcon
  description: string
}

export const settingsNavItems: NavItem[] = [
  {
    id: 'account',
    label: 'Account',
    icon: User,
    description: 'Profile, security, connected accounts',
  },
  {
    id: 'subscription',
    label: 'Subscription',
    icon: CreditCard,
    description: 'Plan, credits, billing',
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: Settings,
    description: 'Notifications, defaults',
  },
  {
    id: 'support',
    label: 'Support',
    icon: HelpCircle,
    description: 'Help, contact, about',
  },
]

interface SettingsNavProps {
  activeSection: SettingsSection
  onSectionChange: (section: SettingsSection) => void
  className?: string
}

export function SettingsNav({ activeSection, onSectionChange, className }: SettingsNavProps) {
  return (
    <nav className={cn('space-y-1', className)}>
      {settingsNavItems.map((item) => {
        const Icon = item.icon
        const isActive = activeSection === item.id

        return (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20',
              isActive
                ? 'bg-primary-50 text-primary-700 border-l-3 border-primary-500'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            )}
          >
            <Icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-primary-600' : 'text-neutral-500')} />
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-medium', isActive ? 'text-primary-700' : 'text-neutral-900')}>
                {item.label}
              </p>
              <p className={cn('text-xs truncate', isActive ? 'text-primary-600' : 'text-neutral-500')}>
                {item.description}
              </p>
            </div>
          </button>
        )
      })}
    </nav>
  )
}

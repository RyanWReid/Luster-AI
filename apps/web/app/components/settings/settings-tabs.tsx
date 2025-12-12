'use client'

import * as React from 'react'
import { cn } from '@/app/lib/utils'
import { settingsNavItems, SettingsSection } from './settings-nav'

interface SettingsTabsProps {
  activeSection: SettingsSection
  onSectionChange: (section: SettingsSection) => void
  className?: string
}

export function SettingsTabs({ activeSection, onSectionChange, className }: SettingsTabsProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  // Scroll active tab into view on mount and when active changes
  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const activeTab = container.querySelector(`[data-section="${activeSection}"]`)
    if (activeTab) {
      activeTab.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [activeSection])

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        'flex gap-2 overflow-x-auto px-4 py-3 bg-white border-b border-neutral-200',
        '-webkit-overflow-scrolling-touch scrollbar-hide',
        className
      )}
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {settingsNavItems.map((item) => {
        const Icon = item.icon
        const isActive = activeSection === item.id

        return (
          <button
            key={item.id}
            data-section={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap',
              'transition-all duration-200 touch-target tap-highlight-none',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20',
              isActive
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

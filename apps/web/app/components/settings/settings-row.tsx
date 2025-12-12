'use client'

import * as React from 'react'
import { cn } from '@/app/lib/utils'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { Toggle } from '@/app/components/ui/toggle'

type SettingsRowVariant = 'link' | 'toggle' | 'value' | 'action'

interface BaseSettingsRowProps {
  icon?: React.ReactNode
  label: string
  description?: string
  className?: string
}

interface LinkRowProps extends BaseSettingsRowProps {
  variant: 'link'
  onClick: () => void
  external?: boolean
}

interface ToggleRowProps extends BaseSettingsRowProps {
  variant: 'toggle'
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

interface ValueRowProps extends BaseSettingsRowProps {
  variant: 'value'
  value: string | React.ReactNode
  onClick?: () => void
}

interface ActionRowProps extends BaseSettingsRowProps {
  variant: 'action'
  action: React.ReactNode
}

export type SettingsRowProps = LinkRowProps | ToggleRowProps | ValueRowProps | ActionRowProps

export function SettingsRow(props: SettingsRowProps) {
  const { icon, label, description, className, variant } = props

  const baseClasses = cn(
    'flex items-center justify-between gap-4 p-4 rounded-xl transition-all duration-200',
    'bg-white border border-neutral-200',
    className
  )

  const interactiveClasses = cn(
    baseClasses,
    'hover:border-neutral-300 hover:shadow-soft cursor-pointer touch-target tap-highlight-none'
  )

  const content = (
    <>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
            <span className="text-neutral-600">{icon}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neutral-900 truncate">{label}</p>
          {description && (
            <p className="text-sm text-neutral-500 truncate">{description}</p>
          )}
        </div>
      </div>
    </>
  )

  if (variant === 'link') {
    const { onClick, external } = props
    return (
      <button
        onClick={onClick}
        className={cn(interactiveClasses, 'w-full text-left')}
      >
        {content}
        {external ? (
          <ExternalLink className="h-4 w-4 text-neutral-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-neutral-400 flex-shrink-0" />
        )}
      </button>
    )
  }

  if (variant === 'toggle') {
    const { checked, onChange, disabled } = props
    return (
      <div className={baseClasses}>
        {content}
        <Toggle
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          size="md"
        />
      </div>
    )
  }

  if (variant === 'value') {
    const { value, onClick } = props
    if (onClick) {
      return (
        <button
          onClick={onClick}
          className={cn(interactiveClasses, 'w-full text-left')}
        >
          {content}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-neutral-500">{value}</span>
            <ChevronRight className="h-4 w-4 text-neutral-400" />
          </div>
        </button>
      )
    }
    return (
      <div className={baseClasses}>
        {content}
        <span className="text-sm text-neutral-500 flex-shrink-0">{value}</span>
      </div>
    )
  }

  if (variant === 'action') {
    const { action } = props
    return (
      <div className={baseClasses}>
        {content}
        <div className="flex-shrink-0">{action}</div>
      </div>
    )
  }

  return null
}

// Grouped settings rows with a header
interface SettingsGroupProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function SettingsGroup({ title, children, className }: SettingsGroupProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {title && (
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-1">
          {title}
        </h3>
      )}
      <div className="space-y-2">{children}</div>
    </div>
  )
}

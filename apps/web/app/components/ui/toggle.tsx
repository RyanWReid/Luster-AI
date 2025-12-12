import * as React from 'react'
import { cn } from '@/app/lib/utils'

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  label?: string
  description?: string
  className?: string
  id?: string
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({
    checked,
    onChange,
    disabled = false,
    size = 'md',
    label,
    description,
    className,
    id,
  }, ref) => {
    const toggleId = id || React.useId()

    const handleClick = () => {
      if (!disabled) {
        onChange(!checked)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      }
    }

    // Track: md=44x24px, sm=36x20px | Thumb: md=20x20px, sm=16x16px
    // Thumb needs 2px margin from edges, so translate = track_width - thumb_width - 4px margin
    // md: 44 - 20 - 4 = 20px (translate-x-5) | sm: 36 - 16 - 4 = 16px (translate-x-4)
    const trackClasses = cn(
      'relative inline-flex items-center shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 focus-visible:ring-offset-2',
      {
        'bg-primary-500': checked,
        'bg-neutral-200': !checked,
        'opacity-50 cursor-not-allowed': disabled,
        'w-11 h-6': size === 'md',
        'w-9 h-5': size === 'sm',
      }
    )

    const thumbClasses = cn(
      'pointer-events-none inline-block rounded-full bg-white shadow-soft ring-0 transition-transform duration-200 ease-in-out',
      {
        'h-5 w-5': size === 'md',
        'h-4 w-4': size === 'sm',
        'translate-x-[22px]': checked && size === 'md',
        'translate-x-[18px]': checked && size === 'sm',
        'translate-x-[2px]': !checked,
      }
    )

    const toggle = (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={label ? `${toggleId}-label` : undefined}
        aria-describedby={description ? `${toggleId}-description` : undefined}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(trackClasses, className)}
      >
        <span className={thumbClasses} />
      </button>
    )

    if (label || description) {
      return (
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            {label && (
              <span
                id={`${toggleId}-label`}
                className="text-sm font-medium text-neutral-900"
              >
                {label}
              </span>
            )}
            {description && (
              <span
                id={`${toggleId}-description`}
                className="text-sm text-neutral-500"
              >
                {description}
              </span>
            )}
          </div>
          {toggle}
        </div>
      )
    }

    return toggle
  }
)

Toggle.displayName = 'Toggle'

export { Toggle }

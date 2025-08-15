import * as React from 'react'
import { cn } from '@/app/lib/utils'
import { BadgeVariant } from '@/app/types'

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
  dot?: boolean
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'neutral', dot = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'badge',
          {
            'badge-primary': variant === 'primary',
            'badge-success': variant === 'success',
            'badge-warning': variant === 'warning',
            'badge-error': variant === 'error',
            'badge-neutral': variant === 'neutral',
          },
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'status-dot mr-1',
              {
                'bg-primary-500': variant === 'primary',
                'bg-success-500': variant === 'success',
                'bg-warning-500': variant === 'warning',
                'bg-error-500': variant === 'error',
                'bg-neutral-500': variant === 'neutral',
              }
            )}
          />
        )}
        {children}
      </div>
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
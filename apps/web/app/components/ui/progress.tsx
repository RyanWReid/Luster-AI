import * as React from 'react'
import { cn } from '@/app/lib/utils'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({
    className,
    value,
    max = 100,
    variant = 'default',
    size = 'md',
    showLabel = false,
    ...props
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
      <div
        ref={ref}
        className={cn('relative w-full overflow-hidden rounded-full bg-neutral-200', className)}
        {...props}
      >
        <div
          className={cn(
            'h-full transition-all duration-300 ease-in-out rounded-full',
            {
              'bg-primary-500': variant === 'default',
              'bg-success-500': variant === 'success',
              'bg-warning-500': variant === 'warning',
              'bg-error-500': variant === 'error',
              'h-1': size === 'sm',
              'h-2': size === 'md',
              'h-3': size === 'lg',
            }
          )}
          style={{ width: `${percentage}%` }}
        />
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-neutral-700">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
    )
  }
)
Progress.displayName = 'Progress'

export { Progress }
import * as React from 'react'
import { cn } from '@/app/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-neutral-400 text-sm">
                {leftIcon}
              </span>
            </div>
          )}
          <input
            type={type}
            className={cn(
              'input',
              {
                'input-error': error,
                'pl-10': leftIcon,
                'pr-10': rightIcon,
              },
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-neutral-400 text-sm">
                {rightIcon}
              </span>
            </div>
          )}
        </div>
        {helperText && (
          <p className={cn(
            'mt-2 text-sm',
            error ? 'text-error-600' : 'text-neutral-600'
          )}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
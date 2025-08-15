import * as React from 'react'
import { cn } from '@/app/lib/utils'

export interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon' | 'text'
}

const Logo = React.forwardRef<SVGSVGElement, LogoProps>(
  ({ className, size = 'md', variant = 'full', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-6 w-auto',
      md: 'h-8 w-auto',
      lg: 'h-12 w-auto',
      xl: 'h-16 w-auto',
    }

    if (variant === 'icon') {
      return (
        <svg
          ref={ref}
          className={cn(sizeClasses[size], className)}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          {...props}
        >
          {/* 4-point star icon */}
          <path
            d="M16 2L20.944 11.056L30 16L20.944 20.944L16 30L11.056 20.944L2 16L11.056 11.056L16 2Z"
            fill="currentColor"
            className="text-primary-500"
          />
          <path
            d="M16 6L18.472 12.528L25 15L18.472 17.472L16 24L13.528 17.472L7 15L13.528 12.528L16 6Z"
            fill="white"
          />
        </svg>
      )
    }

    if (variant === 'text') {
      return (
        <div className={cn('flex items-center', className)}>
          <span className="font-bold text-neutral-900 text-xl">Luster AI</span>
        </div>
      )
    }

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <svg
          ref={ref}
          className={sizeClasses[size]}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          {...props}
        >
          {/* 4-point star icon */}
          <path
            d="M16 2L20.944 11.056L30 16L20.944 20.944L16 30L11.056 20.944L2 16L11.056 11.056L16 2Z"
            fill="currentColor"
            className="text-primary-500"
          />
          <path
            d="M16 6L18.472 12.528L25 15L18.472 17.472L16 24L13.528 17.472L7 15L13.528 12.528L16 6Z"
            fill="white"
          />
        </svg>
        {size !== 'sm' && (
          <span className={cn(
            'font-bold text-neutral-900',
            size === 'md' && 'text-lg',
            size === 'lg' && 'text-xl',
            size === 'xl' && 'text-2xl'
          )}>
            Luster AI
          </span>
        )}
      </div>
    )
  }
)

Logo.displayName = 'Logo'

export { Logo }
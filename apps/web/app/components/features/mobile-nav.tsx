'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/app/lib/utils'
import { Badge } from '@/app/components/ui/badge'
import { 
  FolderOpen, 
  Settings,
  Sparkles
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

const navItems: NavItem[] = [
  {
    title: 'Projects',
    href: '/projects',
    icon: FolderOpen,
  },
  {
    title: 'Enhance',
    href: '/enhance',
    icon: Sparkles,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export interface MobileNavProps {
  className?: string
}

export function MobileNav({ className }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 safe-area-padding-bottom',
      className
    )}>
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 touch-target tap-highlight-none',
                'min-w-[60px] relative',
                isActive 
                  ? 'bg-primary-50 text-primary-600' 
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100'
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  isActive && 'scale-110'
                )} />
                {item.badge && (
                  <Badge 
                    variant="error" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center min-w-[16px]"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className={cn(
                'text-xs font-medium transition-colors duration-200',
                isActive ? 'text-primary-600' : 'text-neutral-500'
              )}>
                {item.title}
              </span>
              {isActive && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// Top navigation bar for mobile
export interface MobileHeaderProps {
  title?: string
  showBack?: boolean
  onBack?: () => void
  rightAction?: React.ReactNode
  className?: string
}

export function MobileHeader({ 
  title, 
  showBack = false, 
  onBack, 
  rightAction, 
  className 
}: MobileHeaderProps) {
  return (
    <header className={cn(
      'sticky top-0 z-40 bg-white border-b border-neutral-200 safe-area-padding-top',
      className
    )}>
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-neutral-600 hover:text-neutral-900 transition-colors touch-target tap-highlight-none"
              aria-label="Go back"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          {title && (
            <h1 className="text-lg font-semibold text-neutral-900 truncate">
              {title}
            </h1>
          )}
        </div>
        {rightAction && (
          <div className="flex items-center gap-2">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  )
}

// Credit display component for header
export interface CreditDisplayProps {
  balance: number
  loading?: boolean
  onPurchase?: () => void
}

export function CreditDisplay({ balance, loading = false, onPurchase }: CreditDisplayProps) {
  const isLow = balance < 5

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-full animate-pulse">
        <div className="w-4 h-4 bg-neutral-300 rounded-full" />
        <div className="w-8 h-3 bg-neutral-300 rounded" />
      </div>
    )
  }

  return (
    <button
      onClick={onPurchase}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 touch-target tap-highlight-none',
        isLow 
          ? 'bg-warning-50 text-warning-700 border border-warning-200 hover:bg-warning-100' 
          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
      )}
    >
      <div className={cn(
        'w-2 h-2 rounded-full',
        isLow ? 'bg-warning-500' : 'bg-primary-500'
      )} />
      <span className="text-sm font-medium">
        {balance} {balance === 1 ? 'credit' : 'credits'}
      </span>
    </button>
  )
}

// Safe area styles for iOS
export const SafeAreaStyle = () => (
  <style jsx global>{`
    .safe-area-padding-top {
      padding-top: env(safe-area-inset-top);
    }
    
    .safe-area-padding-bottom {
      padding-bottom: env(safe-area-inset-bottom);
    }
    
    .safe-area-margin-bottom {
      margin-bottom: env(safe-area-inset-bottom);
    }
    
    @supports (-webkit-touch-callout: none) {
      .safe-area-padding-bottom {
        padding-bottom: max(env(safe-area-inset-bottom), 1rem);
      }
    }
  `}</style>
)
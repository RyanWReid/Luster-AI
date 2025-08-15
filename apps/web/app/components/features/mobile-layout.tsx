'use client'

import * as React from 'react'
import { cn } from '@/app/lib/utils'
import { MobileNav, MobileHeader, CreditDisplay, SafeAreaStyle } from './mobile-nav'
import { Logo } from '@/app/components/ui/logo'

export interface MobileLayoutProps {
  children: React.ReactNode
  title?: string
  showHeader?: boolean
  showNav?: boolean
  showBack?: boolean
  onBack?: () => void
  rightAction?: React.ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
}

export function MobileLayout({
  children,
  title,
  showHeader = true,
  showNav = true,
  showBack = false,
  onBack,
  rightAction,
  className,
  headerClassName,
  contentClassName,
}: MobileLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-neutral-50 flex flex-col', className)}>
      <SafeAreaStyle />
      
      {showHeader && (
        <MobileHeader
          title={title}
          showBack={showBack}
          onBack={onBack}
          rightAction={rightAction}
          className={headerClassName}
        />
      )}
      
      <main className={cn(
        'flex-1 overflow-hidden',
        showNav && 'pb-20', // Account for bottom navigation
        contentClassName
      )}>
        {children}
      </main>
      
      {showNav && <MobileNav />}
    </div>
  )
}

// App shell with logo and credits
export interface AppShellProps {
  children: React.ReactNode
  credits?: number
  creditsLoading?: boolean
  onPurchaseCredits?: () => void
  className?: string
}

export function AppShell({ 
  children, 
  credits, 
  creditsLoading = false,
  onPurchaseCredits,
  className 
}: AppShellProps) {
  return (
    <MobileLayout
      showHeader={true}
      showNav={true}
      rightAction={
        credits !== undefined && (
          <CreditDisplay
            balance={credits}
            loading={creditsLoading}
            onPurchase={onPurchaseCredits}
          />
        )
      }
      headerClassName="border-b-0 bg-white/80 backdrop-blur-md"
      className={className}
    >
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 z-30">
        <Logo size="md" />
      </div>
      {children}
    </MobileLayout>
  )
}

// Full screen layout (for auth, onboarding)
export interface FullScreenLayoutProps {
  children: React.ReactNode
  showBack?: boolean
  onBack?: () => void
  rightAction?: React.ReactNode
  className?: string
}

export function FullScreenLayout({
  children,
  showBack = false,
  onBack,
  rightAction,
  className,
}: FullScreenLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-white flex flex-col', className)}>
      <SafeAreaStyle />
      
      {(showBack || rightAction) && (
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md safe-area-padding-top">
          <div className="flex items-center justify-between h-14 px-4">
            <div>
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
            </div>
            {rightAction && (
              <div className="flex items-center gap-2">
                {rightAction}
              </div>
            )}
          </div>
        </div>
      )}
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}

// Modal layout for overlays
export interface ModalLayoutProps {
  children: React.ReactNode
  title?: string
  onClose?: () => void
  size?: 'sm' | 'md' | 'lg' | 'full'
  className?: string
}

export function ModalLayout({
  children,
  title,
  onClose,
  size = 'md',
  className,
}: ModalLayoutProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'w-full h-full',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className={cn(
        'bg-white rounded-t-2xl w-full animate-slide-up safe-area-padding-bottom',
        size !== 'full' && 'max-h-[90vh] mx-4 mb-4 rounded-2xl',
        sizeClasses[size],
        className
      )}>
        {(title || onClose) && (
          <div className="flex items-center justify-between p-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">
              {title}
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors touch-target tap-highlight-none"
                aria-label="Close"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
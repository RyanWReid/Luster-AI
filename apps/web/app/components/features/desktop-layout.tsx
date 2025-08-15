'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/app/lib/utils'
import { Badge } from '@/app/components/ui/badge'
import { Logo } from '@/app/components/ui/logo'
import { 
  FolderOpen, 
  Settings,
  Sparkles,
  Bell,
  User,
  LogOut,
  Menu,
  X
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

// Desktop Sidebar Navigation
export interface DesktopSidebarProps {
  className?: string
  collapsed?: boolean
  onToggle?: () => void
}

export function DesktopSidebar({ className, collapsed = false, onToggle }: DesktopSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-full bg-white border-r border-neutral-200 transition-all duration-300 z-30',
      collapsed ? 'w-16' : 'w-64',
      className
    )}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200">
        {!collapsed && (
          <Logo size="md" />
        )}
        {collapsed && (
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative',
                    isActive 
                      ? 'bg-primary-50 text-primary-700 shadow-sm' 
                      : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Icon className={cn(
                      'h-5 w-5 transition-colors',
                      isActive ? 'text-primary-600' : 'text-neutral-500 group-hover:text-neutral-700'
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
                  
                  {!collapsed && (
                    <>
                      <span className={cn(
                        'font-medium transition-colors',
                        isActive ? 'text-primary-900' : 'text-neutral-900'
                      )}>
                        {item.title}
                      </span>
                      
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-600 rounded-r-full" />
                      )}
                    </>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-sm rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.title}
                    </div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

// Desktop Header
export interface DesktopHeaderProps {
  title?: string
  credits?: number
  creditsLoading?: boolean
  onPurchaseCredits?: () => void
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  className?: string
}

export function DesktopHeader({ 
  title, 
  credits, 
  creditsLoading = false,
  onPurchaseCredits,
  sidebarCollapsed = false,
  onToggleSidebar,
  className 
}: DesktopHeaderProps) {
  return (
    <header className={cn(
      'sticky top-0 h-16 bg-white/80 backdrop-blur-md border-b border-neutral-200 flex items-center justify-between px-6 z-20',
      className
    )}>
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <Menu className="h-4 w-4" />
        </button>
        
        {title && (
          <h1 className="text-xl font-semibold text-neutral-900">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Credits Display */}
        {credits !== undefined && (
          <CreditDisplay
            balance={credits}
            loading={creditsLoading}
            onPurchase={onPurchaseCredits}
          />
        )}

        {/* Notifications */}
        <button className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors">
          <Bell className="h-5 w-5 text-neutral-600" />
        </button>

        {/* User Menu */}
        <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors">
          <User className="h-5 w-5 text-neutral-600" />
        </button>
      </div>
    </header>
  )
}

// Credit Display Component (Desktop optimized)
export interface CreditDisplayProps {
  balance: number
  loading?: boolean
  onPurchase?: () => void
}

export function CreditDisplay({ balance, loading = false, onPurchase }: CreditDisplayProps) {
  const isLow = balance < 5

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-lg animate-pulse">
        <div className="w-4 h-4 bg-neutral-300 rounded-full" />
        <div className="w-12 h-4 bg-neutral-300 rounded" />
      </div>
    )
  }

  return (
    <button
      onClick={onPurchase}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
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

// Main Desktop Layout
export interface DesktopLayoutProps {
  children: React.ReactNode
  title?: string
  credits?: number
  creditsLoading?: boolean
  onPurchaseCredits?: () => void
  className?: string
  headerClassName?: string
  contentClassName?: string
}

export function DesktopLayout({
  children,
  title,
  credits,
  creditsLoading,
  onPurchaseCredits,
  className,
  headerClassName,
  contentClassName,
}: DesktopLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Handle responsive sidebar
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false) // Close mobile sidebar on desktop
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen)
    } else {
      setSidebarCollapsed(!sidebarCollapsed)
    }
  }

  return (
    <div className={cn('min-h-screen bg-neutral-50 flex', className)}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <DesktopSidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        className={cn(
          'lg:fixed',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      />

      {/* Main Content */}
      <div className={cn(
        'flex-1 flex flex-col min-w-0',
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      )}>
        <DesktopHeader
          title={title}
          credits={credits}
          creditsLoading={creditsLoading}
          onPurchaseCredits={onPurchaseCredits}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          className={headerClassName}
        />
        
        <main className={cn(
          'flex-1 overflow-auto',
          contentClassName
        )}>
          {children}
        </main>
      </div>
    </div>
  )
}

// Full Screen Desktop Layout (for auth, onboarding)
export interface FullScreenDesktopLayoutProps {
  children: React.ReactNode
  showBack?: boolean
  onBack?: () => void
  rightAction?: React.ReactNode
  className?: string
}

export function FullScreenDesktopLayout({
  children,
  showBack = false,
  onBack,
  rightAction,
  className,
}: FullScreenDesktopLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-white flex flex-col', className)}>
      {(showBack || rightAction) && (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-200">
          <div className="flex items-center justify-between h-16 px-6 max-w-7xl mx-auto">
            <div>
              {showBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100"
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
                  <span className="font-medium">Back</span>
                </button>
              )}
            </div>
            {rightAction && (
              <div className="flex items-center gap-4">
                {rightAction}
              </div>
            )}
          </div>
        </header>
      )}
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}

// Desktop Modal Layout
export interface DesktopModalLayoutProps {
  children: React.ReactNode
  title?: string
  onClose?: () => void
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  className?: string
}

export function DesktopModalLayout({
  children,
  title,
  onClose,
  size = 'md',
  className,
}: DesktopModalLayoutProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'w-full h-full max-w-none',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={cn(
        'bg-white rounded-2xl w-full shadow-2xl animate-fade-in',
        size !== 'full' && 'max-h-[90vh]',
        sizeClasses[size],
        className
      )}>
        {(title || onClose) && (
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <h2 className="text-xl font-semibold text-neutral-900">
              {title}
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
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

// App Shell for Desktop
export interface DesktopAppShellProps {
  children: React.ReactNode
  credits?: number
  creditsLoading?: boolean
  onPurchaseCredits?: () => void
  className?: string
}

export function DesktopAppShell({ 
  children, 
  credits, 
  creditsLoading = false,
  onPurchaseCredits,
  className 
}: DesktopAppShellProps) {
  return (
    <DesktopLayout
      credits={credits}
      creditsLoading={creditsLoading}
      onPurchaseCredits={onPurchaseCredits}
      className={className}
    >
      {children}
    </DesktopLayout>
  )
}
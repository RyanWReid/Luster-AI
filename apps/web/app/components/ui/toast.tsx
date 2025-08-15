'use client'

import * as React from 'react'
import { cn } from '@/app/lib/utils'
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  title?: string
  message: string
  variant: ToastVariant
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface ToastProps extends Omit<Toast, 'id'> {
  onDismiss?: () => void
  className?: string
}

const variantStyles = {
  success: 'bg-success-50 border-success-200 text-success-800',
  error: 'bg-error-50 border-error-200 text-error-800',
  warning: 'bg-warning-50 border-warning-200 text-warning-800',
  info: 'bg-primary-50 border-primary-200 text-primary-800',
}

const variantIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

export function ToastComponent({
  title,
  message,
  variant,
  action,
  onDismiss,
  className,
}: ToastProps) {
  const Icon = variantIcons[variant]

  return (
    <div className={cn(
      'flex items-start gap-3 p-4 rounded-xl border shadow-medium animate-slide-up',
      variantStyles[variant],
      className
    )}>
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-medium text-sm mb-1">{title}</h4>
        )}
        <p className="text-sm opacity-90">{message}</p>
        
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium underline hover:no-underline transition-all"
          >
            {action.label}
          </button>
        )}
      </div>
      
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 opacity-70 hover:opacity-100 transition-opacity touch-target tap-highlight-none"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// Toast container context
interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast provider
export interface ToastProviderProps {
  children: React.ReactNode
  maxToasts?: number
  defaultDuration?: number
}

export function ToastProvider({ 
  children, 
  maxToasts = 5, 
  defaultDuration = 5000 
}: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 15)
    const newToast: Toast = { ...toast, id }
    
    setToasts(current => {
      const updated = [newToast, ...current].slice(0, maxToasts)
      return updated
    })

    // Auto dismiss
    const duration = toast.duration ?? defaultDuration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [maxToasts, defaultDuration])

  const removeToast = React.useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id))
  }, [])

  const clearToasts = React.useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  )
}

// Toast container
interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-50 space-y-3 safe-area-padding-top">
      {toasts.map(toast => (
        <ToastComponent
          key={toast.id}
          title={toast.title}
          message={toast.message}
          variant={toast.variant}
          action={toast.action}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  )
}

// Convenience hooks
export function useSuccessToast() {
  const { addToast } = useToast()
  return React.useCallback((message: string, title?: string) => {
    return addToast({ message, title, variant: 'success' })
  }, [addToast])
}

export function useErrorToast() {
  const { addToast } = useToast()
  return React.useCallback((message: string, title?: string) => {
    return addToast({ message, title, variant: 'error', duration: 0 }) // Don't auto-dismiss errors
  }, [addToast])
}

export function useWarningToast() {
  const { addToast } = useToast()
  return React.useCallback((message: string, title?: string) => {
    return addToast({ message, title, variant: 'warning' })
  }, [addToast])
}

export function useInfoToast() {
  const { addToast } = useToast()
  return React.useCallback((message: string, title?: string) => {
    return addToast({ message, title, variant: 'info' })
  }, [addToast])
}
'use client'

import * as React from 'react'
import { X, Camera, User } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import type { UserProfile } from '@/app/types'

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfile | null
  onSave: (data: { full_name: string; phone: string }) => Promise<void>
}

export function ProfileEditModal({ isOpen, onClose, profile, onSave }: ProfileEditModalProps) {
  const [fullName, setFullName] = React.useState(profile?.full_name || '')
  const [phone, setPhone] = React.useState(profile?.phone || '')
  const [saving, setSaving] = React.useState(false)
  const [errors, setErrors] = React.useState<{ fullName?: string; phone?: string }>({})

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFullName(profile?.full_name || '')
      setPhone(profile?.phone || '')
      setErrors({})
    }
  }, [isOpen, profile])

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const validate = (): boolean => {
    const newErrors: typeof errors = {}

    if (!fullName.trim()) {
      newErrors.fullName = 'Name is required'
    }

    if (phone && !/^[\d\s+()-]+$/.test(phone)) {
      newErrors.phone = 'Invalid phone number format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setSaving(true)
    try {
      await onSave({
        full_name: fullName.trim(),
        phone: phone.trim(),
      })
      onClose()
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  // Get initials for avatar
  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal - Desktop: centered, Mobile: bottom sheet */}
      <div
        className={cn(
          'fixed z-50 bg-white',
          // Desktop styles
          'lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:max-w-md lg:w-full lg:max-h-[90vh]',
          // Mobile styles (bottom sheet)
          'inset-x-0 bottom-0 lg:inset-auto rounded-t-2xl lg:rounded-2xl',
          'animate-slide-up'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 -m-2 text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-primary-700">{initials}</span>
                </div>
              )}
              <button
                type="button"
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-medium hover:bg-primary-600 transition-colors"
                onClick={() => {
                  // Would trigger file upload
                  alert('Avatar upload coming soon!')
                }}
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700">
              Full Name
            </label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your name"
              error={!!errors.fullName}
              helperText={errors.fullName}
              leftIcon={<User className="h-4 w-4" />}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">
              Phone Number <span className="text-neutral-400">(optional)</span>
            </label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              error={!!errors.phone}
              helperText={errors.phone}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </form>

        {/* Safe area padding for iOS */}
        <div className="h-safe-area-inset-bottom lg:hidden" />
      </div>
    </>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FullScreenDesktopLayout } from '@/app/components/features/desktop-layout'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Logo } from '@/app/components/ui/logo'
import { ToastProvider, useErrorToast, useSuccessToast } from '@/app/components/ui/toast'
import { ArrowLeft, Mail, User, Phone, Lock, Eye, EyeOff } from 'lucide-react'

interface SignupForm {
  email: string
  fullName: string
  phone: string
  password: string
  confirmPassword: string
}

type AuthMethod = 'password' | 'magic-link'

function SignupContent() {
  const [form, setForm] = useState<SignupForm>({
    email: '',
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'verification'>('form')
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const errorToast = useErrorToast()
  const successToast = useSuccessToast()

  const handleInputChange = (field: keyof SignupForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.email || !form.fullName) {
      errorToast('Please fill in all required fields')
      return
    }

    if (authMethod === 'password') {
      if (!form.password || form.password.length < 6) {
        errorToast('Password must be at least 6 characters')
        return
      }
      if (form.password !== form.confirmPassword) {
        errorToast('Passwords do not match')
        return
      }
    }

    setLoading(true)
    
    try {
      if (authMethod === 'password') {
        // Password-based signup
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/projects`,
            data: {
              full_name: form.fullName,
              phone: form.phone
            }
          }
        })

        if (error) {
          console.error('Signup error:', error)
          errorToast(error.message)
          return
        }

        if (data.user && !data.session) {
          setStep('verification')
          successToast('Check your email to confirm your account!')
        } else {
          // User is immediately logged in
          router.push('/projects')
          successToast('Account created successfully!')
        }
      } else {
        // Magic link signup
        const { error } = await supabase.auth.signInWithOtp({
          email: form.email,
          options: {
            emailRedirectTo: `${window.location.origin}/projects`,
            data: {
              full_name: form.fullName,
              phone: form.phone
            }
          }
        })

        if (error) {
          console.error('Magic link error:', error)
          errorToast(error.message)
          return
        }

        setStep('verification')
        successToast('Check your email for a magic link!')
      }
    } catch (error) {
      console.error('Signup error:', error)
      errorToast('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 'verification') {
      setStep('form')
    } else {
      router.push('/onboarding')
    }
  }

  const handleLoginRedirect = () => {
    router.push('/login')
  }

  if (step === 'verification') {
    return (
      <FullScreenDesktopLayout showBack onBack={handleBack}>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="max-w-sm mx-auto text-center space-y-6">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="h-10 w-10 text-primary-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-neutral-900">
                Check Your Email
              </h1>
              <p className="text-neutral-600">
                {authMethod === 'magic-link' 
                  ? 'We sent a magic link to'
                  : 'We sent a confirmation email to'
                }
              </p>
              <p className="text-primary-600 font-medium">
                {form.email}
              </p>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-neutral-600 space-y-2">
                  <p>
                    {authMethod === 'magic-link'
                      ? 'Click the magic link in your email to complete your account setup and sign in.'
                      : 'Click the confirmation link in your email to verify your account. After verification, you can sign in with your password.'
                    }
                  </p>
                  <p>
                    The link will expire in 1 hour for security.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button
                onClick={() => handleSignup({} as React.FormEvent)}
                variant="primary"
                size="lg"
                className="w-full"
                loading={loading}
              >
                Resend Email
              </Button>
              
              <Button
                onClick={() => setStep('form')}
                variant="ghost"
                size="lg"
                className="w-full"
              >
                Use Different Email
              </Button>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={handleLoginRedirect}
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Already have an account? <span className="text-primary-600 font-medium">Sign in</span>
              </button>
            </div>
          </div>
        </div>
      </FullScreenDesktopLayout>
    )
  }

  return (
    <FullScreenDesktopLayout showBack onBack={handleBack}>
      <div className="flex-1 flex flex-col">
        {/* Logo */}
        <div className="flex justify-center pt-8 pb-8">
          <Logo size="lg" />
        </div>

        {/* Form */}
        <div className="flex-1 px-6 pb-8">
          <div className="max-w-sm mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-neutral-900">
                      Create Account
                    </h1>
                    <p className="text-sm text-neutral-600 font-normal">
                      Join thousands of real estate professionals
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={handleInputChange('email')}
                      required
                      leftIcon={<Mail className="h-4 w-4 text-neutral-400" />}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700">
                      Full Name *
                    </label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={form.fullName}
                      onChange={handleInputChange('fullName')}
                      required
                      leftIcon={<User className="h-4 w-4 text-neutral-400" />}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={form.phone}
                      onChange={handleInputChange('phone')}
                      leftIcon={<Phone className="h-4 w-4 text-neutral-400" />}
                    />
                  </div>

                  {/* Auth Method Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-neutral-700">
                      How would you like to sign in?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAuthMethod('password')}
                        className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                          authMethod === 'password'
                            ? 'bg-primary-50 border-primary-500 text-primary-700'
                            : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <Lock className="h-4 w-4 mx-auto mb-1" />
                        Password
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthMethod('magic-link')}
                        className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                          authMethod === 'magic-link'
                            ? 'bg-primary-50 border-primary-500 text-primary-700'
                            : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <Mail className="h-4 w-4 mx-auto mb-1" />
                        Magic Link
                      </button>
                    </div>
                  </div>

                  {/* Password Fields (only show when password method selected) */}
                  {authMethod === 'password' && (
                    <>
                      <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                          Password *
                        </label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create a strong password"
                            value={form.password}
                            onChange={handleInputChange('password')}
                            required={authMethod === 'password'}
                            leftIcon={<Lock className="h-4 w-4 text-neutral-400" />}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-neutral-500">
                          Must be at least 6 characters
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
                          Confirm Password *
                        </label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            value={form.confirmPassword}
                            onChange={handleInputChange('confirmPassword')}
                            required={authMethod === 'password'}
                            leftIcon={<Lock className="h-4 w-4 text-neutral-400" />}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="pt-4 space-y-3">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      loading={loading}
                    >
                      Create Account
                    </Button>

                    <p className="text-xs text-neutral-500 text-center leading-relaxed">
                      By creating an account, you agree to our Terms of Service and Privacy Policy.
                      {authMethod === 'magic-link' ? 
                        " We'll send you a magic link to sign in - no password required!" :
                        " You can always use magic links to sign in later."
                      }
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="text-center pt-6">
              <button
                onClick={handleLoginRedirect}
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Already have an account? <span className="text-primary-600 font-medium">Sign in</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </FullScreenDesktopLayout>
  )
}

export default function SignupPage() {
  return (
    <ToastProvider>
      <SignupContent />
    </ToastProvider>
  )
}
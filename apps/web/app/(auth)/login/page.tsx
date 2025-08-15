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
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react'

type AuthMethod = 'password' | 'magic-link'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'verification'>('form')
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const errorToast = useErrorToast()
  const successToast = useSuccessToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      errorToast('Please enter your email address')
      return
    }

    if (authMethod === 'password' && !password) {
      errorToast('Please enter your password')
      return
    }

    setLoading(true)
    
    try {
      if (authMethod === 'password') {
        // Password-based login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password: password
        })

        if (error) {
          console.error('Login error:', error)
          errorToast(error.message)
          return
        }

        // Successful login
        router.push('/projects')
        successToast('Signed in successfully!')
      } else {
        // Magic link login
        const { error } = await supabase.auth.signInWithOtp({
          email: email.toLowerCase().trim(),
          options: {
            emailRedirectTo: `${window.location.origin}/projects`
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
      console.error('Login error:', error)
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

  const handleSignupRedirect = () => {
    router.push('/signup')
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
                We sent a magic link to
              </p>
              <p className="text-primary-600 font-medium">
                {email}
              </p>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-neutral-600 space-y-2">
                  <p>
                    Click the link in your email to sign in to your account.
                  </p>
                  <p>
                    The link will expire in 1 hour for security.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button
                onClick={() => handleLogin({} as React.FormEvent)}
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
                onClick={handleSignupRedirect}
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Don't have an account? <span className="text-primary-600 font-medium">Sign up</span>
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
                      Welcome Back
                    </h1>
                    <p className="text-sm text-neutral-600 font-normal">
                      Sign in to your account
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      leftIcon={<Mail className="h-4 w-4 text-neutral-400" />}
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

                  {/* Password Field (only show when password method selected) */}
                  {authMethod === 'password' && (
                    <div className="space-y-2">
                      <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                        Password
                      </label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
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
                    </div>
                  )}

                  <div className="pt-4 space-y-3">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      loading={loading}
                    >
                      {authMethod === 'password' ? 'Sign In' : 'Send Magic Link'}
                    </Button>

                    <p className="text-xs text-neutral-500 text-center leading-relaxed">
                      {authMethod === 'magic-link' 
                        ? "We'll send you a secure magic link to sign in - no password required!"
                        : "You can also sign in with a magic link if you prefer."
                      }
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="text-center pt-6">
              <button
                onClick={handleSignupRedirect}
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Don't have an account? <span className="text-primary-600 font-medium">Sign up</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </FullScreenDesktopLayout>
  )
}

export default function LoginPage() {
  return (
    <ToastProvider>
      <LoginContent />
    </ToastProvider>
  )
}
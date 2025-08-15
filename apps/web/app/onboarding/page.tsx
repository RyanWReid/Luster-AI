'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FullScreenDesktopLayout } from '@/app/components/features/desktop-layout'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { Logo } from '@/app/components/ui/logo'
import { 
  Camera, 
  Sparkles, 
  Share2, 
  FolderOpen,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import type { OnboardingScreen } from '@/app/types'

const onboardingScreens: OnboardingScreen[] = [
  {
    id: 'welcome',
    title: 'Welcome to Luster AI',
    subtitle: 'Transform Your Real Estate Photos',
    description: 'Professional photo enhancement powered by artificial intelligence. Take your property listings to the next level.',
    image: '/onboarding/welcome.svg',
    features: [
      'AI-powered photo enhancement',
      'Professional real estate results',
      'Easy-to-use desktop interface'
    ],
    cta_text: 'Get Started'
  },
  {
    id: 'enhance',
    title: 'Enhance Like a Pro',
    subtitle: 'Multiple Style Options',
    description: 'Choose from professional enhancement styles designed specifically for real estate photography.',
    image: '/onboarding/enhance.svg',
    features: [
      'Sky replacement and enhancement',
      'Interior lighting improvements',
      'Lawn and landscaping cleanup',
      'Color correction and staging'
    ],
    cta_text: 'Continue'
  },
  {
    id: 'projects',
    title: 'Organize Your Work',
    subtitle: 'Project Management',
    description: 'Group photos into projects, share collections with clients, and keep your work organized.',
    image: '/onboarding/projects.svg',
    features: [
      'Project-based organization',
      'Easy sharing with clients',
      'Google Drive integration',
      'Progress tracking'
    ],
    cta_text: 'Continue'
  },
  {
    id: 'ready',
    title: 'Ready to Transform?',
    subtitle: 'Start Enhancing Today',
    description: 'Join thousands of real estate professionals who trust Luster AI for their photo enhancement needs.',
    image: '/onboarding/ready.svg',
    features: [
      'Quick 3-step process',
      'Professional results in minutes',
      'Affordable credit system',
      'No subscription required'
    ],
    cta_text: 'Create Account'
  }
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()

  const currentScreen = onboardingScreens[currentStep]
  const isLastStep = currentStep === onboardingScreens.length - 1
  const isFirstStep = currentStep === 0

  const handleNext = () => {
    if (isLastStep) {
      router.push('/signup')
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (isFirstStep) return
    setCurrentStep(prev => prev - 1)
  }

  const handleSkip = () => {
    router.push('/login')
  }

  const getFeatureIcon = (index: number) => {
    const icons = [Camera, Sparkles, Share2, FolderOpen]
    const IconComponent = icons[index % icons.length]
    return <IconComponent className="h-5 w-5 text-primary-600" />
  }

  return (
    <FullScreenDesktopLayout
      rightAction={
        !isLastStep && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleSkip}
          >
            Skip
          </Button>
        )
      }
    >
      <div className="flex-1 flex flex-col">
        {/* Logo */}
        <div className="flex justify-center pt-8 pb-4">
          <Logo size="lg" />
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 pb-8">
          {onboardingScreens.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'w-8 bg-primary-600'
                  : index < currentStep
                  ? 'w-2 bg-primary-300'
                  : 'w-2 bg-neutral-300'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pb-8">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Illustration */}
            <div className="aspect-video bg-gradient-to-br from-primary-50 to-primary-100 rounded-3xl flex items-center justify-center">
              <div className="w-32 h-32 bg-primary-200 rounded-full flex items-center justify-center">
                <div className="text-4xl">
                  {currentStep === 0 && '🏠'}
                  {currentStep === 1 && '✨'}
                  {currentStep === 2 && '📁'}
                  {currentStep === 3 && '🚀'}
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-neutral-900">
                  {currentScreen.title}
                </h1>
                <p className="text-xl text-primary-600 font-medium">
                  {currentScreen.subtitle}
                </p>
              </div>
              <p className="text-lg text-neutral-600 leading-relaxed max-w-lg mx-auto">
                {currentScreen.description}
              </p>
            </div>

            {/* Features */}
            <Card className="max-w-md mx-auto">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {currentScreen.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {getFeatureIcon(index)}
                      <span className="text-neutral-700 flex-1">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-6 pb-8">
          <div className="max-w-md mx-auto space-y-4">
            <Button
              onClick={handleNext}
              variant="primary"
              size="lg"
              className="w-full"
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              {currentScreen.cta_text}
            </Button>

            <div className="flex gap-4">
              {!isFirstStep && (
                <Button
                  onClick={handlePrevious}
                  variant="ghost"
                  size="lg"
                  className="flex-1"
                  leftIcon={<ArrowLeft className="h-5 w-5" />}
                >
                  Previous
                </Button>
              )}

              {isLastStep && (
                <Button
                  onClick={handleSkip}
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                >
                  Sign In Instead
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </FullScreenDesktopLayout>
  )
}
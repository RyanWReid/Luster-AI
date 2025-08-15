'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DesktopLayout } from '@/app/components/features/desktop-layout'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { ToastProvider, useErrorToast } from '@/app/components/ui/toast'
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Crown,
  Star,
  Check
} from 'lucide-react'
import type { StylePreset, UserPlan } from '@/app/types'

// Available style presets - only options with backend implementations
const stylePresets: StylePreset[] = [
  {
    id: 'Default_Interior',
    name: 'Default Enhancement',
    description: 'Professional editorial real estate photography with balanced lighting and authentic staging',
    prompt: 'Default_Interior',
    preview_image: '/styles/default.jpg',
    category: 'enhancement',
    tags: ['professional', 'editorial', 'balanced']
  },
  {
    id: 'Flambient_Interior',
    name: 'Bright & Airy',
    description: 'Bright, airy interior with crisp whites and flambient lighting for a spacious feel',
    prompt: 'Flambient_Interior', 
    preview_image: '/styles/flambient.jpg',
    category: 'enhancement',
    tags: ['bright', 'airy', 'spacious']
  }
]

interface StyleSelectionProps {}

function StyleSelection({}: StyleSelectionProps) {
  const [selectedStyle, setSelectedStyle] = useState<StylePreset | null>(null)
  const [selectedPhotos, setSelectedPhotos] = useState<any[]>([])
  const [filteredStyles, setFilteredStyles] = useState<StylePreset[]>(stylePresets)
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()
  const errorToast = useErrorToast()
  const supabase = createClientComponentClient()

  const categories = [
    { id: 'all', name: 'Enhancement Styles', icon: Sparkles }
  ]

  useEffect(() => {
    console.log('Style page loaded, checking for photo data...')
    
    // Load selected photos metadata from previous step
    const photosMetadata = sessionStorage.getItem('enhancement-photos-metadata')
    if (photosMetadata) {
      try {
        const photos = JSON.parse(photosMetadata)
        console.log('Loaded photo metadata:', photos)
        setSelectedPhotos(photos)
      } catch (error) {
        console.error('Error loading photos:', error)
        router.push('/enhance')
      }
    } else {
      router.push('/enhance')
    }
    
    // Check user's plan  
    checkUserPlan()
  }, [router])

  const checkUserPlan = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // For now, mock the user plan - in real implementation this would come from your API
        // Based on CLAUDE.md, free users get 0 credits by default, premium users have paid plans
        const mockPlan: UserPlan = {
          id: '1',
          user_id: session.user.id,
          plan_type: 'free', // Default to free for now
          credits_included: 0,
          features: ['Basic Enhancement'],
          active: true,
          created_at: new Date().toISOString()
        }
        
        setUserPlan(mockPlan)
      }
    } catch (error) {
      console.error('Error checking user plan:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-determine tier based on user plan
  const getUserTier = (): 'free' | 'premium' => {
    return userPlan?.plan_type === 'free' ? 'free' : 'premium'
  }


  const handleBack = () => {
    router.push('/enhance')
  }

  const handleContinue = () => {
    if (!selectedStyle) {
      errorToast('Please select an enhancement style')
      return
    }

    console.log('Style selected:', selectedStyle)
    console.log('User tier:', getUserTier())

    // Store selected style and auto-determined tier in session storage
    const enhancementSettings = {
      style: selectedStyle,
      tier: getUserTier()
    }
    sessionStorage.setItem('enhancement-settings', JSON.stringify(enhancementSettings))
    
    console.log('Navigating to processing page...')
    router.push('/enhance/processing')
  }

  const handleStyleSelect = (style: StylePreset) => {
    setSelectedStyle(style)
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category ? category.icon : Sparkles
  }

  return (
    <DesktopLayout title="Choose Enhancement Style">
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Instructions */}
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-6 w-6 text-primary-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-primary-900">
                  Select Enhancement Style
                </h2>
                <p className="text-primary-700">
                  Choose how you want to enhance your {selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''}. Each style uses professional-grade AI enhancement tailored for real estate photography.
                </p>
              </div>
            </div>
          </div>

          {/* Plan Quality Info */}
          {userPlan && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  {userPlan.plan_type === 'free' ? (
                    <Star className="h-5 w-5 text-warning-600" />
                  ) : (
                    <Crown className="h-5 w-5 text-primary-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-neutral-900 capitalize">
                    {userPlan.plan_type} Plan
                  </h4>
                  <p className="text-sm text-neutral-600">
                    {userPlan.plan_type === 'free' 
                      ? 'Standard quality processing (1024x1024)'
                      : 'Premium quality processing (1536x1024, HD)'
                    }
                  </p>
                </div>
                {userPlan.plan_type === 'free' && (
                  <Button
                    onClick={() => router.push('/settings')}
                    variant="primary"
                    size="sm"
                  >
                    Upgrade
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Style Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredStyles.map((style) => {
              const isSelected = selectedStyle?.id === style.id
              const Icon = getCategoryIcon(style.category)

              return (
                <Card
                  key={style.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-primary-500 shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleStyleSelect(style)}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-neutral-900">
                              {style.name}
                            </h3>
                            <Badge variant="primary" className="mt-1">
                              {style.category}
                            </Badge>
                          </div>
                        </div>

                        {/* Selection Indicator */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isSelected
                            ? 'bg-primary-500 text-white'
                            : 'border-2 border-neutral-300'
                        }`}>
                          {isSelected && <Check className="h-4 w-4" />}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-neutral-600 leading-relaxed">
                        {style.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {style.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {/* Continue Button */}
          {selectedStyle && (
            <div className="border-t border-neutral-200 pt-8">
              <div className="bg-white border border-neutral-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-neutral-900">
                      Ready to enhance {selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''}
                    </h4>
                    <p className="text-neutral-600 mt-1">
                      Using <span className="font-medium text-primary-600">{selectedStyle.name}</span> with <span className="font-medium text-secondary-600">{getUserTier() === 'free' ? 'Standard' : 'Premium'} quality</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handleBack}
                      variant="ghost"
                      size="lg"
                      leftIcon={<ArrowLeft className="h-5 w-5" />}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleContinue}
                      variant="primary"
                      size="lg"
                      rightIcon={<ArrowRight className="h-5 w-5" />}
                    >
                      Start Enhancement
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DesktopLayout>
  )
}

export default function StyleSelectionPage() {
  return (
    <ToastProvider>
      <StyleSelection />
    </ToastProvider>
  )
}
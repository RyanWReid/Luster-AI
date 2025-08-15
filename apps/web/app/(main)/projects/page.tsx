'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DesktopLayout } from '@/app/components/features/desktop-layout'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { ToastProvider, useErrorToast, useSuccessToast } from '@/app/components/ui/toast'
import {
  Plus,
  FolderOpen,
  Share2,
  MoreVertical,
  Calendar,
  Image,
  Search,
  SortDesc,
  Grid3X3,
  List
} from 'lucide-react'
import type { Project, User } from '@/app/types'

interface ProjectsContentProps {}

function ProjectsContent({}: ProjectsContentProps) {
  const [user, setUser] = useState<User | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'count'>('recent')
  
  const router = useRouter()
  const supabase = createClientComponentClient()
  const errorToast = useErrorToast()
  const successToast = useSuccessToast()

  // Mock data for development
  const mockProjects: Project[] = [
    {
      id: '1',
      user_id: 'user1',
      name: 'Downtown Luxury Condo',
      description: '2BR/2BA luxury unit with city views',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-16T14:20:00Z',
      assets: [],
      share_link: 'https://luster.ai/share/abc123',
      is_shared: true,
      asset_count: 12
    },
    {
      id: '2',
      user_id: 'user1',
      name: 'Suburban Family Home',
      description: '4BR/3BA in great neighborhood',
      created_at: '2024-01-10T09:15:00Z',
      updated_at: '2024-01-12T16:45:00Z',
      assets: [],
      share_link: undefined,
      is_shared: false,
      asset_count: 8
    },
    {
      id: '3',
      user_id: 'user1',
      name: 'Modern Office Space',
      description: 'Commercial property downtown',
      created_at: '2024-01-08T11:00:00Z',
      updated_at: '2024-01-09T13:30:00Z',
      assets: [],
      share_link: 'https://luster.ai/share/def456',
      is_shared: true,
      asset_count: 20
    }
  ]

  useEffect(() => {
    checkAuth()
    loadProjects()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/onboarding')
        return
      }

      // Mock user for development
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        created_at: session.user.created_at,
        updated_at: session.user.updated_at || session.user.created_at
      })
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/onboarding')
    }
  }

  const loadProjects = async () => {
    setLoading(true)
    try {
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
      setProjects(mockProjects)
    } catch (error) {
      console.error('Error loading projects:', error)
      errorToast('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = () => {
    router.push('/enhance')
  }

  const handleProjectClick = (projectId: string) => {
    // Navigate to project details (will implement later)
    console.log('Open project:', projectId)
  }

  const handleShareProject = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (project.share_link) {
      try {
        await navigator.clipboard.writeText(project.share_link)
        successToast('Share link copied to clipboard!')
      } catch (error) {
        console.error('Failed to copy link:', error)
        errorToast('Failed to copy share link')
      }
    } else {
      // Create share link (will implement later)
      successToast('Creating share link...')
    }
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'count':
        return b.asset_count - a.asset_count
      case 'recent':
      default:
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    }
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <DesktopLayout title="Projects">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-neutral-600">Loading projects...</p>
          </div>
        </div>
      </DesktopLayout>
    )
  }

  return (
    <DesktopLayout title="Projects">
      <div className="flex-1 min-h-full">
        {/* Header Controls */}
        <div className="bg-white border-b border-neutral-200 px-6 py-4">
          {/* Search and Create */}
          <div className="flex items-center justify-between gap-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-700">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'count')}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="recent">Recent</option>
                  <option value="name">Name</option>
                  <option value="count">Photo Count</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              
              <Button
                onClick={handleCreateProject}
                variant="primary"
                size="md"
                leftIcon={<Plus className="h-5 w-5" />}
              >
                New Project
              </Button>
            </div>
          </div>

        </div>

        {/* Projects List */}
        <div className="p-8 max-w-7xl mx-auto">
          {sortedProjects.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto">
                <FolderOpen className="h-8 w-8 text-neutral-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-neutral-900">
                  {searchQuery ? 'No projects found' : 'No projects yet'}
                </h3>
                <p className="text-neutral-600 max-w-sm mx-auto">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Create your first project to get started with photo enhancement'
                  }
                </p>
              </div>
              {!searchQuery && (
                <Button
                  onClick={handleCreateProject}
                  variant="primary"
                  size="lg"
                  leftIcon={<Plus className="h-5 w-5" />}
                >
                  Create First Project
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {sortedProjects.map((project) => (
                <Card 
                  key={project.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 group h-fit"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1 min-w-0 pr-3">
                        <h3 className="text-xl font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors leading-tight mb-3">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="text-neutral-600 leading-relaxed">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-start gap-1 flex-shrink-0">
                        {project.is_shared && (
                          <button
                            onClick={(e) => handleShareProject(project, e)}
                            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Share project"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors"
                          title="More options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 mt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Image className="h-5 w-5" />
                          <span className="font-medium">{project.asset_count} photos</span>
                        </div>
                        
                        {project.is_shared && (
                          <Badge variant="primary">
                            Shared
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-neutral-500">
                        <Calendar className="h-5 w-5" />
                        <span>{formatDate(project.updated_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {sortedProjects.map((project) => (
                <Card 
                  key={project.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between gap-8">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-8">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-semibold text-neutral-900 mb-3 leading-tight">
                              {project.name}
                            </h3>
                            {project.description && (
                              <p className="text-neutral-600 leading-relaxed">
                                {project.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-8 text-neutral-600 flex-shrink-0">
                            <div className="flex items-center gap-2">
                              <Image className="h-5 w-5" />
                              <span className="font-medium">{project.asset_count} photos</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Calendar className="h-5 w-5" />
                              <span>{formatDate(project.updated_at)}</span>
                            </div>
                            
                            {project.is_shared && (
                              <Badge variant="primary">
                                Shared
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-1 flex-shrink-0">
                        {project.is_shared && (
                          <button
                            onClick={(e) => handleShareProject(project, e)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Share project"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors"
                          title="More options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DesktopLayout>
  )
}

export default function ProjectsPage() {
  return (
    <ToastProvider>
      <ProjectsContent />
    </ToastProvider>
  )
}
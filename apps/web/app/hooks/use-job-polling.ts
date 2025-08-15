import { useState, useEffect, useCallback, useRef } from 'react'
import { Job, JobStatus } from '@/app/types'
import { jobsApi, shootsApi } from '@/app/lib/api'

interface UseJobPollingOptions {
  interval?: number
  enabled?: boolean
  onStatusChange?: (job: Job) => void
  onComplete?: (job: Job) => void
  onError?: (job: Job) => void
}

export function useJobPolling(
  jobId: string | null,
  options: UseJobPollingOptions = {}
) {
  const {
    interval = 3000,
    enabled = true,
    onStatusChange,
    onComplete,
    onError,
  } = options

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const previousStatusRef = useRef<JobStatus | null>(null)

  const fetchJob = useCallback(async () => {
    if (!jobId) return

    try {
      setLoading(true)
      setError(null)
      const fetchedJob = await jobsApi.get(jobId)
      setJob(fetchedJob)

      // Check if status changed
      if (previousStatusRef.current !== fetchedJob.status) {
        onStatusChange?.(fetchedJob)
        previousStatusRef.current = fetchedJob.status

        // Check for completion
        if (fetchedJob.status === 'succeeded') {
          onComplete?.(fetchedJob)
        } else if (fetchedJob.status === 'failed') {
          onError?.(fetchedJob)
        }
      }

      // Stop polling if job is completed
      if (fetchedJob.status === 'succeeded' || fetchedJob.status === 'failed') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job')
    } finally {
      setLoading(false)
    }
  }, [jobId, onStatusChange, onComplete, onError])

  const startPolling = useCallback(() => {
    if (!enabled || !jobId || intervalRef.current) return

    // Fetch immediately
    fetchJob()

    // Start polling
    intervalRef.current = setInterval(fetchJob, interval)
  }, [enabled, jobId, fetchJob, interval])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Start/stop polling based on conditions
  useEffect(() => {
    if (enabled && jobId && (!job || (job.status !== 'succeeded' && job.status !== 'failed'))) {
      startPolling()
    } else {
      stopPolling()
    }

    return stopPolling
  }, [enabled, jobId, job?.status, startPolling, stopPolling])

  // Cleanup on unmount
  useEffect(() => {
    return stopPolling
  }, [stopPolling])

  const retry = useCallback(async () => {
    if (!jobId) return

    try {
      const retriedJob = await jobsApi.retry(jobId)
      setJob(retriedJob)
      previousStatusRef.current = retriedJob.status
      
      // Restart polling if job is now in queue/processing
      if (retriedJob.status === 'queued' || retriedJob.status === 'processing') {
        startPolling()
      }
      
      return retriedJob
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry job')
      throw err
    }
  }, [jobId, startPolling])

  return {
    job,
    loading,
    error,
    isPolling: intervalRef.current !== null,
    retry,
    refetch: fetchJob,
  }
}

export function useJobsPolling(
  shootId: string | null,
  options: UseJobPollingOptions = {}
) {
  const {
    interval = 5000,
    enabled = true,
    onStatusChange,
    onComplete,
    onError,
  } = options

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const previousJobsRef = useRef<Record<string, JobStatus>>({})

  const fetchJobs = useCallback(async () => {
    if (!shootId) return

    try {
      setLoading(true)
      setError(null)
      
      // This would need to be implemented in the API to fetch jobs by shoot
      // For now, we'll need to fetch assets and their jobs
      const { assets } = await shootsApi.getAssets(shootId)
      const allJobs = assets.flatMap(asset => asset.jobs || [])
      
      setJobs(allJobs)

      // Check for status changes
      allJobs.forEach(job => {
        const previousStatus = previousJobsRef.current[job.id]
        if (previousStatus !== job.status) {
          onStatusChange?.(job)
          previousJobsRef.current[job.id] = job.status

          if (job.status === 'succeeded') {
            onComplete?.(job)
          } else if (job.status === 'failed') {
            onError?.(job)
          }
        }
      })

      // Check if all jobs are completed
      const hasActiveJobs = allJobs.some(
        job => job.status === 'queued' || job.status === 'processing'
      )

      if (!hasActiveJobs && intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }, [shootId, onStatusChange, onComplete, onError])

  const startPolling = useCallback(() => {
    if (!enabled || !shootId || intervalRef.current) return

    fetchJobs()
    intervalRef.current = setInterval(fetchJobs, interval)
  }, [enabled, shootId, fetchJobs, interval])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (enabled && shootId) {
      const hasActiveJobs = jobs.some(
        job => job.status === 'queued' || job.status === 'processing'
      )

      if (hasActiveJobs || jobs.length === 0) {
        startPolling()
      } else {
        stopPolling()
      }
    } else {
      stopPolling()
    }

    return stopPolling
  }, [enabled, shootId, jobs, startPolling, stopPolling])

  return {
    jobs,
    loading,
    error,
    isPolling: intervalRef.current !== null,
    refetch: fetchJobs,
  }
}
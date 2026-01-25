import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { useSWRConfig } from 'swr'
import { fetcher, getCacheKey } from '@/lib/swr'
import { swrRealtimeConfig } from '@/lib/swr/config'

/**
 * Hooks untuk Auto-Refresh pada Specific Events
 *
 * Mendukung:
 * - Interval-based refresh
 * - Event-based refresh
 * - Conditional refresh
 * - Smart refresh (only when tab visible)
 */

/**
 * Hook untuk auto-refresh dengan interval
 * Data akan di-refresh secara otomatis setiap interval tertentu
 */
export function useAutoRefresh<T>(
  endpoint: string,
  params?: Record<string, any>,
  intervalMs: number = 5000,
  options?: {
    onlyWhenVisible?: boolean // Only refresh when tab is visible
    pauseOnError?: boolean // Pause refresh if error occurs
  }
) {
  const [isPaused, setIsPaused] = useState(false)
  const [isTabVisible, setIsTabVisible] = useState(true)

  // Track tab visibility
  useEffect(() => {
    if (!options?.onlyWhenVisible) return

    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [options?.onlyWhenVisible])

  const cacheKey = getCacheKey(endpoint, params)

  const shouldRefresh = !isPaused && (!options?.onlyWhenVisible || isTabVisible)

  const { data, error, isLoading, mutate } = useSWR<T>(
    cacheKey,
    fetcher,
    {
      ...swrRealtimeConfig,
      refreshInterval: shouldRefresh ? intervalMs : 0,
      onError: () => {
        if (options?.pauseOnError) {
          setIsPaused(true)
        }
      },
    }
  )

  return {
    data,
    error,
    isLoading,
    isPaused,
    pause: () => setIsPaused(true),
    resume: () => setIsPaused(false),
    refresh: mutate,
  }
}

/**
 * Hook untuk refresh based on custom events
 * Data akan di-refresh saat event tertentu terjadi
 */
export function useEventBasedRefresh<T>(
  endpoint: string,
  params?: Record<string, any>,
  eventName?: string
) {
  const cacheKey = getCacheKey(endpoint, params)
  const { mutate } = useSWRConfig()

  useEffect(() => {
    if (!eventName) return

    const handleEvent = () => {
      mutate(cacheKey)
    }

    window.addEventListener(eventName, handleEvent)
    return () => window.removeEventListener(eventName, handleEvent)
  }, [eventName, cacheKey, mutate])

  const { data, error, isLoading } = useSWR<T>(cacheKey, fetcher)

  return {
    data,
    error,
    isLoading,
    triggerRefresh: () => mutate(cacheKey),
  }
}

/**
 * Hook untuk refresh on window focus
 * Data di-refresh saat user kembali ke tab
 */
export function useRefreshOnFocus<T>(endpoint: string, params?: Record<string, any>) {
  const cacheKey = getCacheKey(endpoint, params)

  const { data, error, isLoading, mutate } = useSWR<T>(cacheKey, fetcher, {
    revalidateOnFocus: true,
    focusThrottleInterval: 3000, // Throttle to 3 seconds
  })

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
  }
}

/**
 * Hook untuk smart refresh
 * Refresh berdasarkan data staleness dan user activity
 */
export function useSmartRefresh<T>(
  endpoint: string,
  params?: Record<string, any>,
  options?: {
    staleTime?: number // Data considered stale after this time (ms)
    maxAge?: number // Maximum age before force refresh (ms)
  }
) {
  const [lastFetch, setLastFetch] = useState(Date.now())
  const cacheKey = getCacheKey(endpoint, params)

  const staleTime = options?.staleTime || 30000 // 30 seconds default
  const maxAge = options?.maxAge || 300000 // 5 minutes default

  const isStale = Date.now() - lastFetch > staleTime
  const isOld = Date.now() - lastFetch > maxAge

  const { data, error, isLoading, mutate } = useSWR<T>(cacheKey, fetcher, {
    revalidateOnFocus: isStale,
    revalidateOnReconnect: true,
    refreshInterval: isOld ? 5000 : 0, // Force refresh if too old
    onSuccess: () => {
      setLastFetch(Date.now())
    },
  })

  return {
    data,
    error,
    isLoading,
    isStale,
    isOld,
    age: Date.now() - lastFetch,
    refresh: mutate,
  }
}

/**
 * Hook untuk refresh on mutation success
 * Refresh related data after successful mutation
 */
export function useRefreshOnMutation(relatedEndpoints: string[]) {
  const { mutate } = useSWRConfig()

  const refreshAll = async () => {
    const promises = relatedEndpoints.map((endpoint) => mutate(endpoint))
    await Promise.all(promises)
  }

  const refreshOne = async (endpoint: string) => {
    await mutate(endpoint)
  }

  return {
    refreshAll,
    refreshOne,
    refreshMultiple: (endpoints: string[]) => {
      const promises = endpoints.map((endpoint) => mutate(endpoint))
      return Promise.all(promises)
    },
  }
}

/**
 * Hook untuk conditional auto-refresh
 * Refresh hanya jika condition terpenuhi
 */
export function useConditionalAutoRefresh<T>(
  endpoint: string,
  condition: boolean | (() => boolean),
  params?: Record<string, any>,
  intervalMs: number = 5000
) {
  const shouldRefresh = typeof condition === 'function' ? condition() : condition
  const cacheKey = getCacheKey(endpoint, params)

  const { data, error, isLoading, mutate } = useSWR<T>(cacheKey, fetcher, {
    refreshInterval: shouldRefresh ? intervalMs : 0,
  })

  return {
    data,
    error,
    isLoading,
    isRefreshing: shouldRefresh,
    refresh: mutate,
  }
}

/**
 * Hook untuk batch refresh multiple endpoints
 */
export function useBatchAutoRefresh(
  endpoints: Array<{
    endpoint: string
    params?: Record<string, any>
  }>,
  intervalMs: number = 10000
) {
  const { mutate } = useSWRConfig()

  useEffect(() => {
    const interval = setInterval(() => {
      endpoints.forEach(({ endpoint, params }) => {
        const key = getCacheKey(endpoint, params)
        mutate(key)
      })
    }, intervalMs)

    return () => clearInterval(interval)
  }, [endpoints, intervalMs, mutate])

  return {
    refreshAll: () => {
      endpoints.forEach(({ endpoint, params }) => {
        const key = getCacheKey(endpoint, params)
        mutate(key)
      })
    },
  }
}

/**
 * Custom event emitter untuk cross-component refresh
 */
export class RefreshEventEmitter {
  private static instance: RefreshEventEmitter
  private events: Map<string, Set<() => void>> = new Map()

  static getInstance(): RefreshEventEmitter {
    if (!RefreshEventEmitter.instance) {
      RefreshEventEmitter.instance = new RefreshEventEmitter()
    }
    return RefreshEventEmitter.instance
  }

  on(eventName: string, callback: () => void) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set())
    }
    this.events.get(eventName)!.add(callback)
  }

  off(eventName: string, callback: () => void) {
    this.events.get(eventName)?.delete(callback)
  }

  emit(eventName: string) {
    this.events.get(eventName)?.forEach((callback) => callback())
  }
}

/**
 * Hook untuk listen to custom refresh events
 */
export function useRefreshEvent(eventName: string, onRefresh: () => void) {
  useEffect(() => {
    const emitter = RefreshEventEmitter.getInstance()
    emitter.on(eventName, onRefresh)

    return () => {
      emitter.off(eventName, onRefresh)
    }
  }, [eventName, onRefresh])
}

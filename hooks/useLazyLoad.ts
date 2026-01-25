import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { fetcher, getCacheKey } from '@/lib/swr'

/**
 * Hooks untuk Lazy Loading Secondary Data
 *
 * Load data only when needed (on demand)
 * Berguna untuk:
 * - Non-critical data
 * - Heavy/large datasets
 * - User-triggered data loads
 */

/**
 * Hook untuk lazy load data dengan delay
 * Data akan di-fetch setelah delay tertentu
 */
export function useLazyLoadWithDelay<T>(
  endpoint: string,
  params?: Record<string, any>,
  delayMs: number = 1000
) {
  const [shouldFetch, setShouldFetch] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldFetch(true)
    }, delayMs)

    return () => clearTimeout(timer)
  }, [delayMs])

  const cacheKey = shouldFetch ? getCacheKey(endpoint, params) : null

  const { data, error, isLoading, mutate } = useSWR<T>(cacheKey, fetcher)

  return {
    data,
    error,
    isLoading: shouldFetch ? isLoading : true,
    refresh: mutate,
  }
}

/**
 * Hook untuk lazy load on user action (manual trigger)
 */
export function useLazyLoadManual<T>(endpoint: string, params?: Record<string, any>) {
  const [shouldFetch, setShouldFetch] = useState(false)

  const cacheKey = shouldFetch ? getCacheKey(endpoint, params) : null

  const { data, error, isLoading, mutate } = useSWR<T>(cacheKey, fetcher)

  return {
    data,
    error,
    isLoading: shouldFetch ? isLoading : false,
    isFetched: shouldFetch,
    load: () => setShouldFetch(true),
    refresh: mutate,
    reset: () => setShouldFetch(false),
  }
}

/**
 * Hook untuk lazy load on scroll/visibility
 * Data di-fetch saat element visible di viewport
 */
export function useLazyLoadOnView<T>(
  endpoint: string,
  params?: Record<string, any>,
  options?: {
    rootMargin?: string
    threshold?: number
  }
) {
  const [isVisible, setIsVisible] = useState(false)
  const [elementRef, setElementRef] = useState<Element | null>(null)

  useEffect(() => {
    if (!elementRef) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      {
        rootMargin: options?.rootMargin || '50px',
        threshold: options?.threshold || 0.1,
      }
    )

    observer.observe(elementRef)

    return () => {
      if (elementRef) {
        observer.unobserve(elementRef)
      }
    }
  }, [elementRef, isVisible, options])

  const cacheKey = isVisible ? getCacheKey(endpoint, params) : null

  const { data, error, isLoading, mutate } = useSWR<T>(cacheKey, fetcher)

  return {
    data,
    error,
    isLoading: isVisible ? isLoading : false,
    isVisible,
    refresh: mutate,
    ref: setElementRef,
  }
}

/**
 * Hook untuk lazy load dengan conditional
 * Data di-fetch hanya jika condition true
 */
export function useLazyLoadConditional<T>(
  endpoint: string,
  params?: Record<string, any>,
  condition?: boolean
) {
  const cacheKey = condition ? getCacheKey(endpoint, params) : null

  const { data, error, isLoading, mutate } = useSWR<T>(cacheKey, fetcher)

  return {
    data,
    error,
    isLoading: condition ? isLoading : false,
    refresh: mutate,
  }
}

/**
 * Hook untuk lazy load dengan pagination on-demand
 * Load next page hanya saat user request
 */
export function useLazyLoadPaginated<T>(
  endpoint: string,
  pageSize: number = 10
) {
  const [currentPage, setCurrentPage] = useState(1)
  const [allData, setAllData] = useState<T[]>([])

  const cacheKey = getCacheKey(endpoint, { page: currentPage, limit: pageSize })

  const { data, error, isLoading } = useSWR<{ data: T[]; pagination: any }>(
    cacheKey,
    fetcher,
    {
      onSuccess: (newData) => {
        if (currentPage === 1) {
          setAllData(newData.data)
        } else {
          setAllData((prev) => [...prev, ...newData.data])
        }
      },
    }
  )

  const hasMore = data?.pagination?.hasNext || false

  return {
    data: allData,
    error,
    isLoading,
    hasMore,
    loadMore: () => setCurrentPage((prev) => prev + 1),
    reset: () => {
      setCurrentPage(1)
      setAllData([])
    },
    currentPage,
  }
}

/**
 * Hook untuk lazy load dengan priority queue
 * Load data berdasarkan priority order
 */
export function useLazyLoadPriority<T>(
  endpoints: Array<{
    endpoint: string
    params?: Record<string, any>
    priority: number
  }>
) {
  const [loadedPriority, setLoadedPriority] = useState(0)

  // Sort by priority
  const sortedEndpoints = [...endpoints].sort((a, b) => a.priority - b.priority)

  useEffect(() => {
    const timer = setInterval(() => {
      setLoadedPriority((prev) => {
        const next = prev + 1
        if (next >= sortedEndpoints.length) {
          clearInterval(timer)
        }
        return next
      })
    }, 500) // Load next priority every 500ms

    return () => clearInterval(timer)
  }, [sortedEndpoints.length])

  const results = sortedEndpoints.map((item, index) => {
    const shouldLoad = index <= loadedPriority
    const cacheKey = shouldLoad ? getCacheKey(item.endpoint, item.params) : null

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, error, isLoading } = useSWR<T>(cacheKey, fetcher)

    return {
      endpoint: item.endpoint,
      priority: item.priority,
      data,
      error,
      isLoading: shouldLoad ? isLoading : false,
      isLoaded: shouldLoad,
    }
  })

  return {
    results,
    isComplete: loadedPriority >= sortedEndpoints.length - 1,
  }
}

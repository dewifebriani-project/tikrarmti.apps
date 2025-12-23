'use client'

import { ApiResponse, ApiError, PaginatedResponse } from '../api-wrapper'

/**
 * Centralized API Fetchers untuk SWR
 *
 * Menyediakan fetch functions yang:
 * - Auto-inject authentication tokens
 * - Consistent error handling
 * - Type-safe responses
 */


/**
 * Get auth token dari localStorage atau cookies
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null

  // Try to get from cookies first (for SSR compatibility)
  const match = document.cookie.match(/sb-access-token=([^;]+)/)
  if (match) return match[1]

  return null
}

/**
 * Base fetch configuration
 */
interface FetchConfig extends RequestInit {
  params?: Record<string, string | number | boolean>
  requireAuth?: boolean
}

/**
 * Build URL dengan query parameters
 */
function buildURL(endpoint: string, params?: Record<string, string | number | boolean>): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const url = new URL(endpoint, baseUrl || origin)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value))
    })
  }

  return url.toString()
}

/**
 * Build headers untuk request
 */
function buildHeaders(config?: FetchConfig): Headers {
  const headers = new Headers(config?.headers)

  // Set default content type
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Add auth token if required
  if (config?.requireAuth !== false) {
    const authToken = getAuthToken()
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`)
    }
  }

  return headers
}

/**
 * Generic fetcher untuk GET requests
 */
export async function fetcher<T>(url: string, config?: FetchConfig): Promise<T> {
  const fullUrl = buildURL(url, config?.params)
  const headers = buildHeaders(config)

  const response = await fetch(fullUrl, {
    ...config,
    method: 'GET',
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    const errorData: ApiError = await response.json()
    // Create proper Error object with message
    const error = new Error(errorData.error?.message || 'An error occurred')
    // Attach additional error properties
    ;(error as any).code = errorData.error?.code
    ;(error as any).details = errorData.error?.details
    throw error
  }

  const data: ApiResponse<T> = await response.json()
  return data.data as T
}

/**
 * Fetcher untuk paginated data
 */
export async function paginatedFetcher<T>(
  url: string,
  config?: FetchConfig
): Promise<PaginatedResponse<T>> {
  const fullUrl = buildURL(url, config?.params)
  const headers = buildHeaders(config)

  const response = await fetch(fullUrl, {
    ...config,
    method: 'GET',
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    const errorData: ApiError = await response.json()
    // Create proper Error object with message
    const error = new Error(errorData.error?.message || 'An error occurred')
    // Attach additional error properties
    ;(error as any).code = errorData.error?.code
    ;(error as any).details = errorData.error?.details
    throw error
  }

  return response.json()
}

/**
 * Fetcher untuk POST requests dengan mutation
 */
export async function postFetcher<T, D = any>(
  url: string,
  data: D,
  config?: FetchConfig
): Promise<T> {
  const fullUrl = buildURL(url, config?.params)
  const headers = buildHeaders(config)

  const response = await fetch(fullUrl, {
    ...config,
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    credentials: 'include',
  })

  if (!response.ok) {
    const errorData: ApiError = await response.json()
    // Create proper Error object with message
    const error = new Error(errorData.error?.message || 'An error occurred')
    // Attach additional error properties
    ;(error as any).code = errorData.error?.code
    ;(error as any).details = errorData.error?.details
    throw error
  }

  const result: ApiResponse<T> = await response.json()
  return result.data as T
}

/**
 * Fetcher untuk PUT requests dengan mutation
 */
export async function putFetcher<T, D = any>(
  url: string,
  data: D,
  config?: FetchConfig
): Promise<T> {
  const fullUrl = buildURL(url, config?.params)
  const headers = buildHeaders(config)

  const response = await fetch(fullUrl, {
    ...config,
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
    credentials: 'include',
  })

  if (!response.ok) {
    const errorData: ApiError = await response.json()
    // Create proper Error object with message
    const error = new Error(errorData.error?.message || 'An error occurred')
    // Attach additional error properties
    ;(error as any).code = errorData.error?.code
    ;(error as any).details = errorData.error?.details
    throw error
  }

  const result: ApiResponse<T> = await response.json()
  return result.data as T
}

/**
 * Fetcher untuk DELETE requests
 */
export async function deleteFetcher<T>(url: string, config?: FetchConfig): Promise<T> {
  const fullUrl = buildURL(url, config?.params)
  const headers = buildHeaders(config)

  const response = await fetch(fullUrl, {
    ...config,
    method: 'DELETE',
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    const errorData: ApiError = await response.json()
    // Create proper Error object with message
    const error = new Error(errorData.error?.message || 'An error occurred')
    // Attach additional error properties
    ;(error as any).code = errorData.error?.code
    ;(error as any).details = errorData.error?.details
    throw error
  }

  const result: ApiResponse<T> = await response.json()
  return result.data as T
}

/**
 * Infinite scroll fetcher untuk pagination
 * Returns data dengan getKey function untuk useSWRInfinite
 */
export function createInfiniteFetcher<T>(baseUrl: string, pageSize: number = 10) {
  return {
    getKey: (pageIndex: number, previousPageData: PaginatedResponse<T> | null) => {
      // Reached the end
      if (previousPageData && !previousPageData.pagination.hasNext) return null

      // First page
      if (pageIndex === 0) {
        return buildURL(baseUrl, { page: 1, limit: pageSize })
      }

      // Next pages
      return buildURL(baseUrl, { page: pageIndex + 1, limit: pageSize })
    },
    fetcher: (url: string) => paginatedFetcher<T>(url),
  }
}

/**
 * Preload function untuk critical data
 * Cache data sebelum user navigate
 */
export function preload<T>(url: string, config?: FetchConfig): Promise<T> {
  return fetcher<T>(url, config)
}

/**
 * Helper untuk invalidate cache
 */
export function getCacheKey(endpoint: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint
  }

  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key]
      return acc
    }, {} as Record<string, any>)

  return `${endpoint}?${new URLSearchParams(sortedParams as any).toString()}`
}

/**
 * Alias exports untuk backward compatibility
 */
export const getFetcher = fetcher

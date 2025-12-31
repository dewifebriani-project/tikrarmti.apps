'use client'

import { SWRConfiguration } from 'swr'
import { ApiError } from '../api-wrapper'

/**
 * Global SWR Configuration
 *
 * Mengatur behavior SWR di seluruh aplikasi untuk:
 * - Caching strategy
 * - Revalidation timing
 * - Error handling
 * - Network optimization
 */

/**
 * Default SWR configuration
 */
export const swrConfig: SWRConfiguration = {
  // Revalidation Settings
  revalidateOnFocus: true, // Revalidate saat user kembali ke tab
  revalidateOnReconnect: true, // Revalidate saat reconnect
  revalidateIfStale: true, // Revalidate jika data stale

  // Timing Configuration
  dedupingInterval: 2000, // Deduplicate requests dalam 2 detik
  focusThrottleInterval: 5000, // Throttle revalidation on focus
  errorRetryInterval: 5000, // Retry interval untuk error

  // Cache & Performance
  suspense: false, // Disable React Suspense mode
  keepPreviousData: true, // Keep previous data saat loading

  // Retry Configuration
  errorRetryCount: 3, // Maksimal 3x retry
  shouldRetryOnError: (error: any) => {
    // Jangan retry untuk session expired atau auth errors
    if (error.code === 'SESSION_EXPIRED' || error.status === 401) {
      return false
    }
    // Jangan retry untuk error client (4xx)
    if (error.code && String(error.code).startsWith('4')) {
      return false
    }
    // Jangan retry untuk error client (4xx) from old format
    if (error.error?.code && String(error.error?.code).startsWith('4')) {
      return false
    }
    // Retry untuk server errors (5xx) dan network errors
    return true
  },

  // Loading timeout
  loadingTimeout: 3000, // 3 detik timeout untuk loading

  // Error handler global
  onError: (error: any, key: string) => {
    console.error('[SWR Error]', {
      key,
      error: error.message || 'Unknown error',
      code: error.code,
      timestamp: new Date().toISOString(),
    })

    // Handle session expired - redirect to login
    if (error.code === 'SESSION_EXPIRED' || error.status === 401) {
      // Only redirect if we're on client side
      if (typeof window !== 'undefined') {
        // Prevent infinite redirect loops
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
          console.log('[SWR] Session expired, redirecting to login...');
          // Store current path for redirect after login
          sessionStorage.setItem('redirectAfterLogin', currentPath);
          // Redirect to login
          window.location.href = '/login?session=expired';
        }
      }
      return;
    }

    // Log error untuk monitoring (bisa integrate dengan Sentry, etc)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
    }
  },

  // Success handler global
  onSuccess: (data: any, key: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SWR Success]', {
        key,
        timestamp: new Date().toISOString(),
      })
    }
  },
}

/**
 * Configuration untuk infinite loading/pagination
 * Note: Additional infinite-specific options should be passed directly to useSWRInfinite
 */
export const swrInfiniteConfig: SWRConfiguration = {
  ...swrConfig,
  // Infinite-specific options like revalidateFirstPage, revalidateAll, persistSize
  // are passed directly to useSWRInfinite, not in SWRConfiguration
}

/**
 * Configuration untuk real-time data
 */
export const swrRealtimeConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 5000, // Auto refresh setiap 5 detik
  revalidateOnFocus: true,
  dedupingInterval: 1000, // Lebih aggressive deduping
}

/**
 * Configuration untuk static data yang jarang berubah
 */
export const swrStaticConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  dedupingInterval: 60000, // 1 menit
}

/**
 * Helper untuk merge custom config dengan default config
 */
export function createSWRConfig(customConfig?: Partial<SWRConfiguration>): SWRConfiguration {
  return {
    ...swrConfig,
    ...customConfig,
  }
}

/**
 * Alias export untuk backward compatibility
 */
export const cacheConfig = swrConfig

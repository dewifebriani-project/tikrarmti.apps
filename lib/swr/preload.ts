'use client'

import { cache } from 'swr/_internal'
import { fetcher, getCacheKey } from './fetchers'

/**
 * Preloading Strategies untuk Critical Data
 *
 * Menggunakan SWR cache untuk:
 * - Preload data sebelum navigate
 * - Prefetch untuk better UX
 * - Critical path optimization
 */

/**
 * Preload user data
 */
export async function preloadUserData(userId: string) {
  const cacheKey = getCacheKey(`/api/user/profile`, { id: userId })
  try {
    const data = await fetcher(cacheKey)
    // Data akan masuk ke SWR cache secara otomatis
    return data
  } catch (error) {
    console.error('Error preloading user data:', error)
    return null
  }
}

/**
 * Preload batch and program data
 */
export async function preloadBatchPrograms() {
  const batchKey = getCacheKey('/api/batch')
  const programKey = getCacheKey('/api/program')

  try {
    const [batches, programs] = await Promise.all([
      fetcher(batchKey),
      fetcher(programKey),
    ])
    return { batches, programs }
  } catch (error) {
    console.error('Error preloading batch/programs:', error)
    return null
  }
}

/**
 * Preload dashboard stats
 */
export async function preloadDashboardStats() {
  const cacheKey = getCacheKey('/api/admin/stats')
  try {
    const data = await fetcher(cacheKey)
    return data
  } catch (error) {
    console.error('Error preloading dashboard stats:', error)
    return null
  }
}

/**
 * Preload registration data untuk user
 */
export async function preloadMyRegistrations() {
  const cacheKey = getCacheKey('/api/pendaftaran')
  try {
    const data = await fetcher(cacheKey)
    return data
  } catch (error) {
    console.error('Error preloading registrations:', error)
    return null
  }
}

/**
 * Generic preload function
 */
export async function preloadData<T>(
  endpoint: string,
  params?: Record<string, any>
): Promise<T | null> {
  const cacheKey = getCacheKey(endpoint, params)
  try {
    const data = await fetcher<T>(cacheKey)
    return data
  } catch (error) {
    console.error(`Error preloading ${endpoint}:`, error)
    return null
  }
}

/**
 * Batch preload multiple endpoints
 */
export async function batchPreload(endpoints: Array<{
  endpoint: string
  params?: Record<string, any>
}>) {
  const promises = endpoints.map(({ endpoint, params }) =>
    preloadData(endpoint, params).catch(() => null)
  )

  return Promise.all(promises)
}

/**
 * Preload dengan priority
 * High priority data akan di-load duluan
 */
export async function preloadWithPriority(
  critical: Array<{ endpoint: string; params?: Record<string, any> }>,
  secondary: Array<{ endpoint: string; params?: Record<string, any> }>
) {
  // Load critical data first
  await batchPreload(critical)

  // Then load secondary data in background
  setTimeout(() => {
    batchPreload(secondary)
  }, 100)
}

/**
 * Preload untuk page navigation
 * Call this before navigating to optimize page load
 */
export const preloadStrategies = {
  // Preload untuk dashboard
  dashboard: () => preloadDashboardStats(),

  // Preload untuk pendaftaran page
  pendaftaran: () => preloadBatchPrograms(),

  // Preload untuk perjalanan saya
  perjalananSaya: () => preloadMyRegistrations(),

  // Preload untuk admin page
  admin: () => batchPreload([
    { endpoint: '/api/admin/stats' },
    { endpoint: '/api/admin/users', params: { page: 1, limit: 10 } },
    { endpoint: '/api/admin/tikrar', params: { page: 1, limit: 10 } },
  ]),
}

/**
 * Hook-like function untuk preload on hover
 * Usage: onMouseEnter={() => preloadOnHover('/dashboard')}
 */
export function preloadOnHover(route: string) {
  const strategyMap: Record<string, () => Promise<any>> = {
    '/dashboard': preloadStrategies.dashboard,
    '/pendaftaran': preloadStrategies.pendaftaran,
    '/perjalanan-saya': preloadStrategies.perjalananSaya,
    '/admin': preloadStrategies.admin,
  }

  const strategy = strategyMap[route]
  if (strategy) {
    return strategy()
  }

  return Promise.resolve()
}

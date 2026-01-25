'use client'

import { mutate } from 'swr'
import { getCacheKey } from './fetchers'

/**
 * Manual Cache Invalidation Strategies
 *
 * Provides functions untuk:
 * - Invalidate specific cache keys
 * - Invalidate related caches
 * - Pattern-based invalidation
 * - Optimistic updates
 */

/**
 * Invalidate single cache key
 */
export async function invalidateCache(endpoint: string, params?: Record<string, any>) {
  const key = getCacheKey(endpoint, params)
  await mutate(key)
}

/**
 * Invalidate multiple cache keys
 */
export async function invalidateMultiple(
  items: Array<{ endpoint: string; params?: Record<string, any> }>
) {
  const promises = items.map(({ endpoint, params }) => {
    const key = getCacheKey(endpoint, params)
    return mutate(key)
  })
  await Promise.all(promises)
}

/**
 * Invalidate all caches matching a pattern
 * Example: invalidatePattern('/api/admin/') will invalidate all admin endpoints
 */
export async function invalidatePattern(pattern: string) {
  // Get all SWR cache keys
  const cache = (globalThis as any).__SWR_CACHE__

  if (!cache) {
    console.warn('SWR cache not found')
    return
  }

  const keysToInvalidate: string[] = []

  // Find all keys matching pattern
  cache.keys().forEach((key: string) => {
    if (typeof key === 'string' && key.includes(pattern)) {
      keysToInvalidate.push(key)
    }
  })

  // Invalidate all matching keys
  await Promise.all(keysToInvalidate.map((key) => mutate(key)))
}

/**
 * Invalidation strategies untuk specific operations
 */
export const invalidationStrategies = {
  /**
   * After user registration/update
   */
  onUserUpdate: async (userId?: string) => {
    await invalidateMultiple([
      { endpoint: '/api/user/profile', params: userId ? { id: userId } : undefined },
      { endpoint: '/api/admin/users' },
      { endpoint: '/api/admin/stats' },
    ])
  },

  /**
   * After registration submission
   */
  onRegistrationSubmit: async () => {
    await invalidateMultiple([
      { endpoint: '/api/pendaftaran' },
      { endpoint: '/api/admin/tikrar' },
      { endpoint: '/api/admin/stats' },
      { endpoint: '/api/batch' }, // Update quota
      { endpoint: '/api/program' }, // Update quota
    ])
  },

  /**
   * After registration approval/rejection
   */
  onRegistrationStatusChange: async (registrationId?: string) => {
    await invalidateMultiple([
      { endpoint: '/api/pendaftaran', params: registrationId ? { id: registrationId } : undefined },
      { endpoint: '/api/admin/tikrar' },
      { endpoint: '/api/admin/stats' },
    ])
  },

  /**
   * After batch/program update
   */
  onBatchProgramUpdate: async () => {
    await invalidateMultiple([
      { endpoint: '/api/batch' },
      { endpoint: '/api/program' },
      { endpoint: '/api/admin/stats' },
    ])
  },

  /**
   * After admin action
   */
  onAdminAction: async () => {
    await invalidatePattern('/api/admin/')
  },

  /**
   * Clear all admin caches
   */
  clearAdminCache: async () => {
    await invalidatePattern('/api/admin/')
  },

  /**
   * Clear all user caches
   */
  clearUserCache: async () => {
    await invalidateMultiple([
      { endpoint: '/api/user/profile' },
      { endpoint: '/api/pendaftaran' },
    ])
  },

  /**
   * Clear all caches (use with caution!)
   */
  clearAllCache: async () => {
    const cache = (globalThis as any).__SWR_CACHE__
    if (cache) {
      cache.clear()
    }
  },
}

/**
 * Optimistic update helper
 * Update cache immediately before API call
 */
export async function optimisticUpdate<T>(
  endpoint: string,
  params: Record<string, any> | undefined,
  updateFn: (current: T | undefined) => T,
  revalidate: boolean = true
) {
  const key = getCacheKey(endpoint, params)

  await mutate(
    key,
    updateFn,
    {
      revalidate,
      populateCache: true,
      optimisticData: updateFn,
    } as any
  )
}

/**
 * Batch optimistic updates
 */
export async function batchOptimisticUpdate<T>(
  updates: Array<{
    endpoint: string
    params?: Record<string, any>
    updateFn: (current: T | undefined) => T
  }>,
  revalidate: boolean = true
) {
  const promises = updates.map(({ endpoint, params, updateFn }) =>
    optimisticUpdate(endpoint, params, updateFn, revalidate)
  )
  await Promise.all(promises)
}

/**
 * Rollback optimistic update on error
 */
export async function rollbackOptimisticUpdate<T>(
  endpoint: string,
  params: Record<string, any> | undefined,
  previousData: T
) {
  const key = getCacheKey(endpoint, params)
  await mutate(key, previousData, { revalidate: false })
}

/**
 * Hook-style invalidation untuk use dalam React components
 */
export function useInvalidation() {
  return {
    invalidate: invalidateCache,
    invalidateMultiple,
    invalidatePattern,
    strategies: invalidationStrategies,
    optimistic: optimisticUpdate,
    rollback: rollbackOptimisticUpdate,
  }
}

/**
 * Scheduled invalidation
 * Invalidate cache at specific time or interval
 */
export class ScheduledInvalidation {
  private timers: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Schedule invalidation after delay
   */
  scheduleAfter(
    endpoint: string,
    params: Record<string, any> | undefined,
    delayMs: number
  ) {
    const key = getCacheKey(endpoint, params)

    // Clear existing timer if any
    const existing = this.timers.get(key)
    if (existing) {
      clearTimeout(existing)
    }

    // Schedule new invalidation
    const timer = setTimeout(() => {
      invalidateCache(endpoint, params)
      this.timers.delete(key)
    }, delayMs)

    this.timers.set(key, timer)
  }

  /**
   * Schedule periodic invalidation
   */
  scheduleInterval(
    endpoint: string,
    params: Record<string, any> | undefined,
    intervalMs: number
  ) {
    const key = getCacheKey(endpoint, params)

    // Clear existing timer if any
    const existing = this.timers.get(key)
    if (existing) {
      clearInterval(existing)
    }

    // Schedule periodic invalidation
    const timer = setInterval(() => {
      invalidateCache(endpoint, params)
    }, intervalMs)

    this.timers.set(key, timer)
  }

  /**
   * Cancel scheduled invalidation
   */
  cancel(endpoint: string, params?: Record<string, any>) {
    const key = getCacheKey(endpoint, params)
    const timer = this.timers.get(key)

    if (timer) {
      clearTimeout(timer)
      clearInterval(timer)
      this.timers.delete(key)
    }
  }

  /**
   * Cancel all scheduled invalidations
   */
  cancelAll() {
    this.timers.forEach((timer) => {
      clearTimeout(timer)
      clearInterval(timer)
    })
    this.timers.clear()
  }
}

/**
 * Global instance untuk scheduled invalidation
 */
export const scheduledInvalidation = new ScheduledInvalidation()

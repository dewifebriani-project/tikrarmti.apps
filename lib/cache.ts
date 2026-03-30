/**
 * CACHING UTILITIES
 *
 * Provides caching utilities for frequently accessed data.
 * Uses Next.js built-in cache API for optimal performance.
 */

import { unstable_cache } from 'next/cache'

// =====================================================
// CACHE CONFIGURATION
// =====================================================

export const CACHE_DURATIONS = {
  /** 30 seconds - highly dynamic data */
  SHORT: 30,

  /** 5 minutes - moderately dynamic data */
  MEDIUM: 5 * 60,

  /** 15 minutes - relatively static data */
  LONG: 15 * 60,

  /** 1 hour - very static data */
  VERY_LONG: 60 * 60,

  /** 1 day - essentially static data */
  DAILY: 24 * 60 * 60,
} as const

// =====================================================
// CACHE KEY GENERATORS
// =====================================================

/**
 * Generate cache key for user data
 */
export function userCacheKey(userId: string): string {
  return `user:${userId}`
}

/**
 * Generate cache key for batch data
 */
export function batchCacheKey(batchId: string): string {
  return `batch:${batchId}`
}

/**
 * Generate cache key for halaqah list
 */
export function halaqahListCacheKey(filters?: Record<string, unknown>): string {
  const filterStr = filters ? JSON.stringify(filters) : 'all'
  return `halaqah:list:${filterStr}`
}

/**
 * Generate cache key for program list
 */
export function programListCacheKey(filters?: Record<string, unknown>): string {
  const filterStr = filters ? JSON.stringify(filters) : 'all'
  return `program:list:${filterStr}`
}

/**
 * Generate cache key for stats
 */
export function statsCacheKey(type: string, userId?: string): string {
  return userId ? `stats:${type}:${userId}` : `stats:${type}`
}

// =====================================================
// CACHE HELPERS
// =====================================================

/**
 * Create a cached version of an async function.
 * Use this for frequently accessed data that doesn't change often.
 *
 * @example
 * ```ts
 * const getCachedUser = cacheAsync(
 *   async (userId: string) => {
 *     const { data } = await supabase.from('users').select().eq('id', userId).single()
 *     return data
 *   },
 *   ['user'], // cache key parts
 *   { revalidate: 300 } // 5 minutes
 * )
 * ```
 */
export function cacheAsync<
  Args extends unknown[],
  Result
>(
  fn: (...args: Args) => Promise<Result>,
  keys: readonly string[],
  options: { revalidate: number | false | ((data: Result) => number) }
): (...args: Args) => Promise<Result> {
  return unstable_cache(fn, keys, options) as (...args: Args) => Promise<Result>
}

/**
 * Invalidate cache by key parts.
 * Use this after data mutations to ensure cache freshness.
 */
export async function invalidateCache(keyParts: string[]): Promise<void> {
  // Next.js 15+ uses automatic cache revalidation
  // This is a placeholder for manual invalidation if needed
  // In most cases, you should rely on revalidate time
  console.log('[Cache] Invalidate:', keyParts.join(':'))
}

/**
 * Create a cached fetcher for Supabase queries.
 * This wraps Supabase queries with Next.js cache.
 */
export function createCachedFetcher<T>(
  queryFn: () => Promise<T>,
  cacheKey: readonly string[],
  revalidate: number = CACHE_DURATIONS.MEDIUM
): () => Promise<T> {
  return cacheAsync(queryFn, cacheKey, { revalidate })
}

// =====================================================
// COMMON CACHED QUERIES
// =====================================================

/**
 * Cached query for getting active batches.
 * Batches don't change frequently, so we can cache them longer.
 */
export function getCachedActiveBatches<T>(
  queryFn: () => Promise<T>
): () => Promise<T> {
  return createCachedFetcher(
    queryFn,
    ['batches', 'active'],
    CACHE_DURATIONS.LONG
  )
}

/**
 * Cached query for getting programs by batch.
 * Programs change occasionally during registration periods.
 */
export function getCachedProgramsByBatch<T>(
  batchId: string,
  queryFn: () => Promise<T>
): () => Promise<T> {
  return createCachedFetcher(
    queryFn,
    ['programs', 'batch', batchId],
    CACHE_DURATIONS.MEDIUM
  )
}

/**
 * Cached query for getting halaqah by program.
 * Halaqah assignments change during registration.
 */
export function getCachedHalaqahByProgram<T>(
  programId: string,
  queryFn: () => Promise<T>
): () => Promise<T> {
  return createCachedFetcher(
    queryFn,
    ['halaqah', 'program', programId],
    CACHE_DURATIONS.MEDIUM
  )
}

/**
 * Cached query for getting user profile.
 * User profiles change infrequently.
 */
export function getCachedUserProfile<T>(
  userId: string,
  queryFn: () => Promise<T>
): () => Promise<T> {
  return createCachedFetcher(
    queryFn,
    ['user', 'profile', userId],
    CACHE_DURATIONS.LONG
  )
}

/**
 * Cached query for dashboard stats.
 * Stats change based on user activity, use medium duration.
 */
export function getCachedStats<T>(
  type: string,
  userId: string | undefined,
  queryFn: () => Promise<T>
): () => Promise<T> {
  const keys = userId
    ? ['stats', type, 'user', userId]
    : ['stats', type]

  return createCachedFetcher(
    queryFn,
    keys,
    CACHE_DURATIONS.SHORT
  )
}

// =====================================================
// CACHE TAGGING (for revalidation)
// =====================================================

/**
 * Cache tags for Next.js fetch API.
 * Use these with fetch() to enable tag-based revalidation.
 */
export const CACHE_TAGS = {
  // User-related
  USER: (id: string) => `user-${id}`,
  USER_PROFILE: (id: string) => `user-profile-${id}`,
  USER_ROLES: (id: string) => `user-roles-${id}`,

  // Batch-related
  BATCHES: 'batches',
  BATCH: (id: string) => `batch-${id}`,
  BATCH_ACTIVE: 'batches-active',

  // Program-related
  PROGRAMS: 'programs',
  PROGRAM: (id: string) => `program-${id}`,
  PROGRAMS_BY_BATCH: (batchId: string) => `programs-batch-${batchId}`,

  // Halaqah-related
  HALAQAH: 'halaqah',
  HALAQAH_BY_PROGRAM: (programId: string) => `halaqah-program-${programId}`,

  // Stats-related
  STATS: 'stats',
  STATS_USER: (userId: string) => `stats-user-${userId}`,
  STATS_ADMIN: 'stats-admin',

  // Registration-related
  REGISTRATIONS: 'registrations',
  REGISTRATIONS_BY_BATCH: (batchId: string) => `registrations-batch-${batchId}`,
  REGISTRATIONS_BY_USER: (userId: string) => `registrations-user-${userId}`,
} as const

/**
 * Combine multiple cache tags.
 * Useful for fetch() calls that should invalidate on multiple conditions.
 */
export function combineCacheTags(...tags: (string | (() => string))[]): string[] {
  return tags.map(tag => typeof tag === 'function' ? tag() : tag)
}

// =====================================================
// RESPONSE CACHING FOR API ROUTES
// =====================================================

/**
 * Cache-Control header values for different caching strategies.
 */
export const CACHE_CONTROL = {
  /** No caching - always fresh */
  NO_CACHE: 'no-store, no-cache, must-revalidate, proxy-revalidate',

  /** Client-side only - no server caching */
  CLIENT_ONLY: 'private, max-age=0',

  /** Short cache - 30 seconds */
  SHORT: 'public, max-age=30, s-maxage=30',

  /** Medium cache - 5 minutes */
  MEDIUM: 'public, max-age=300, s-maxage=300',

  /** Long cache - 15 minutes */
  LONG: 'public, max-age=900, s-maxage=900',

  /** Very long cache - 1 hour with revalidation */
  VERY_LONG: 'public, max-age=3600, stale-while-revalidate=60',
} as const

/**
 * Apply cache headers to NextResponse.
 * Use this in API routes to control caching behavior.
 */
export function setCacheHeaders(
  response: Response,
  strategy: keyof typeof CACHE_CONTROL
): Response {
  const newResponse = new Response(response.body, response)
  newResponse.headers.set('Cache-Control', CACHE_CONTROL[strategy])
  return newResponse
}

/**
 * Create a NextResponse with cache headers.
 * Convenience function for API routes.
 */
export function cachedResponse(
  data: unknown,
  strategy: keyof typeof CACHE_CONTROL = 'MEDIUM',
  status: number = 200
): Response {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': CACHE_CONTROL[strategy],
    },
  })
  return response
}

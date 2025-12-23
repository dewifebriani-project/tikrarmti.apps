import useSWRInfinite from 'swr/infinite'
import { paginatedFetcher, getCacheKey } from '@/lib/swr'
import { PaginatedResponse } from '@/lib/api-wrapper'

/**
 * Hooks untuk Paginated Data dengan useSWRInfinite
 *
 * Mendukung:
 * - Infinite scroll
 * - Load more pagination
 * - Automatic deduplication
 * - Cache management
 */

interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface RegistrationRecord {
  id: string
  user_id: string
  batch_id: string
  program_id: string
  status: string
  selection_status?: string
  created_at: string
  updated_at: string
  // Relations
  user?: User
  batch?: any
  program?: any
}

/**
 * Hook untuk paginated users list
 */
export function useAdminUsersPaginated(pageSize: number = 10, filters?: {
  role?: string
  search?: string
  is_active?: boolean
}) {
  const getKey = (pageIndex: number, previousPageData: PaginatedResponse<User> | null) => {
    // Reached the end
    if (previousPageData && !previousPageData.pagination.hasNext) return null

    // Build params
    const params: Record<string, any> = {
      page: pageIndex + 1,
      limit: pageSize,
      ...filters,
    }

    return getCacheKey('/api/admin/users', params)
  }

  const { data, error, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite<
    PaginatedResponse<User>
  >(getKey, paginatedFetcher)

  // Flatten all pages into single array
  const users = data ? data.flatMap((page) => page.data) : []
  const totalCount = data?.[0]?.pagination.total || 0
  const hasMore = data?.[data.length - 1]?.pagination.hasNext || false

  return {
    users,
    totalCount,
    isLoading,
    isValidating,
    error,
    size,
    hasMore,
    loadMore: () => setSize(size + 1),
    refresh: () => mutate(),
  }
}

/**
 * Hook untuk paginated registrations list
 */
export function useAdminRegistrationsPaginated(
  pageSize: number = 10,
  filters?: {
    batch_id?: string
    program_id?: string
    status?: string
    search?: string
  }
) {
  const getKey = (pageIndex: number, previousPageData: PaginatedResponse<RegistrationRecord> | null) => {
    // Reached the end
    if (previousPageData && !previousPageData.pagination.hasNext) return null

    // Build params
    const params: Record<string, any> = {
      page: pageIndex + 1,
      limit: pageSize,
      ...filters,
    }

    return getCacheKey('/api/admin/tikrar', params)
  }

  const { data, error, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite<
    PaginatedResponse<RegistrationRecord>
  >(getKey, paginatedFetcher)

  // Flatten all pages
  const registrations = data ? data.flatMap((page) => page.data) : []
  const totalCount = data?.[0]?.pagination.total || 0
  const hasMore = data?.[data.length - 1]?.pagination.hasNext || false

  return {
    registrations,
    totalCount,
    isLoading,
    isValidating,
    error,
    size,
    hasMore,
    loadMore: () => setSize(size + 1),
    refresh: () => mutate(),
  }
}

/**
 * Generic paginated hook yang bisa digunakan untuk any endpoint
 */
export function usePaginated<T>(
  endpoint: string,
  pageSize: number = 10,
  filters?: Record<string, any>
) {
  const getKey = (pageIndex: number, previousPageData: PaginatedResponse<T> | null) => {
    // Reached the end
    if (previousPageData && !previousPageData.pagination.hasNext) return null

    // Build params
    const params: Record<string, any> = {
      page: pageIndex + 1,
      limit: pageSize,
      ...filters,
    }

    return getCacheKey(endpoint, params)
  }

  const { data, error, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite<
    PaginatedResponse<T>
  >(getKey, paginatedFetcher)

  // Flatten all pages
  const items = data ? data.flatMap((page) => page.data) : []
  const totalCount = data?.[0]?.pagination.total || 0
  const hasMore = data?.[data.length - 1]?.pagination.hasNext || false

  return {
    items,
    totalCount,
    isLoading,
    isValidating,
    error,
    size,
    hasMore,
    loadMore: () => setSize(size + 1),
    refresh: () => mutate(),
    // Reset to first page
    reset: () => setSize(1),
  }
}

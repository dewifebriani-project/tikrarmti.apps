'use client'

import useSWR from 'swr'
import { useCallback } from 'react'
import { getFetcher, postFetcher, putFetcher, deleteFetcher } from '@/lib/swr/fetchers'
import { cacheConfig } from '@/lib/swr/config'
import { Batch } from '@/types/database'

/**
 * Type for batch query parameters
 */
export interface BatchQueryParams {
  status?: Batch['status']
  is_open?: boolean
  limit?: number
  offset?: number
  search?: string
}

/**
 * Hook for fetching batch list
 */
export function useBatches(params: BatchQueryParams = {}) {
  // Build query string
  const queryString = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'boolean') {
        queryString.append(key, value.toString())
      } else {
        queryString.append(key, String(value))
      }
    }
  })

  const url = queryString.toString() ? `/api/batch?${queryString}` : '/api/batch'

  const { data, error, isLoading, mutate } = useSWR<Batch[]>(
    url,
    getFetcher,
    {
      revalidateOnFocus: false, // Don't auto-refresh on focus
      dedupingInterval: 60000, // 1 minute cache
      refreshInterval: 0, // Manual refresh only
      fallbackData: [], // Empty array as fallback
    }
  )

  return {
    batches: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook for fetching single batch by ID
 */
export function useBatch(id?: string) {
  const { data, error, isLoading, mutate } = useSWR<Batch>(
    id ? `/api/batch/${id}` : null,
    getFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      refreshInterval: 0,
    }
  )

  return {
    batch: data || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook for fetching currently active batch
 */
export function useActiveBatch() {
  const { data, error, isLoading, mutate } = useSWR<Batch[]>(
    '/api/batch?status=open&limit=1',
    getFetcher,
    {
      revalidateOnFocus: true, // Refresh on focus to get latest status
      dedupingInterval: 60000,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  )

  return {
    activeBatch: data?.[0] || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook for batch mutations (create, update, delete)
 */
export function useBatchMutations() {
  // Create new batch
  const createBatch = async (data: Partial<Batch>) => {
    try {
      const response = await fetch('/api/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create batch')
      }

      return await response.json()
    } catch (error) {
      console.error('Create batch error:', error)
      throw error
    }
  }

  // Update existing batch
  const updateBatch = async (id: string, data: Partial<Batch>) => {
    try {
      const response = await fetch(`/api/batch/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update batch')
      }

      return await response.json()
    } catch (error) {
      console.error('Update batch error:', error)
      throw error
    }
  }

  // Delete batch
  const deleteBatch = async (id: string) => {
    try {
      const response = await fetch(`/api/batch/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete batch')
      }

      return true
    } catch (error) {
      console.error('Delete batch error:', error)
      throw error
    }
  }

  return {
    createBatch,
    updateBatch,
    deleteBatch,
  }
}

/**
 * Hook for batch status mutations (open, close, etc.)
 */
export function useBatchStatusMutations() {
  // Open batch
  const openBatch = async (id: string) => {
    try {
      const response = await fetch(`/api/batch/${id}/open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to open batch')
      }

      return await response.json()
    } catch (error) {
      console.error('Open batch error:', error)
      throw error
    }
  }

  // Close batch
  const closeBatch = async (id: string) => {
    try {
      const response = await fetch(`/api/batch/${id}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to close batch')
      }

      return await response.json()
    } catch (error) {
      console.error('Close batch error:', error)
      throw error
    }
  }

  return {
    openBatch,
    closeBatch,
  }
}

/**
 * Hook for batch analytics and statistics
 */
export function useBatchStats(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/batch/${id}/stats` : null,
    getFetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000, // 30 seconds cache
      refreshInterval: 60000, // Refresh every minute
    }
  )

  return {
    stats: data || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook for batch search functionality
 */
export function useBatchSearch(searchTerm: string, enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<Batch[]>(
    enabled && searchTerm ? `/api/batch/search?query=${encodeURIComponent(searchTerm)}` : null,
    getFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // 5 seconds cache for search
      refreshInterval: 0,
      fallbackData: [],
    }
  )

  return {
    searchResults: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}


export default useBatches
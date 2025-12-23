'use client'

import useSWR from 'swr'
import { useCallback } from 'react'
import { getFetcher, postFetcher, putFetcher, deleteFetcher } from '@/lib/swr/fetchers'
import { Program } from '@/types/database'

/**
 * Type for program query parameters
 */
export interface ProgramQueryParams {
  batch_id?: string
  status?: Program['status']
  target_level?: string
  limit?: number
  offset?: number
  search?: string
}

/**
 * Hook for fetching program list
 */
export function usePrograms(params: ProgramQueryParams = {}) {
  // Build query string
  const queryString = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryString.append(key, String(value))
    }
  })

  const url = queryString.toString() ? `/api/program?${queryString}` : '/api/program'

  const { data, error, isLoading, mutate } = useSWR<Program[]>(
    url,
    getFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute cache
      refreshInterval: 0, // Manual refresh only
      fallbackData: [], // Empty array as fallback
    }
  )

  return {
    programs: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook for fetching single program by ID
 */
export function useProgram(id?: string) {
  const { data, error, isLoading, mutate } = useSWR<Program>(
    id ? `/api/program/${id}` : null,
    getFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      refreshInterval: 0,
    }
  )

  return {
    program: data || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook for fetching programs by batch ID
 */
export function useProgramsByBatch(batchId?: string) {
  const { data, error, isLoading, mutate } = useSWR<Program[]>(
    batchId ? `/api/program?batch_id=${batchId}` : null,
    getFetcher,
    {
      revalidateOnFocus: true, // Refresh on focus for registration pages
      dedupingInterval: 60000, // 1 minute cache
      refreshInterval: 30000, // 30 seconds
      fallbackData: [],
    }
  )

  return {
    programs: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook for fetching available programs (open for registration)
 */
export function useAvailablePrograms() {
  const { data, error, isLoading, mutate } = useSWR<Program[]>(
    '/api/program/available',
    getFetcher,
    {
      revalidateOnFocus: true, // Refresh on focus for public pages
      dedupingInterval: 60000, // 1 minute cache
      refreshInterval: 30000, // 30 seconds
      fallbackData: [],
    }
  )

  return {
    programs: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook for program mutations (create, update, delete)
 */
export function useProgramMutations() {
  // Create new program
  const createProgram = async (data: Partial<Program>) => {
    try {
      const response = await fetch('/api/program', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create program')
      }

      return await response.json()
    } catch (error) {
      console.error('Create program error:', error)
      throw error
    }
  }

  // Update existing program
  const updateProgram = async (id: string, data: Partial<Program>) => {
    try {
      const response = await fetch(`/api/program/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update program')
      }

      return await response.json()
    } catch (error) {
      console.error('Update program error:', error)
      throw error
    }
  }

  // Delete program
  const deleteProgram = async (id: string) => {
    try {
      const response = await fetch(`/api/program/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete program')
      }

      return true
    } catch (error) {
      console.error('Delete program error:', error)
      throw error
    }
  }

  return {
    createProgram,
    updateProgram,
    deleteProgram,
  }
}

/**
 * Hook for program pricing information
 */
export function useProgramPricing(programId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    programId ? `/api/program/${programId}/pricing` : null,
    async (url: string) => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch program pricing')
        }

        const result = await response.json()
        return result.data || result
      } catch (error) {
        console.error('Error fetching program pricing:', error)
        return null
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes cache for pricing
      refreshInterval: 0,
    }
  )

  return {
    pricing: data || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook for program eligibility checking
 */
export function useProgramEligibility(programId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    programId ? `/api/program/${programId}/eligibility` : null,
    async (url: string) => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch program eligibility')
        }

        const result = await response.json()
        return result.data || result
      } catch (error) {
        console.error('Error fetching program eligibility:', error)
        return { eligible: false, requirements: [] }
      }
    },
    {
      revalidateOnFocus: true, // Check eligibility on focus
      dedupingInterval: 60000, // 1 minute cache
      refreshInterval: 0,
    }
  )

  return {
    eligibility: data || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
    isEligible: data?.eligible || false,
    requirements: data?.requirements || [],
  }
}

/**
 * Hook for program statistics and analytics
 */
export function useProgramStats(programId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    programId ? `/api/program/${programId}/stats` : null,
    getFetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000, // 30 seconds cache for stats
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
 * Hook for program search functionality
 */
export function useProgramSearch(searchTerm: string, enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<Program[]>(
    enabled && searchTerm ? `/api/program/search?query=${encodeURIComponent(searchTerm)}` : null,
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

/**
 * Hook for program recommendations based on user profile
 */
export function useProgramRecommendations() {
  const { data, error, isLoading, mutate } = useSWR<Program[]>(
    '/api/program/recommendations',
    getFetcher,
    {
      revalidateOnFocus: false, // Don't auto-refresh recommendations
      dedupingInterval: 600000, // 10 minutes cache for recommendations
      refreshInterval: 0,
      fallbackData: [],
    }
  )

  return {
    recommendations: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}


export default usePrograms
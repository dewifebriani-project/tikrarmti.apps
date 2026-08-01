'use client'

import useSWR from 'swr'
import { getFetcher } from '@/lib/swr/fetchers'
import { JuzOption } from '@/types/database'

/**
 * Hook for fetching all juz options
 */
export function useJuzOptions(batchId?: string) {
  const url = batchId ? `/api/juz?batchId=${batchId}` : '/api/juz';
  const { data, error, isLoading } = useSWR<JuzOption[]>(
    url,
    getFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes cache
      refreshInterval: 0,
    }
  )

  return {
    juzOptions: data || [],
    isLoading,
    isError: !!error,
    error,
  }
}

export default useJuzOptions

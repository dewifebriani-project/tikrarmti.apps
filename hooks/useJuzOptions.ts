'use client'

import useSWR from 'swr'
import { getFetcher } from '@/lib/swr/fetchers'
import { JuzOption } from '@/types/database'

/**
 * Hook for fetching all juz options
 */
export function useJuzOptions(batchId?: string, options?: { examOnly?: boolean }) {
  const query = new URLSearchParams();
  if (batchId) query.set('batchId', batchId);
  if (options?.examOnly) query.set('examOnly', 'true');
  const url = query.size > 0 ? `/api/juz?${query.toString()}` : '/api/juz';
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

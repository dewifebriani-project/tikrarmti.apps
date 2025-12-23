import useSWR from 'swr';

// Generic fetcher - relies on cookies for authentication
// The API route will use Supabase SSR to read session from cookies
const fetcher = async (url: string) => {
  console.log('[SWR Fetcher] Fetching:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('[SWR Fetcher] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[SWR Fetcher] Error response:', errorData);
      const error: any = new Error(errorData.error || 'An error occurred while fetching the data');
      error.info = errorData;
      error.status = response.status;
      throw error;
    }

    const result = await response.json();
    console.log('[SWR Fetcher] Success:', url, 'Data length:', result.users?.length || result.data?.length || 'N/A');
    return result;
  } catch (err) {
    console.error('[SWR Fetcher] Exception:', err);
    throw err;
  }
};

// Hook for fetching users data
export function useAdminUsers(enabled: boolean = true) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? '/api/admin/users' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      dedupingInterval: 5000, // Prevent duplicate requests within 5 seconds
      refreshInterval: 0, // Disable auto-refresh
      onError: (err) => {
        console.error('[useAdminUsers] Error:', err);
      },
      onSuccess: (data) => {
        console.log('[useAdminUsers] Success, users count:', data?.users?.length);
      }
    }
  );

  return {
    users: data?.users || [],
    isLoading,
    isError: error,
    mutate, // For manual revalidation
  };
}

// Hook for fetching tikrar data
export function useAdminTikrar(enabled: boolean = true) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? '/api/admin/tikrar?skipCount=true' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      dedupingInterval: 5000,
      refreshInterval: 0,
      onError: (err) => {
        console.error('[useAdminTikrar] Error:', err);
      },
      onSuccess: (data) => {
        console.log('[useAdminTikrar] Success, tikrar count:', data?.data?.length);
      }
    }
  );

  return {
    tikrar: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook for fetching admin stats
export function useAdminStats(enabled: boolean = true) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? '/api/admin/stats-simple' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      dedupingInterval: 10000,
      refreshInterval: 0, // Disable auto-refresh to prevent constant loading
      fallbackData: {
        stats: {
          totalBatches: 0,
          totalPrograms: 0,
          totalHalaqah: 0,
          totalUsers: 0,
          totalThalibah: 0,
          totalMentors: 0,
          pendingRegistrations: 0,
          pendingTikrar: 0,
        }
      },
      onError: (err) => {
        console.error('[useAdminStats] Error:', err);
      },
      onSuccess: (data) => {
        console.log('[useAdminStats] Success:', data?.stats);
      }
    }
  );

  return {
    stats: data?.stats || {
      totalBatches: 0,
      totalPrograms: 0,
      totalHalaqah: 0,
      totalUsers: 0,
      totalThalibah: 0,
      totalMentors: 0,
      pendingRegistrations: 0,
      pendingTikrar: 0,
    },
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook for fetching batches
export function useAdminBatches(enabled: boolean = true) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? '/api/admin/batches' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      dedupingInterval: 5000,
      refreshInterval: 0,
      onError: (err) => {
        console.error('[useAdminBatches] Error:', err);
      },
      onSuccess: (data) => {
        console.log('[useAdminBatches] Success, batches count:', data?.data?.length);
      }
    }
  );

  return {
    batches: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook for fetching programs
export function useAdminPrograms(enabled: boolean = true, batchId?: string) {
  // Build query string with batch filter if provided
  const queryString = batchId ? `?batch_id=${batchId}` : '';
  const url = enabled ? `/api/admin/programs${queryString}` : null;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      dedupingInterval: 5000,
      refreshInterval: 0,
      onError: (err) => {
        console.error('[useAdminPrograms] Error:', err);
      },
      onSuccess: (data) => {
        console.log('[useAdminPrograms] Success, programs count:', data?.data?.length);
      }
    }
  );

  return {
    programs: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

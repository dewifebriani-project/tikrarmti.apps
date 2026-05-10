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
      const error: any = new Error(errorData.error?.message || errorData.error || 'An error occurred while fetching the data');
      error.info = errorData;
      error.status = response.status;
      throw error;
    }

    const result = await response.json();

    // Handle ApiResponseBuilder format: { success: true, data: {...} }
    // Unwrap data if it's in the standard API response format
    const data = result.success ? result.data : result;

    console.log('[SWR Fetcher] Success:', url, 'Full result:', result);
    console.log('[SWR Fetcher] Unwrapped data:', data);
    console.log('[SWR Fetcher] Users count:', data?.users?.length ?? 'N/A');

    return data;
  } catch (err) {
    console.error('[SWR Fetcher] Exception:', err);
    throw err;
  }
};

// Hook for fetching users data
export function useAdminUsers(enabled: boolean = true, params: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  detectDuplicates?: boolean;
} = {}) {
  // Build query string
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.pageSize) queryParams.set('pageSize', params.pageSize.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.role) queryParams.set('role', params.role);
  if (params.status) queryParams.set('status', params.status);
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
  if (params.detectDuplicates) queryParams.set('detect_duplicates', 'true');

  const queryString = queryParams.toString();
  const url = enabled ? `/api/admin/users${queryString ? `?${queryString}` : ''}` : null;

  const { data, error, isLoading, mutate } = useSWR(
    url,
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
        console.error('[useAdminUsers] Error:', err);
      },
      onSuccess: (data) => {
        console.log('[useAdminUsers] Success, users count:', data?.users?.length, 'total:', data?.pagination?.totalCount);
      }
    }
  );

  return {
    users: data?.users || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
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
      dedupingInterval: 2000,
      refreshInterval: 0, // Disable auto-refresh to prevent constant loading
      fallbackData: {
        stats: {
          totalBatches: 0,
          totalPrograms: 0,
          totalHalaqah: 0,
          totalUsers: 0,
          totalThalibah: 0,
          totalMentors: 0,
          totalBlacklisted: 0,
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

// Hook for fetching muallimah registrations
export function useMuallimahRegistrations(enabled: boolean = true, params: {
  page?: number;
  batchId?: string;
  userId?: string;
} = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.batchId) queryParams.set('batchId', params.batchId);
  if (params.userId) queryParams.set('userId', params.userId);

  const queryString = queryParams.toString();
  const url = enabled ? `/api/admin/muallimah${queryString ? `?${queryString}` : ''}` : null;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      onSuccess: (data) => {
        console.log('[useMuallimahRegistrations] Success, count:', data?.data?.length);
      }
    }
  );

  return {
    registrations: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

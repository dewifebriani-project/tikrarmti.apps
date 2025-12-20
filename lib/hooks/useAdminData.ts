import useSWR from 'swr';
import { supabase } from '@/lib/supabase-singleton';
import { useAuth } from '@/contexts/AuthContext';

// Generic fetcher with auth token
const fetcher = async (url: string) => {
  console.log('[SWR Fetcher] Fetching:', url);

  try {
    // Get current session token
    const { data: { session } } = await supabase.auth.getSession();
    let token = session?.access_token;

    console.log('[SWR Fetcher] Has token:', !!token);

    // Refresh session if no token
    if (!token) {
      console.log('[SWR Fetcher] No token, refreshing session...');
      const { data: refreshData } = await supabase.auth.refreshSession();
      token = refreshData.session?.access_token;
      console.log('[SWR Fetcher] Token after refresh:', !!token);
    }

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
export function useAdminBatches() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/admin/batches',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      dedupingInterval: 5000,
      refreshInterval: 0,
    }
  );

  return {
    batches: data?.batches || [],
    isLoading,
    isError: error,
    mutate,
  };
}

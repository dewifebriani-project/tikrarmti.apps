import useSWR from 'swr';
import { supabase } from '@/lib/supabase-singleton';

// Generic fetcher with auth token
const fetcher = async (url: string) => {
  // Get current session token
  const { data: { session } } = await supabase.auth.getSession();
  let token = session?.access_token;

  // Refresh session if no token
  if (!token) {
    const { data: refreshData } = await supabase.auth.refreshSession();
    token = refreshData.session?.access_token;
  }

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    }
  });

  if (!response.ok) {
    const error: any = new Error('An error occurred while fetching the data');
    error.info = await response.json().catch(() => ({ error: 'Unknown error' }));
    error.status = response.status;
    throw error;
  }

  return response.json();
};

// Hook for fetching users data
export function useAdminUsers() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/admin/users',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      dedupingInterval: 5000, // Prevent duplicate requests within 5 seconds
      refreshInterval: 0, // Disable auto-refresh
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
export function useAdminTikrar() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/admin/tikrar?skipCount=true',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      dedupingInterval: 5000,
      refreshInterval: 0,
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
export function useAdminStats() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/admin/stats-simple',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      dedupingInterval: 10000,
      refreshInterval: 30000, // Refresh stats every 30 seconds
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

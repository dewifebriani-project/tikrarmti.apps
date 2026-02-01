import useSWR from 'swr';

// Generic fetcher - relies on cookies for authentication
const fetcher = async (url: string) => {
  console.log('[SWR Fetcher] Fetching:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      const error: any = new Error(errorData.error || 'An error occurred while fetching the data');
      error.info = errorData;
      error.status = response.status;
      throw error;
    }

    const result = await response.json();
    return result;
  } catch (err) {
    console.error('[SWR Fetcher] Exception:', err);
    throw err;
  }
};

// Hook for fetching muallimah registration
export function useMuallimahRegistration(enabled: boolean = true) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? '/api/muallimah/registration' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: 0,
    }
  );

  return {
    registration: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook for fetching muallimah halaqah
export function useMuallimahHalaqah(enabled: boolean = true) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? '/api/muallimah/halaqah' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: 0,
    }
  );

  return {
    halaqahList: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

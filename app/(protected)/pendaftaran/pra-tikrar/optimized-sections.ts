// Optimized data fetching utilities for tikrar-tahfidz page

interface BatchInfo {
  batch_id: string;
  program_id: string;
  batch_name: string;
  start_date: string;
  end_date: string;
  duration_weeks: number;
  price: number;
  is_free: boolean;
  scholarship_quota: number;
  total_quota: number;
  registered_count: number;
}

interface UserProfile {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  provinsi?: string;
  kota?: string;
  alamat?: string;
  zona_waktu?: string;
  tanggal_lahir?: string | null;
  tempat_lahir?: string;
  negara?: string;
  age?: string;
}

// Mobile detection helper
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Optimized batch info fetcher with better caching
export const fetchBatchInfoOptimized = async (): Promise<BatchInfo | null> => {
  const controller = new AbortController();
  // Increased timeout for desktop/tablet and mobile
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds for all platforms

  try {
    console.log('[fetchBatchInfoOptimized] Starting fetch...');
    const response = await fetch('/api/batch/default', {
      signal: controller.signal,
      cache: 'force-cache', // Aggressive caching
      headers: {
        'Cache-Control': 'max-age=300', // 5 minutes cache
      }
    });

    clearTimeout(timeoutId);
    console.log('[fetchBatchInfoOptimized] Response received:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('[fetchBatchInfoOptimized] Data fetched successfully:', data);

      // Cache with timestamp for cache invalidation
      const cacheData = {
        ...data,
        cached_at: Date.now()
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('batch_info_optimized', JSON.stringify(cacheData));
      }

      return data;
    } else {
      console.error('[fetchBatchInfoOptimized] Response not OK:', response.status);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[fetchBatchInfoOptimized] Error:', error);

    // Try to use cached data if available
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('batch_info_optimized');
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          console.log('[fetchBatchInfoOptimized] Using cached data as fallback');
          return cachedData;
        } catch (e) {
          console.error('[fetchBatchInfoOptimized] Failed to parse cached data:', e);
        }
      }
    }
  }

  return null;
};

// Get cached batch info with validity check
export const getCachedBatchInfo = (): BatchInfo | null => {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem('batch_info_optimized');
    if (!cached) return null;

    const data = JSON.parse(cached);
    const cacheAge = Date.now() - (data.cached_at || 0);
    // Longer cache for all platforms to ensure data availability
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for all platforms

    console.log('[getCachedBatchInfo] Cache age:', Math.round(cacheAge / 1000), 'seconds');

    if (cacheAge < CACHE_DURATION) {
      console.log('[getCachedBatchInfo] Returning cached data');
      return data;
    } else {
      console.log('[getCachedBatchInfo] Cache expired, age:', Math.round(cacheAge / 1000), 'seconds');
    }
  } catch (e) {
    console.error('[getCachedBatchInfo] Error parsing cache:', e);
    // Invalid cache
  }

  return null;
};

// Helper function to build UserProfile from database row
const buildUserProfile = (data: any): UserProfile => {
  // Calculate age
  let age = 0;
  if (data?.tanggal_lahir) {
    const birthDate = new Date(data.tanggal_lahir);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  return {
    id: data.id,
    full_name: data.full_name || '',
    email: data.email || '',
    whatsapp: data.whatsapp || '',
    telegram: data.telegram || '',
    alamat: data.alamat || '',
    zona_waktu: data.zona_waktu || '',
    tanggal_lahir: data.tanggal_lahir || null,
    kota: data.kota || '',
    tempat_lahir: data.tempat_lahir || '',
    negara: data.negara || '',
    provinsi: data.provinsi || '',
    age: age.toString()
  };
};

// Direct Supabase fetcher - DISABLED to prevent 401 errors
// User data should come from AuthContext instead
export const fetchUserProfileDirect = async (userId: string): Promise<UserProfile | null> => {
  console.log('[fetchUserProfileDirect] DISABLED - User data should come from AuthContext');
  console.log('[fetchUserProfileDirect] Returning null for userId:', userId);

  // Return null immediately without making any Supabase calls
  // This prevents 401 Unauthorized errors when called from client-side
  return null;
};

// Keep old function for backward compatibility but use direct fetch
export const fetchUserProfileOptimized = fetchUserProfileDirect;

// Get cached user profile
export const getCachedUserProfile = (userId: string): UserProfile | null => {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(`user_profile_optimized_${userId}`);
    if (!cached) return null;

    const data = JSON.parse(cached);
    const cacheAge = Date.now() - (data.cached_at || 0);
    const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for user data

    if (cacheAge < CACHE_DURATION) {
      return data;
    }
  } catch (e) {
    // Invalid cache
  }

  return null;
};

// Parallel data fetcher with retry mechanism
export const fetchInitialData = async (userId?: string, retryCount = 0): Promise<{
  batchInfo: BatchInfo | null;
  userProfile: UserProfile | null;
}> => {
  const maxRetries = 3;
  const promises: Promise<any>[] = [];

  // Always fetch batch info
  promises.push(fetchBatchInfoOptimized());

  // Only fetch user profile if userId is provided
  if (userId) {
    promises.push(fetchUserProfileOptimized(userId));
  }

  try {
    const results = await Promise.allSettled(promises);

    const batchInfo = results[0].status === 'fulfilled' ? results[0].value : null;
    const userProfile = results[1]?.status === 'fulfilled' ? results[1].value : null;

    // If batch info failed and we have retries left, retry
    if (!batchInfo && retryCount < maxRetries) {
      console.log(`[fetchInitialData] Batch fetch failed, retrying... (${retryCount + 1}/${maxRetries})`);
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return fetchInitialData(userId, retryCount + 1);
    }

    return {
      batchInfo,
      userProfile
    };
  } catch (error) {
    console.error('[fetchInitialData] Error:', error);

    // Retry on error
    if (retryCount < maxRetries) {
      console.log(`[fetchInitialData] Error occurred, retrying... (${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return fetchInitialData(userId, retryCount + 1);
    }

    return {
      batchInfo: null,
      userProfile: null
    };
  }
};
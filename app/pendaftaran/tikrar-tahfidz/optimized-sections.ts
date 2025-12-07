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
  // Optimized timeout for mobile
  const timeoutId = setTimeout(() => controller.abort(), isMobile() ? 8000 : 4000);

  try {
    const response = await fetch('/api/batch/default', {
      signal: controller.signal,
      cache: 'force-cache', // Aggressive caching
      headers: {
        'Cache-Control': 'max-age=300', // 5 minutes cache
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();

      // Cache with timestamp for cache invalidation
      const cacheData = {
        ...data,
        cached_at: Date.now()
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('batch_info_optimized', JSON.stringify(cacheData));
      }

      return data;
    }
  } catch (error) {
    clearTimeout(timeoutId);
    // Silent fail for better UX
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
    // Shorter cache for mobile to ensure fresh data
    const CACHE_DURATION = isMobile() ? 2 * 60 * 1000 : 5 * 60 * 1000; // 2 minutes mobile, 5 minutes desktop

    if (cacheAge < CACHE_DURATION) {
      return data;
    }
  } catch (e) {
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

// Parallel data fetcher
export const fetchInitialData = async (userId?: string) => {
  const promises: Promise<any>[] = [];

  // Always fetch batch info
  promises.push(fetchBatchInfoOptimized());

  // Only fetch user profile if userId is provided
  if (userId) {
    promises.push(fetchUserProfileOptimized(userId));
  }

  try {
    const results = await Promise.allSettled(promises);

    return {
      batchInfo: results[0].status === 'fulfilled' ? results[0].value : null,
      userProfile: results[1]?.status === 'fulfilled' ? results[1].value : null
    };
  } catch (error) {
    return {
      batchInfo: null,
      userProfile: null
    };
  }
};
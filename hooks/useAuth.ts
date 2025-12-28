'use client'

import useSWR, { useSWRConfig } from 'swr'
import { useCallback, useEffect } from 'react'
import { getFetcher } from '@/lib/swr/fetchers'
import { supabase } from '@/lib/supabase-singleton'
import { cacheConfig } from '@/lib/swr/config'
import { User } from '@/types/database'
import { useServerUserData } from '@/contexts/AuthContext'

/**
 * Authentication hook using SWR for data fetching and caching
 *
 * Features:
 * - Automatic session management
 * - Mobile-friendly token handling
 * - Optimized caching for user data
 * - Manual refresh capabilities
 * - Server data hydration to prevent flash
 */
export function useAuth() {
  // Get server-fetched user data to prevent hydration flash
  const serverUserData = useServerUserData()

  // Fetch current user data with SWR
  const { data, error, isLoading, mutate } = useSWR<User | null>(
    '/api/auth/me',
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
          if (response.status === 401) {
            return null // User not authenticated
          }
          throw new Error('Failed to fetch user')
        }

        const result = await response.json()
        return result.data || result || null
      } catch (error) {
        return null // Return null on error to handle gracefully
      }
    },
    {
      revalidateOnMount: true,
      dedupingInterval: 5000, // 5 seconds cache
      refreshInterval: 0, // Disable auto-refresh (will use Supabase listener instead)
      revalidateOnFocus: true, // Auto-refresh when user returns to tab
      revalidateOnReconnect: true, // Auto-refresh when internet reconnects
      shouldRetryOnError: false, // Don't retry on errors to prevent infinite loops
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Never retry auth errors
        if (error?.status === 401) return
        // Don't retry more than 3 times
        if (retryCount >= 3) return
      },
      // Use server data as fallback to prevent flash
      fallbackData: serverUserData || null,
    }
  )

  // Manual refresh function with session validation
  const refreshAuth = useCallback(async () => {
    try {
      // Refresh Supabase session first
      const { error: sessionError } = await supabase.auth.refreshSession()
      if (sessionError) {
        console.warn('Session refresh error:', sessionError)
      }

      // Then revalidate SWR data
      return await mutate()
    } catch (error) {
      console.error('Auth refresh failed:', error)
      throw error
    }
  }, [mutate])

  // Listen to Supabase auth state changes and auto-refresh - DEFERRED to prevent React Error #310
  useEffect(() => {
    // Set up session refresh interval (every 5 minutes)
    const refreshTimer = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { error } = await supabase.auth.refreshSession()
        if (!error) {
          console.log('Session refreshed successfully')
        }
      }
    }, 5 * 60 * 1000) // 5 minutes

    // Listen to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, 'Session exists:', !!session)

      // Defer all state updates to prevent React Error #310
      setTimeout(async () => {
        // Refresh user data on sign in or token refresh
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('Refreshing user data due to auth event:', event)
          await mutate()
        }

        // Clear data ONLY on explicit sign out
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing data')
          await mutate(null, false)
          // Redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
      }, 0)
    })

    return () => {
      clearInterval(refreshTimer)
      authListener.subscription.unsubscribe()
    }
  }, [mutate])

  // Enhanced logout function
  const logout = useCallback(async () => {
    try {
      // Clear SWR cache immediately for instant UI feedback
      mutate(null, false)

      // Call logout API and Supabase signOut in parallel (non-blocking)
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }).catch(err => console.warn('Logout API call failed:', err))

      supabase.auth.signOut().catch(err => console.warn('Supabase signOut failed:', err))

      // Redirect immediately without waiting for API responses
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
      // Still try to redirect even if logout fails
      window.location.href = '/login'
    }
  }, [mutate])

  // Check if user is authenticated
  const isAuthenticated = Boolean(data && !error)

  // Get user role safely
  const userRole = data?.role || null

  // Check if user has specific role
  const hasRole = useCallback((role: User['role']) => {
    return userRole === role
  }, [userRole])

  // Check if user has admin privileges
  const isAdmin = hasRole('admin')

  // Check if user is staff (musyrifah or muallimah)
  const isStaff = hasRole('musyrifah') || hasRole('muallimah')

  // Check if user is student (thalibah or calon_thalibah)
  const isStudent = hasRole('thalibah') || hasRole('calon_thalibah')

  return {
    // User data
    user: data,
    isLoading,
    isError: !!error,
    error,

    // Authentication states
    isAuthenticated,
    isUnauthenticated: !isAuthenticated && !isLoading,

    // Role helpers
    userRole,
    isAdmin,
    isStaff,
    isStudent,
    hasRole,

    // Actions
    refreshAuth,
    logout,
    mutate, // Direct access to SWR mutate for advanced use cases
  }
}

/**
 * Hook for authentication mutations (register, etc.)
 * Note: Login is handled client-side using Supabase Auth directly
 */
export function useAuthMutations() {
  const { mutate } = useSWRConfig()

  const register = useCallback(async (userData: any) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Registration failed')
      }

      const data = await response.json()

      // Revalidate user data after successful registration
      await mutate('/api/auth/me')

      return data
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }, [mutate])

  return {
    register,
  }
}

/**
 * Hook for session monitoring and automatic refresh
 */
export function useAuthMonitor() {
  const { refreshAuth } = useAuth()

  // Set up session monitoring
  useSWR(
    'auth-monitor', // Key for monitoring
    null, // No fetcher needed
    {
      refreshInterval: 5 * 60 * 1000, // Check every 5 minutes
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onSuccess: async () => {
        // Refresh auth data on successful monitor check
        try {
          await refreshAuth()
        } catch (error) {
          console.warn('Auth monitor refresh failed:', error)
        }
      },
    }
  )
}

/**
 * Hook for managing user profile updates
 */
export function useProfileUpdate() {
  const { mutate } = useSWRConfig()

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Profile update failed')
      }

      const data = await response.json()

      // Revalidate user data after successful update
      await mutate('/api/auth/me')

      return data
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }, [mutate])

  return {
    updateProfile,
  }
}

export default useAuth
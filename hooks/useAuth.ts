'use client'

import { useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useServerUserData } from '@/contexts/AuthContext'

/**
 * AUTH HOOK – UI STATE MANAGEMENT ONLY
 *
 * SECURITY ARCHITECTURE:
 * - This hook does NOT fetch user data from /api/auth/me
 * - User data comes from server layout (via useServerUserData)
 * - NO authorization decisions – all done server-side via RLS
 * - Session refresh is automatic via Supabase SSR
 *
 * What this hook DOES:
 * - Provide logout functionality
 * - Listen to auth state changes for UI updates
 * - Manual refresh capability
 *
 * What this hook does NOT do:
 * - Fetch user data (server layout handles this)
 * - Role-based authorization (RLS handles this)
 * - Access control decisions (server-side only)
 */
export function useAuth() {
  const supabase = createClient()

  // Get server-fetched user data (single source of truth)
  const serverUserData = useServerUserData()

  // Listen to auth state changes for UI updates only
  useEffect(() => {
    let isRedirecting = false

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log('Auth state changed:', event, 'Session exists:', !!session)

      // On sign out, redirect to login (with guard against multiple redirects)
      // This handles cases where session is invalidated server-side
      if (event === 'SIGNED_OUT' && !isRedirecting) {
        isRedirecting = true
        console.log('User signed out, redirecting to login')
        if (typeof window !== 'undefined') {
          // Use replace to avoid adding to history stack
          window.location.replace('/login')
        }
      }

      // On token refresh or sign in, server will handle on next navigation
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        console.log('Auth event:', event, '- server will handle on next navigation')
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  // Logout function
  const logout = useCallback(async () => {
    try {
      console.log('Starting logout process...')

      // Call logout API to properly clear session
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Include cookies
      })

      const result = await response.json()
      console.log('Logout API response:', result)

      // Regardless of API result, redirect to login
      // Using window.location.href for hard redirect to clear any client state
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Logout failed:', error)
      // Still try to redirect even if logout fails
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }, [])

  // Check if user is authenticated (has server data)
  const isAuthenticated = Boolean(serverUserData)

  // Get user role from server data (for UI display only, NOT for authorization)
  const userRole = serverUserData?.role || null

  return {
    // User data from server
    user: serverUserData,
    isLoading: false, // Server data is already loaded
    isAuthenticated,
    isUnauthenticated: !isAuthenticated,

    // Role (for UI display only – NOT for authorization)
    userRole,

    // Actions
    logout,
  }
}

/**
 * Hook for authentication mutations (register, etc.)
 * Note: Login is handled client-side using Supabase Auth directly
 */
export function useAuthMutations() {
  return {
    // Registration mutations can be added here if needed
  }
}

export default useAuth

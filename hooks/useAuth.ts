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
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log('Auth state changed:', event, 'Session exists:', !!session)

      // No redirect handling here - logout() function handles redirect
      // This listener is only for logging/debugging purposes

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

      // Call server API to properly clear cookies
      // Server-side signOut is required to clear HttpOnly cookies
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error('Logout API failed:', response.status)
      }

      const result = await response.json()
      console.log('Logout API response:', result)

      // Redirect to login after server has cleared cookies
      if (typeof window !== 'undefined') {
        window.location.href = result.redirect || '/login'
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

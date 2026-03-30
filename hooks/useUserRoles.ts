'use client'

import { useServerUserData } from '@/contexts/AuthContext'
import { useMemo } from 'react'

/**
 * useUserRoles Hook
 * Unified hook for consistent role checking on the client-side.
 * 
 * Usage:
 * const { hasRole, isAdmin, isThalibah } = useUserRoles();
 * if (isAdmin) { ... }
 */
export function useUserRoles() {
  const userData = useServerUserData()

  const roles = useMemo(() => {
    if (!userData) return []
    // Support both new 'roles' array and legacy 'role' string
    const rolesArray = userData.roles || []
    const legacyRole = (userData as any).role
    
    if (legacyRole && !rolesArray.includes(legacyRole)) {
      return [...rolesArray, legacyRole]
    }
    return rolesArray
  }, [userData])

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: string) => roles.includes(role)

  /**
   * Check if user has any of the given roles
   */
  const hasAnyRole = (allowedRoles: string[]) => 
    allowedRoles.some(role => roles.includes(role))

  /**
   * Check if user has all of the given roles
   */
  const hasAllRoles = (requiredRoles: string[]) => 
    requiredRoles.every(role => roles.includes(role))

  return {
    roles,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    
    // Convenience flags (Simplified to Binary Roles)
    isAdmin: hasRole('admin'),
    isThalibah: hasRole('thalibah'),
    isStaff: hasRole('admin'),
    
    // Loading/Auth state
    isLoading: false, // Context data is already server-provided
    isAuthenticated: !!userData,
  }
}

export default useUserRoles

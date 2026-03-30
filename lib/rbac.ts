/**
 * ROLE-BASED ACCESS CONTROL (RBAC) UTILITIES
 *
 * Provides consistent authorization checks across the application.
 * Use these utilities in API routes and server actions.
 */

import { createClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { getOwnerEmails } from '@/lib/env'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_RANK,
  STAFF_RANK_THRESHOLD,
  MANAGEMENT_RANK_THRESHOLD,
  getRoleRank,
  isAdmin,
  consolidateRoles,
  type UserRole
} from '@/lib/roles'
import { ApiResponses } from '@/lib/api-responses'
import { HTTP_STATUS } from '@/lib/api-wrapper'

// =====================================================
// AUTHORIZATION RESULT TYPES
// =====================================================

export interface AuthResult {
  success: boolean
  user?: {
    id: string
    email: string
    roles: string[]
    primaryRole: string
  }
  error?: string
}

export interface AuthorizationContext {
  userId: string
  email: string
  roles: string[]
  primaryRole: string
  rank: number
}

// =====================================================
// AUTHENTICATION HELPERS
// =====================================================

/**
 * Get authenticated user from session.
 * Returns null if not authenticated.
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || '',
        roles: [],
        primaryRole: ''
      }
    }
  } catch {
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Get full user authorization context including roles.
 * Uses admin client to bypass RLS for role lookups.
 * 
 * @param options - Optional configuration, including NextResponse for cookie sync
 */
  export async function getAuthorizationContext(options?: { response?: NextResponse }): Promise<AuthorizationContext | null> {
    try {
      const supabase = createClient(options)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
  
      if (authError || !user) {
        return null
      }
  
      // Use admin client to fetch user data (bypasses RLS for role lookup)
      const adminClient = createSupabaseAdmin()
  
      const { data: userData, error: dbError } = await adminClient
        .from('users')
        .select('id, email, roles')
        .eq('id', user.id)
        .maybeSingle()
  
      if (dbError) {
        console.warn('[RBAC] Database warning looking up user:', dbError)
      }

    // Consolidate roles with owner fallback
    const ownerEmails = getOwnerEmails()
    const dbRoles = userData?.roles || []

    const distinctRoles = consolidateRoles(dbRoles, user.email, ownerEmails)
    const primaryRole = distinctRoles.sort((a, b) => getRoleRank(b) - getRoleRank(a))[0]

    return {
      userId: user.id,
      email: user.email || '',
      roles: distinctRoles,
      primaryRole,
      rank: getRoleRank(primaryRole)
    }
  } catch (error: any) {
    console.error('[RBAC] Unexpected context error:', error.message || error)
    return null
  }
}

// =====================================================
// AUTHORIZATION CHECKS
// =====================================================

/**
 * Check if user has required role.
 */
export function hasRole(context: AuthorizationContext, requiredRole: UserRole): boolean {
  return context.roles.includes(requiredRole)
}

/**
 * Check if user has any of the required roles.
 */
export function hasAnyRole(context: AuthorizationContext, requiredRoles: UserRole[]): boolean {
  return requiredRoles.some(role => context.roles.includes(role))
}

/**
 * Check if user has minimum required rank.
 */
export function hasMinimumRank(context: AuthorizationContext, minRank: number): boolean {
  return context.rank >= minRank
}

/**
 * Check if user is admin (has admin role or is owner).
 */
export function isUserAdmin(context: AuthorizationContext): boolean {
  return hasRole(context, 'admin')
}

/**
 * Check if user can access admin panel (admin only in this system).
 */
export function canAccessAdminPanel(context: AuthorizationContext): boolean {
  return isUserAdmin(context)
}

// =====================================================
// API ROUTE MIDDLEWARE HELPERS
// =====================================================

/**
 * Protect API route - require authentication.
 * Returns early with unauthorized response if not authenticated.
 */
export async function requireAuth(response?: NextResponse) {
  const context = await getAuthorizationContext({ response })

  if (!context) {
    return ApiResponses.unauthorized('Authentication required')
  }

  return null // Continue to route handler
}

/**
 * Protect API route - require specific role.
 * Returns early with forbidden response if not authorized.
 */
export async function requireRole(requiredRole: UserRole, response?: NextResponse) {
  const context = await getAuthorizationContext({ response })

  if (!context) {
    return ApiResponses.unauthorized('Authentication required')
  }

  if (!hasRole(context, requiredRole)) {
    return ApiResponses.forbidden(`Requires ${requiredRole} role`)
  }

  return null // Continue to route handler
}

/**
 * Protect API route - require any of the specified roles.
 * Returns early with forbidden response if not authorized.
 */
export async function requireAnyRole(requiredRoles: UserRole[], response?: NextResponse) {
  const context = await getAuthorizationContext({ response })

  if (!context) {
    return ApiResponses.unauthorized('Authentication required')
  }

  if (!hasAnyRole(context, requiredRoles)) {
    return ApiResponses.forbidden(`Requires one of: ${requiredRoles.join(', ')}`)
  }

  return null // Continue to route handler
}

/**
 * Protect API route - require minimum rank.
 * Returns early with forbidden response if not authorized.
 */
export async function requireMinimumRank(minRank: number, response?: NextResponse) {
  const context = await getAuthorizationContext({ response })

  if (!context) {
    return ApiResponses.unauthorized('Authentication required')
  }

  if (!hasMinimumRank(context, minRank)) {
    return ApiResponses.forbidden('Insufficient permissions')
  }

  return null // Continue to route handler
}

/**
 * Protect API route - require admin access.
 * Convenience wrapper for requireRole('admin').
 */
export async function requireAdmin(response?: NextResponse) {
  return requireRole('admin', response)
}

// =====================================================
// SERVER ACTION HELPERS
// =====================================================

/**
 * Validate authorization for server actions.
 * Throws error if not authorized, used in try/catch blocks.
 */
export async function validateServerActionAuth(requiredRole?: UserRole): Promise<AuthorizationContext> {
  const context = await getAuthorizationContext()

  if (!context) {
    throw new Error('UNAUTHORIZED: Authentication required')
  }

  if (requiredRole && !hasRole(context, requiredRole)) {
    throw new Error(`FORBIDDEN: Requires ${requiredRole} role`)
  }

  return context
}

/**
 * Check if current user is admin (for server actions).
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const context = await getAuthorizationContext()
  return context ? isUserAdmin(context) : false
}

// =====================================================
// RESOURCE-BASED AUTHORIZATION
// =====================================================

/**
 * Check if user can access a specific resource.
 * Override this function to implement custom resource-based access control.
 */
export async function canAccessResource(
  context: AuthorizationContext,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  // Admin can access everything
  if (isUserAdmin(context)) {
    return true
  }

  // Default: users can only access their own resources
  // This can be overridden for specific resource types
  switch (resourceType) {
    case 'user':
      return context.userId === resourceId

    case 'profile':
      return context.userId === resourceId

    case 'registration':
      // Check if registration belongs to user
      const supabase = createClient()
      const { data } = await supabase
        .from('pendaftaran')
        .select('user_id')
        .eq('id', resourceId)
        .single()

      return data?.user_id === context.userId

    default:
      return false
  }
}

/**
 * Require access to specific resource.
 * Returns unauthorized response if access denied.
 */
export async function requireResourceAccess(
  resourceType: string,
  resourceId: string
) {
  const context = await getAuthorizationContext()

  if (!context) {
    return ApiResponses.unauthorized('Authentication required')
  }

  const hasAccess = await canAccessResource(context, resourceType, resourceId)

  if (!hasAccess) {
    return ApiResponses.forbidden('You do not have access to this resource')
  }

  return null // Continue to route handler
}

// =====================================================
// TYPE GUARDS
// =====================================================

/**
 * Type guard for authorization context.
 */
export function isAuthorizedContext(context: unknown): context is AuthorizationContext {
  return (
    typeof context === 'object' &&
    context !== null &&
    'userId' in context &&
    'email' in context &&
    'roles' in context &&
    'rank' in context
  )
}

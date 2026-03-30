/**
 * ROLE HIERARCHY & UTILITIES
 *
 * This file defines the canonical "Rank" for each role in the system.
 * Higher rank automatically implies access to lower-rank features.
 *
 * Role System (5 tiers as per arsitektur.md):
 * - admin (100): Full system access
 * - musyrifah (80): Discipline monitoring, SP management
 * - muallimah (60): Teaching, assessment, tashih records
 * - thalibah (40): Active students
 * - calon_thalibah (20): Prospective students in registration
 */

export const ROLE_RANKS: Record<string, number> = {
  'admin': 100,
  'musyrifah': 80,
  'muallimah': 60,
  'thalibah': 40,
  'calon_thalibah': 20,
};

export type UserRole = 'admin' | 'musyrifah' | 'muallimah' | 'thalibah' | 'calon_thalibah';

export const ADMIN_RANK = ROLE_RANKS.admin;
export const STAFF_RANK_THRESHOLD = 60; // Threshold for staff/admin features (muallimah and above)
export const MANAGEMENT_RANK_THRESHOLD = 80; // Threshold for management features (musyrifah and above)

/**
 * Get the numerical rank of a role string.
 */
export function getRoleRank(role: string | null | undefined): number {
  if (!role) return 0;
  return ROLE_RANKS[role.toLowerCase()] || 0;
}

/**
 * Identify if a role name is a valid system role.
 */
export function isValidRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return role.toLowerCase() in ROLE_RANKS;
}

/**
 * Normalize role string to lowercase and trim whitespace.
 */
export function normalizeRole(role: string | null | undefined): string | null {
  if (!role) return null;
  const normalized = role.toString().toLowerCase().trim();
  return isValidRole(normalized) ? normalized : null;
}

/**
 * Extract and normalize all valid roles from user data.
 * Handles both array and single role formats.
 */
export function extractRoles(roleData: string | string[] | null | undefined): string[] {
  if (!roleData) return [];

  const rawRoles = Array.isArray(roleData) ? roleData : [roleData];
  const normalizedRoles = rawRoles
    .map(normalizeRole)
    .filter((r): r is string => r !== null);

  return Array.from(new Set(normalizedRoles));
}

/**
 * Identify the single "Primary Role" from a list of roles based on the highest rank.
 * Defaults to 'calon_thalibah' (lowest tier) if no valid roles found.
 */
export function getPrimaryRole(roles: string[] | null | undefined): string {
  if (!roles || roles.length === 0) return 'calon_thalibah';

  const roleArray = Array.isArray(roles) ? roles : [roles];
  const validRoles = roleArray.filter(isValidRole);

  if (validRoles.length === 0) return 'calon_thalibah';

  return [...validRoles].sort((a, b) => getRoleRank(b) - getRoleRank(a))[0];
}

/**
 * Check if a user's role meets a minimum rank requirement.
 */
export function hasRequiredRank(userRole: string | string[], minRank: number): boolean {
  const roles = Array.isArray(userRole) ? userRole : [userRole];
  const maxRank = Math.max(...roles.map(getRoleRank));
  return maxRank >= minRank;
}

/**
 * Check if the user is considered "Staff" (Muallimah and above).
 */
export function isStaff(userRole: string | string[]): boolean {
  return hasRequiredRank(userRole, STAFF_RANK_THRESHOLD);
}

/**
 * Check if the user is considered "Management" (Musyrifah and above).
 */
export function isManagement(userRole: string | string[]): boolean {
  return hasRequiredRank(userRole, MANAGEMENT_RANK_THRESHOLD);
}

/**
 * Check if user has admin role (either from database or owner email).
 * @param userEmail - User's email address
 * @param userRoles - Array of roles from database
 * @param ownerEmails - Array of owner emails from environment
 */
export function isAdmin(
  userEmail: string | null | undefined,
  userRoles: string[],
  ownerEmails: string[] = []
): boolean {
  // Check database roles
  if (userRoles.includes('admin')) return true;

  // Check owner email fallback
  if (userEmail && ownerEmails.length > 0) {
    const normalizedEmail = userEmail.toLowerCase().trim();
    return ownerEmails.includes(normalizedEmail);
  }

  return false;
}

/**
 * Consolidate user roles with owner fallback.
 * Returns a clean array of valid roles with admin added if owner.
 */
export function consolidateRoles(
  databaseRoles: string[],
  userEmail: string | null | undefined,
  ownerEmails: string[] = []
): string[] {
  const roles = new Set(extractRoles(databaseRoles));

  // Add admin role if user is an owner
  if (userEmail && ownerEmails.length > 0) {
    const normalizedEmail = userEmail.toLowerCase().trim();
    if (ownerEmails.includes(normalizedEmail)) {
      roles.add('admin');
    }
  }

  // Default to calon_thalibah if no roles (lowest tier)
  if (roles.size === 0) {
    roles.add('calon_thalibah');
  }

  return Array.from(roles);
}

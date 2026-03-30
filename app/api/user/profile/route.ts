import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger-secure';
import { getAuthorizationContext } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';
import { hasRequiredRank, ROLE_RANKS } from '@/lib/roles';

/**
 * GET /api/user/profile
 * 
 * Fetches the authenticated user's profile data.
 * SECURITY: Only allows users to access their own profile.
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthorizationContext();
    if (!context) return ApiResponses.unauthorized();

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    // SECURITY: Users can only access their own profile.
    // If requestedUserId is provided, it must match the authenticated userId 
    // unless the requester is an admin (future enhancement).
    if (requestedUserId && requestedUserId !== context.userId && !context.roles?.includes('admin')) {
      logger.warn('[Profile API] Forbidden access attempt', {
        authenticatedUserId: context.userId,
        requestedUserId: requestedUserId
      });
      return ApiResponses.forbidden('Anda hanya diperbolehkan mengakses profil Anda sendiri.');
    }

    const userId = context.userId;
    const supabase = createServerClient();

    const { data: profile, error } = await supabase
      .from('users')
      .select(`
        id, 
        full_name, 
        email, 
        whatsapp, 
        telegram, 
        alamat, 
        zona_waktu, 
        tanggal_lahir, 
        kota, 
        tempat_lahir, 
        negara, 
        provinsi, 
        nama_kunyah, 
        jenis_kelamin, 
        pekerjaan, 
        alasan_daftar, 
        roles,
        is_blacklisted,
        is_active
      `)
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      logger.error('[Profile API] Database error:', error);
      return ApiResponses.databaseError(error);
    }

    if (!profile) return ApiResponses.notFound('Profil tidak ditemukan');

    // Age calculation
    let age = 0;
    if (profile.tanggal_lahir) {
      const birthDate = new Date(profile.tanggal_lahir);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    const userProfile = {
      ...profile,
      age: age.toString(),
      primaryRole: hasRequiredRank(profile.roles || [], ROLE_RANKS.admin) ? 'admin' : 'thalibah'
    };

    return ApiResponses.success(userProfile, undefined, 200, {
      'Cache-Control': 'private, max-age=60'
    });

  } catch (error) {
    logger.error('[Profile API] Unexpected error:', error);
    return ApiResponses.handleUnknown(error);
  }
}
import { createClient } from '@/lib/supabase/server';
import { getAuthorizationContext } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';

/**
 * GET /api/pendaftaran/all
 *
 * API for perjalanan-saya page - shows thalibah registrations from OPEN batches
 * Only queries pendaftaran_tikrar_tahfidz (thalibah registrations)
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthorizationContext();
    if (!context) return ApiResponses.unauthorized();

    const supabase = createClient();

    // Get tikrar registrations with daftar ulang data embedded
    const { data: tikrarRegistrations, error: tikrarError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        *,
        batch:batches(*),
        program:programs(*),
        daftar_ulang:daftar_ulang_submissions(
          id,
          user_id,
          batch_id,
          registration_id,
          confirmed_full_name,
          confirmed_chosen_juz,
          confirmed_main_time_slot,
          confirmed_backup_time_slot,
          status,
          created_at,
          submitted_at,
          reviewed_at,
          akad_files,
          ujian_halaqah_id,
          tashih_halaqah_id,
          ujian_halaqah:halaqah!daftar_ulang_submissions_ujian_halaqah_id_fkey(
            id,
            name,
            day_of_week,
            start_time,
            end_time,
            location
          ),
          tashih_halaqah:halaqah!daftar_ulang_submissions_tashih_halaqah_id_fkey(
            id,
            name,
            day_of_week,
            start_time,
            end_time,
            location
          )
        )
      `)
      .eq('user_id', context.userId)
      .order('created_at', { ascending: false });

    if (tikrarError) {
      console.error('[Pendaftaran All API] Database error:', tikrarError);
      return ApiResponses.databaseError(tikrarError);
    }

    // Process registrations and embed daftar ulang data
    const allRegistrations = (tikrarRegistrations || [])
      .filter((reg: any) => reg.batch?.status === 'open') // Only from OPEN batches
      .map((reg: any) => {
        // Get daftar ulang submission for this batch
        const daftarUlang = reg.daftar_ulang && Array.isArray(reg.daftar_ulang)
          ? reg.daftar_ulang.find((du: any) => du.batch_id === reg.batch_id)
          : null;

        return {
          ...reg,
          registration_type: 'thalibah',
          role: 'thalibah',
          status: reg.status || 'pending',
          batch_name: reg.batch?.name || null,
          daftar_ulang: daftarUlang || null,
          // For backwards compatibility
          re_enrollment_completed: daftarUlang?.status === 'approved' ? true : reg.re_enrollment_completed
        };
      });

    // Sort by created_at descending
    allRegistrations.sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return ApiResponses.success(allRegistrations);
  } catch (error) {
    console.error('[Pendaftaran All API] Unexpected error:', error);
    return ApiResponses.handleUnknown(error);
  }
}

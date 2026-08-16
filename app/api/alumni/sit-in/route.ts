import { createSupabaseAdmin } from '@/lib/supabase';
import { getAuthorizationContext, requireAuth } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';
import { generalApiRateLimit } from '@/lib/rate-limiter';
import { getClientIp, getUserAgent, logAudit } from '@/lib/audit-log';

const supabaseAdmin = createSupabaseAdmin();

export async function POST(request: Request) {
  try {
    // 1. Authorization check
    const authError = await requireAuth();
    if (authError) return authError;

    const context = await getAuthorizationContext();
    if (!context) return ApiResponses.unauthorized();

    // 2. Rate limit
    if (generalApiRateLimit) {
      const { success } = await generalApiRateLimit.limit(`alumni:sit-in:${context.userId}`);
      if (!success) return ApiResponses.rateLimit('Terlalu banyak permintaan. Coba lagi nanti.');
    }

    const body = await request.json();
    const { halaqah_id } = body;

    if (!halaqah_id) {
      return ApiResponses.badRequest('ID Halaqah diperlukan.');
    }

    // 3. Verify target halaqah quota and get Zoom details
    const { data: targetHalaqah } = await supabaseAdmin
      .from('halaqah')
      .select(`
        id, name, max_students, zoom_link, zoom_link_id,
        students:halaqah_students(id, status),
        zoom:batch_zoom_links!halaqah_zoom_link_id_fkey(name, url, meeting_id, passcode)
      `)
      .eq('id', halaqah_id)
      .single();

    if (!targetHalaqah) {
      return ApiResponses.notFound('Halaqah tidak ditemukan.');
    }

    const activeCount = targetHalaqah.students?.filter((s: any) => s.status === 'active').length || 0;
    if (activeCount >= (targetHalaqah.max_students || 999)) {
      return ApiResponses.badRequest('Halaqah tujuan sudah penuh.');
    }

    // 4. Extract Zoom Info
    const zoomData: any = Array.isArray(targetHalaqah.zoom) ? targetHalaqah.zoom[0] : targetHalaqah.zoom;
    
    let zoomInfo = {
      url: zoomData?.url || targetHalaqah.zoom_link || '',
      meeting_id: zoomData?.meeting_id || '',
      passcode: zoomData?.passcode || '',
      name: zoomData?.name || ''
    };

    if (!zoomInfo.url) {
      // Sometimes it's just in location if older data
      const { data: locHalaqah } = await supabaseAdmin
        .from('halaqah')
        .select('location')
        .eq('id', halaqah_id)
        .single();
        
      if (locHalaqah?.location && (locHalaqah.location.includes('http') || locHalaqah.location.includes('zoom'))) {
        zoomInfo.url = locHalaqah.location;
      } else {
        return ApiResponses.badRequest('Link Zoom belum diset untuk kelas ini.');
      }
    }

    // 5. Audit Log (as a simple way to track sit-ins without creating a new table)
    await logAudit({
      userId: context.userId,
      action: 'UPDATE',
      resource: 'halaqah',
      details: { action_type: 'SIT_IN', halaqah_id, halaqah_name: targetHalaqah.name },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

    return ApiResponses.success({ 
      message: 'Berhasil mendaftar sit-in',
      zoom: zoomInfo
    });
  } catch (error) {
    console.error('[Sit-In API] Error:', error);
    return ApiResponses.handleUnknown(error);
  }
}

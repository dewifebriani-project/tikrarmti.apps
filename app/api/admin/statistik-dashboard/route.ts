import { createClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin, getAuthorizationContext } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: Request) {
  try {
    // 1. Authorization check
    const authError = await requireAdmin();
    if (authError) return authError;

    const context = await getAuthorizationContext();
    if (!context) return ApiResponses.unauthorized('Unable to get authorization context');

    // 2. Fetch basic counts
    const counts = {
      totalBatches: 0,
      totalHalaqah: 0,
      totalUsers: 0,
      totalThalibah: 0,
      totalMuallimah: 0,
    };

    // Get basic counts via count queries
    const [{ count: batchCount }, { count: halaqahCount }, { count: usersCount }] = await Promise.all([
      supabaseAdmin.from('batches').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('halaqah').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true })
    ]);

    counts.totalBatches = batchCount || 0;
    counts.totalHalaqah = halaqahCount || 0;
    counts.totalUsers = usersCount || 0;

    // 3. Fetch specific roles count
    // The roles might be stored in 'roles' array or 'role' column. 
    // We'll fetch all users with roles to build the distribution.
    const { data: usersRoles } = await supabaseAdmin.from('users').select('id, roles, role');
    
    let thalibahCount = 0;
    let muallimahCount = 0;
    let musyrifahCount = 0;
    let adminCount = 0;
    
    if (usersRoles) {
      usersRoles.forEach((u: any) => {
        const userRoles = u.roles || [];
        const primaryRole = u.role || '';
        
        if (userRoles.includes('thalibah') || primaryRole === 'thalibah' || primaryRole === 'calon_thalibah') thalibahCount++;
        if (userRoles.includes('muallimah') || primaryRole === 'muallimah') muallimahCount++;
        if (userRoles.includes('musyrifah') || primaryRole === 'musyrifah') musyrifahCount++;
        if (userRoles.includes('admin') || primaryRole === 'admin' || primaryRole === 'super_admin') adminCount++;
      });
    }

    counts.totalThalibah = thalibahCount;
    counts.totalMuallimah = muallimahCount;

    // 4. Fetch Registration Trend (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: pendaftarans } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('created_at, status')
      .gte('created_at', thirtyDaysAgoStr);

    const trendMap: Record<string, number> = {};
    // Initialize last 30 days with 0
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      trendMap[dateStr] = 0;
    }

    if (pendaftarans) {
      pendaftarans.forEach((p: any) => {
        const dateStr = p.created_at.split('T')[0];
        if (trendMap[dateStr] !== undefined) {
          trendMap[dateStr]++;
        }
      });
    }

    const registrationTrend = Object.keys(trendMap).sort().map(date => ({
      date,
      count: trendMap[date]
    }));

    // 5. Fetch Halaqah Status
    const { data: halaqahData } = await supabaseAdmin
      .from('halaqah')
      .select('id, max_students, available_slots');

    let fullHalaqah = 0;
    let availableHalaqah = 0;

    if (halaqahData) {
      halaqahData.forEach((h: any) => {
        if (h.available_slots === 0) {
          fullHalaqah++;
        } else {
          availableHalaqah++;
        }
      });
    }

    // 6. Fetch Pending Approvals
    const [{ count: pendingRegCount }, { count: pendingDaftarUlangCount }, { count: pendingTransferCount }, { count: pendingMuallimahCount }, { count: pendingOralCount }] = await Promise.all([
      supabaseAdmin.from('pendaftaran_tikrar_tahfidz').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('daftar_ulang_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('transfer_schedule_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('muallimah_akads').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('pendaftaran_tikrar_tahfidz').select('*', { count: 'exact', head: true }).eq('oral_assessment_status', 'pending')
    ]);

    return ApiResponses.success({
      counts,
      rolesDistribution: {
        thalibah: thalibahCount,
        muallimah: muallimahCount,
        musyrifah: musyrifahCount,
        admin: adminCount,
      },
      registrationTrend,
      halaqahStatus: {
        full: fullHalaqah,
        available: availableHalaqah
      },
      pendingApprovals: {
        registrations: pendingRegCount || 0,
        daftarUlang: pendingDaftarUlangCount || 0,
        transfer: pendingTransferCount || 0,
        muallimah: pendingMuallimahCount || 0,
        oralAssessment: pendingOralCount || 0
      }
    });

  } catch (error) {
    console.error('[Admin Statistik API] Unexpected error:', error);
    return ApiResponses.handleUnknown(error);
  }
}

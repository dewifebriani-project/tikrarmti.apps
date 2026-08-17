import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
import { requireAuth } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';

export async function GET(request: Request) {
  // Helper to parse blocks
  const parseBlokField = (blok: any): string[] => {
    if (!blok) return [];
    if (typeof blok === 'string') {
      if (blok.startsWith('[')) {
        try {
          const parsed = JSON.parse(blok);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
      return blok.split(',').map(b => b.trim()).filter(b => b);
    }
    if (Array.isArray(blok)) {
      return blok;
    }
    return [];
  };

  try {
    // 1. Authorization check (Any logged in user can view)
    const authError = await requireAuth();
    if (authError) return authError;

    const supabase = createClient();
    const url = new URL(request.url);
    const batchId = url.searchParams.get('batch_id');

    // 2. Get active batch
    let activeBatch;
    let batchError;

    if (batchId) {
      const { data, error } = await supabase
        .from('batches')
        .select('id, start_date, end_date')
        .eq('id', batchId)
        .single();
      activeBatch = data;
      batchError = error;
    } else {
      const { data, error } = await supabase
        .from('batches')
        .select('id, start_date, end_date')
        .in('status', ['ongoing', 'open'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      activeBatch = data;
      batchError = error;
    }

    if (batchError || !activeBatch) {
      return ApiResponses.notFound('Tidak ada angkatan (batch) yang aktif.');
    }

    // 3. Get all programs in active batch
    const { data: programs } = await supabaseAdmin
      .from('programs')
      .select('id')
      .eq('batch_id', activeBatch.id);

    const programIds = programs?.map(p => p.id) || [];
    if (programIds.length === 0) {
      return ApiResponses.success(null, 'No programs found');
    }

    // 4. Get halaqahs, muallimah and students
    const { data: halaqahs, error: halaqahError } = await supabaseAdmin
      .from('halaqah')
      .select(`
        id, 
        name, 
        muallimah:users!halaqah_muallimah_id_fkey(full_name, nama_kunyah),
        students:halaqah_students(
          status, 
          thalibah_id
        )
      `)
      .in('program_id', programIds)
      .eq('status', 'active');

    if (halaqahError) {
      return ApiResponses.databaseError(halaqahError);
    }

    const halaqahIds = halaqahs?.map(h => h.id) || [];
    if (halaqahIds.length === 0) {
      return ApiResponses.success(null, 'No halaqah found');
    }

    // Filter only Tikrar halaqahs (excluding Pra Tikrar)
    const tikrarHalaqahs = halaqahs.filter(h => 
      h.name.toLowerCase().includes('tikrar') && !h.name.toLowerCase().includes('pra')
    );

    if (tikrarHalaqahs.length === 0) {
      return ApiResponses.success(null, 'No tikrar halaqah found');
    }

    // Extract thalibahIds
    const thalibahIds = tikrarHalaqahs.flatMap(h => 
      h.students?.filter((s: any) => s.status === 'active')?.map((s: any) => s.thalibah_id) || []
    ) || [];

    const currentWeek = activeBatch.start_date
      ? Math.ceil((Date.now() - new Date(activeBatch.start_date + "T00:00:00+07:00").getTime()) / (7 * 24 * 60 * 60 * 1000))
      : 1;
    
    // Target pekan lalu (jika masih pekan 1, gunakan pekan 1)
    const targetWeek = Math.max(1, currentWeek - 1);
    
    let weekStartDate = new Date(0);
    let weekEndDate = new Date();
    
    if (activeBatch.start_date) {
      weekStartDate = new Date(activeBatch.start_date + "T00:00:00+07:00");
      weekStartDate.setDate(weekStartDate.getDate() + (targetWeek - 1) * 7);
      
      weekEndDate = new Date(activeBatch.start_date + "T00:00:00+07:00");
      weekEndDate.setDate(weekEndDate.getDate() + targetWeek * 7);
    }

    // 7. Ambil data presensi (Jurnal) pekan lalu untuk santri Tikrar (bypass RLS)
    let jurnalRecords: any[] = [];
    if (thalibahIds.length > 0) {
      let jurnalQuery = supabaseAdmin
        .from('jurnal_records')
        .select('user_id, blok')
        .in('user_id', thalibahIds);
        
      if (activeBatch.start_date) {
        jurnalQuery = jurnalQuery.gte('created_at', weekStartDate.toISOString()).lt('created_at', weekEndDate.toISOString());
      }
      const { data } = await jurnalQuery;
      jurnalRecords = data || [];
    }

    // 8. Ambil data Tashih pekan lalu untuk santri Tikrar (bypass RLS)
    let tashihRecords: any[] = [];
    if (thalibahIds.length > 0) {
      let tashihQuery = supabaseAdmin
        .from('tashih_records')
        .select('user_id, blok')
        .in('user_id', thalibahIds);

      if (activeBatch.start_date) {
        tashihQuery = tashihQuery.gte('created_at', weekStartDate.toISOString()).lt('created_at', weekEndDate.toISOString());
      }
      const { data } = await tashihQuery;
      tashihRecords = data || [];
    }

    // 9. Aggregate data
    const jurnalCountMap = new Map();
    jurnalRecords?.forEach(r => {
      const bloks = parseBlokField(r.blok);
      const count = bloks.length > 0 ? bloks.length : 1;
      jurnalCountMap.set(r.user_id, (jurnalCountMap.get(r.user_id) || 0) + count);
    });

    const tashihCountMap = new Map();
    tashihRecords?.forEach(r => {
      const bloks = parseBlokField(r.blok);
      const count = bloks.length > 0 ? bloks.length : 1;
      tashihCountMap.set(r.user_id, (tashihCountMap.get(r.user_id) || 0) + count);
    });

    const targetBlocks = 4; // Target blocks for a single week is always 4

    const result = tikrarHalaqahs.map(h => {
      const activeStudents = h.students?.filter((s: any) => s.status === 'active') || [];
      const halaqahStudentsStats = activeStudents.map((s: any) => {
        const jCount = jurnalCountMap.get(s.thalibah_id) || 0;
        const tCount = tashihCountMap.get(s.thalibah_id) || 0;
        const jurnal_percentage = Math.min(100, Math.round((jCount / targetBlocks) * 100));
        const tashih_percentage = Math.min(100, Math.round((tCount / targetBlocks) * 100));
        return {
          progress: Math.round((jurnal_percentage + tashih_percentage) / 2),
          hasTashih: tCount > 0,
          hasJurnal: jCount > 0
        };
      });

      const avg_progress = halaqahStudentsStats.length > 0 
        ? Math.round(halaqahStudentsStats.reduce((acc: number, curr: any) => acc + curr.progress, 0) / halaqahStudentsStats.length)
        : 0;
        
      const perfect_thalibah = halaqahStudentsStats.filter((stat: any) => stat.progress === 100).length;
      const active_tashih = halaqahStudentsStats.filter((stat: any) => stat.hasTashih).length;
      const active_jurnal = halaqahStudentsStats.filter((stat: any) => stat.hasJurnal).length;
      const total_interactions = active_tashih + active_jurnal;

      return {
        id: h.id,
        name: h.name,
        muallimah_name: (() => {
          const m = Array.isArray(h.muallimah) ? h.muallimah[0] : (h.muallimah as any);
          if (!m) return 'Tanpa Muallimah';
          return m.nama_kunyah || m.full_name || 'Tanpa Muallimah';
        })(),
        total_thalibah: halaqahStudentsStats.length,
        avg_progress,
        perfect_thalibah,
        active_tashih,
        active_jurnal,
        total_interactions
      };
    });

    // Sort by perfect_thalibah desc, total_interactions desc, avg_progress desc, then total_thalibah desc
    result.sort((a, b) => {
      if (b.perfect_thalibah !== a.perfect_thalibah) return b.perfect_thalibah - a.perfect_thalibah;
      if (b.total_interactions !== a.total_interactions) return b.total_interactions - a.total_interactions;
      if (b.avg_progress !== a.avg_progress) return b.avg_progress - a.avg_progress;
      return b.total_thalibah - a.total_thalibah;
    });

    const topHalaqah: any = result.length > 0 && (result[0].total_interactions > 0 || result[0].avg_progress > 0) ? result[0] : null;

    if (topHalaqah && activeBatch.start_date) {
      // weekEndDate is currently set to the NEXT Monday 00:00:00.
      // We subtract 1 millisecond to get Sunday 23:59:59.
      const inclusiveEndDate = new Date(weekEndDate.getTime() - 1);
      
      const formatOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
      const startStr = weekStartDate.toLocaleDateString('id-ID', formatOptions);
      const endStr = inclusiveEndDate.toLocaleDateString('id-ID', formatOptions);
      
      topHalaqah.evaluation_period = `${startStr} - ${endStr}`;
      topHalaqah.target_week = targetWeek;
    }

    return ApiResponses.success(topHalaqah, 'Halaqah of the week retrieved successfully');
  } catch (error) {
    console.error('[Halaqah of the week API] Unexpected error:', error);
    return ApiResponses.serverError('Terjadi kesalahan internal server.');
  }
}

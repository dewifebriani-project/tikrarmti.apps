import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
import { requireAuth, getAuthorizationContext } from '@/lib/rbac';
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
    // 1. Authorization check
    const authContext = await getAuthorizationContext();
    if (!authContext) {
      return ApiResponses.unauthorized('Not authenticated');
    }
    const isOnlyThalibah = authContext.roles.includes('thalibah') && !authContext.roles.includes('admin') && !authContext.roles.includes('musyrifah');

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
          thalibah_id,
          user:users!halaqah_students_thalibah_id_fkey(full_name)
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
    
    // Target jurnal selalu mundur 1 pekan dari targetWeek
    const jurnalTargetWeek = Math.max(0, targetWeek - 1);
    
    let weekStartDate = new Date(0);
    let weekEndDate = new Date();
    
    if (activeBatch.start_date) {
      weekStartDate = new Date(activeBatch.start_date + "T00:00:00+07:00");
      weekStartDate.setDate(weekStartDate.getDate() + (targetWeek - 1) * 7);
      
      weekEndDate = new Date(activeBatch.start_date + "T00:00:00+07:00");
      weekEndDate.setDate(weekEndDate.getDate() + targetWeek * 7);
    }

    // 6. Fetch base week offset from user's chosen juz (A -> start at 1, B -> start at 11)
    const { data: daftarUlangData } = await supabaseAdmin
      .from('daftar_ulang_submissions')
      .select('user_id, confirmed_chosen_juz')
      .eq('batch_id', activeBatch.id)
      .in('user_id', thalibahIds);
      
    // Handle error if pendaftaran_tikrar doesn't exist or is empty (ignore gracefully)
    const { data: pendaftaranData } = await supabaseAdmin
      .from('pendaftaran_tikrar')
      .select('user_id, confirmed_chosen_juz')
      .eq('batch_id', activeBatch.id)
      .in('user_id', thalibahIds);
      
    const userJuzBaseMap = new Map<string, number>();
    const allRegistrations = [...(daftarUlangData || []), ...(pendaftaranData || [])];
    
    allRegistrations.forEach(reg => {
      if (reg.confirmed_chosen_juz && reg.confirmed_chosen_juz.endsWith('B')) {
        userJuzBaseMap.set(reg.user_id, 11);
      } else {
        userJuzBaseMap.set(reg.user_id, 1);
      }
    });

    // 7. Ambil data presensi (Jurnal) pekan lalu untuk santri Tikrar (bypass RLS)
    let jurnalRecords: any[] = [];
    if (thalibahIds.length > 0) {
      let jurnalQuery = supabaseAdmin
        .from('jurnal_records')
        .select('user_id, blok, created_at, tafsir_options')
        .in('user_id', thalibahIds);
        
      if (activeBatch.start_date) {
        const batchStartDate = new Date(activeBatch.start_date + "T00:00:00+07:00");
        jurnalQuery = jurnalQuery.gte('created_at', batchStartDate.toISOString()).lt('created_at', weekEndDate.toISOString());
      }
      const { data } = await jurnalQuery;
      jurnalRecords = data || [];
    }

    // 8. Ambil data Tashih pekan lalu untuk santri Tikrar (bypass RLS)
    let tashihRecords: any[] = [];
    if (thalibahIds.length > 0) {
      let tashihQuery = supabaseAdmin
        .from('tashih_records')
        .select('user_id, blok, created_at')
        .in('user_id', thalibahIds);

      if (activeBatch.start_date) {
        const batchStartDate = new Date(activeBatch.start_date + "T00:00:00+07:00");
        tashihQuery = tashihQuery.gte('created_at', batchStartDate.toISOString()).lt('created_at', weekEndDate.toISOString());
      }
      const { data } = await tashihQuery;
      tashihRecords = data || [];
    }

    // 9. Aggregate data
    const jurnalCountMap = new Map();
    const userPunctualityMap = new Map<string, number[]>();
    
    const getBlockWeek = (b: string): number => {
      const match = b.match(/\d+/);
      return match ? parseInt(match[0], 10) : -1;
    };

    const isValidTikrarBlock = (b: string): boolean => {
      const upperB = b.trim().toUpperCase();
      return upperB.endsWith('A') || upperB.endsWith('B') || upperB.endsWith('C') || upperB.endsWith('D');
    };

    const calculatePunctuality = (bloks: string[], createdAt: string) => {
      let punctualitySum = 0;
      if (!createdAt) return 0;
      const submitTime = new Date(createdAt).getTime();
      const diffTime = submitTime - weekStartDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      bloks.forEach(b => {
        let expected = -1;
        const upperB = b.trim().toUpperCase();
        if (upperB.endsWith('A')) expected = 0;
        else if (upperB.endsWith('B')) expected = 1;
        else if (upperB.endsWith('C')) expected = 2;
        else if (upperB.endsWith('D')) expected = 3;
        
        if (expected !== -1) {
          // Lateness is positive if late, 0 if on time or early (no bonus for early)
          const lateness = Math.max(0, diffDays - expected);
          punctualitySum += (10 - lateness);
        }
      });
      return punctualitySum;
    };
    
    const userJurnalBlocksMap = new Map<string, Set<string>>();
    jurnalRecords?.forEach(r => {
      const bloks = parseBlokField(r.blok);
      if (bloks.length === 0) {
        jurnalCountMap.set(r.user_id, (jurnalCountMap.get(r.user_id) || 0) + 1);
        return;
      }
      
      let newBlocksForUser: string[] = [];
      const userSet = userJurnalBlocksMap.get(r.user_id) || new Set<string>();
      
      bloks.forEach(b => {
        const baseWeek = userJuzBaseMap.get(r.user_id) || 1;
        const expectedJurnalWeek = baseWeek + jurnalTargetWeek - 1;
        
        if (isValidTikrarBlock(b) && getBlockWeek(b) === expectedJurnalWeek && !userSet.has(b)) {
          userSet.add(b);
          newBlocksForUser.push(b);
        }
      });
      userJurnalBlocksMap.set(r.user_id, userSet);
      
      if (newBlocksForUser.length > 0) {
        jurnalCountMap.set(r.user_id, (jurnalCountMap.get(r.user_id) || 0) + newBlocksForUser.length);
        let punctuality = calculatePunctuality(newBlocksForUser, r.created_at);
        
        // Add optional points
        if (r.tafsir_options && Array.isArray(r.tafsir_options)) {
          // Up to 5 points per block (1 point per option)
          const optionalPointsPerBlock = Math.min(5, r.tafsir_options.length);
          punctuality += (optionalPointsPerBlock * newBlocksForUser.length);
        }

        const currentPunc = userPunctualityMap.get(r.user_id) || [];
        currentPunc.push(punctuality);
        userPunctualityMap.set(r.user_id, currentPunc);
      }
    });

    const tashihCountMap = new Map();
    const userTashihBlocksMap = new Map<string, Set<string>>();
    tashihRecords?.forEach(r => {
      const bloks = parseBlokField(r.blok);
      if (bloks.length === 0) {
        tashihCountMap.set(r.user_id, (tashihCountMap.get(r.user_id) || 0) + 1);
        return;
      }

      let newBlocksForUser: string[] = [];
      const userSet = userTashihBlocksMap.get(r.user_id) || new Set<string>();
      
      bloks.forEach(b => {
        const baseWeek = userJuzBaseMap.get(r.user_id) || 1;
        const expectedTashihWeek = baseWeek + targetWeek - 1;
        
        if (isValidTikrarBlock(b) && getBlockWeek(b) === expectedTashihWeek && !userSet.has(b)) {
          userSet.add(b);
          newBlocksForUser.push(b);
        }
      });
      userTashihBlocksMap.set(r.user_id, userSet);
      
      if (newBlocksForUser.length > 0) {
        tashihCountMap.set(r.user_id, (tashihCountMap.get(r.user_id) || 0) + newBlocksForUser.length);
        const punctuality = calculatePunctuality(newBlocksForUser, r.created_at);
        const currentPunc = userPunctualityMap.get(r.user_id) || [];
        currentPunc.push(punctuality);
        userPunctualityMap.set(r.user_id, currentPunc);
      }
    });

    const targetBlocks = 4; // Target blocks for a single week is always 4

    const allStudentsScores: { id: string, score: number }[] = [];

    const result = tikrarHalaqahs.map(h => {
      const activeStudents = h.students?.filter((s: any) => s.status === 'active') || [];
      const halaqahStudentsStats = activeStudents.map((s: any) => {
        const jCount = jurnalCountMap.get(s.thalibah_id) || 0;
        const tCount = tashihCountMap.get(s.thalibah_id) || 0;
        const jurnal_percentage = Math.min(100, Math.round((jCount / targetBlocks) * 100));
        const tashih_percentage = Math.min(100, Math.round((tCount / targetBlocks) * 100));
        let progress = 0;
        if (jurnalTargetWeek > 0) {
          progress = Math.round((jurnal_percentage + tashih_percentage) / 2);
        } else {
          progress = tashih_percentage;
        }
        return {
          progress,
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
      
      let halaqahPunctualityScore = 0;
      let studentsBreakdown: any[] = [];
      
      activeStudents.forEach((s: any) => {
         const jCount = jurnalCountMap.get(s.thalibah_id) || 0;
         const tCount = tashihCountMap.get(s.thalibah_id) || 0;
         const jurnal_percentage = Math.min(100, Math.round((jCount / targetBlocks) * 100));
         const tashih_percentage = Math.min(100, Math.round((tCount / targetBlocks) * 100));
         let progress = 0;
         if (jurnalTargetWeek > 0) {
           progress = Math.round((jurnal_percentage + tashih_percentage) / 2);
         } else {
           progress = tashih_percentage;
         }
         
         let studentPuncScore = 0;
         const puncArray = userPunctualityMap.get(s.thalibah_id) || [];
         puncArray.forEach(p => {
           studentPuncScore += p;
         });
         
         // Pastikan score tidak lebih dari 100 dan tidak kurang dari 0
         studentPuncScore = Math.max(0, Math.min(100, studentPuncScore));
         
         halaqahPunctualityScore += studentPuncScore;
         
         allStudentsScores.push({ id: s.thalibah_id, score: studentPuncScore });
         
         studentsBreakdown.push({
           id: s.thalibah_id,
           name: s.user?.full_name || 'Santri',
           progress,
           jurnal: jCount,
           tashih: tCount,
           punctualityScore: studentPuncScore
         });
      });
      const on_time_score = activeStudents.length > 0 ? Math.round(halaqahPunctualityScore / activeStudents.length) : 0;

      // Apply RBAC filtering for Thalibah
      if (isOnlyThalibah) {
        studentsBreakdown = studentsBreakdown.filter(s => s.id === authContext.userId);
      }
      
      // Sort breakdown by punctuality score desc
      studentsBreakdown.sort((a, b) => b.punctualityScore - a.punctualityScore);

      return {
        id: h.id,
        name: h.name,
        muallimah_name: (() => {
          const m = Array.isArray(h.muallimah) ? h.muallimah[0] : (h.muallimah as any);
          if (!m) return 'Tanpa Muallimah';
          return m.nama_kunyah || m.full_name || 'Tanpa Muallimah';
        })(),
        total_thalibah: activeStudents.length,
        perfect_thalibah,
        avg_progress,
        active_tashih,
        active_jurnal,
        total_interactions,
        on_time_score,
        students: studentsBreakdown
      };
    });

    // Sort by on_time_score desc, perfect_thalibah desc, total_interactions desc, avg_progress desc, then total_thalibah desc
    result.sort((a, b) => {
      if (b.on_time_score !== a.on_time_score) return b.on_time_score - a.on_time_score;
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

    // Compute global Thalibah rank
    allStudentsScores.sort((a, b) => b.score - a.score);
    let userRank = null;
    
    if (isOnlyThalibah) {
      const rankIndex = allStudentsScores.findIndex(s => s.id === authContext.userId);
      if (rankIndex !== -1) {
        userRank = {
          rank: rankIndex + 1,
          total: allStudentsScores.length,
          score: allStudentsScores[rankIndex].score
        };
      }
    }

    return ApiResponses.success({ topHalaqah, allHalaqahs: result, userRank }, 'Halaqah of the week retrieved successfully');
  } catch (error) {
    console.error('[Halaqah of the week API] Unexpected error:', error);
    return ApiResponses.serverError('Terjadi kesalahan internal server.');
  }
}

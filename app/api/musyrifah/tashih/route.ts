import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Helper function to parse blok field (can be string or array)
function parseBlokField(blok: any): string[] {
  if (!blok) return [];
  if (typeof blok === 'string') {
    return blok.split(',').map(b => b.trim()).filter(b => b);
  }
  if (Array.isArray(blok)) {
    return blok;
  }
  return [];
}

export async function GET(request: Request) {
  try {
    const supabase = createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has musyrifah role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roles = userData?.roles || [];
    if (!roles.includes('musyrifah')) {
      return NextResponse.json({ error: 'Forbidden: Musyrifah access required' }, { status: 403 });
    }

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url);
    const blok = searchParams.get('blok');

    // Get all thalibah from daftar_ulang_submissions with approved or submitted status
    // Note: blok comes from tashih_records, NOT from daftar_ulang_submissions
    const { data: daftarUlangUsers, error: daftarUlangError } = await supabase
      .from('daftar_ulang_submissions')
      .select('user_id, confirmed_chosen_juz, status, submitted_at, approved_at')
      .in('status', ['approved', 'submitted']);

    if (daftarUlangError) {
      throw daftarUlangError;
    }

    const userIds = daftarUlangUsers?.map((d: any) => d.user_id) || [];
    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: { bloks: [] }
      });
    }

    // Fetch user data separately
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, nama_kunyah, whatsapp')
      .in('id', userIds);

    // Create a map for quick user lookup
    const userMap = new Map();
    usersData?.forEach((u: any) => {
      userMap.set(u.id, u);
    });

    // Create a map for daftar ulang lookup
    const daftarUlangMap = new Map();
    daftarUlangUsers?.forEach((d: any) => {
      daftarUlangMap.set(d.user_id, d);
    });

    // Fetch all tashih_records for these users
    // Note: blok field is in tashih_records table
    let tashihQuery = supabase
      .from('tashih_records')
      .select('*')
      .in('user_id', userIds)
      .order('waktu_tashih', { ascending: false });

    // If blok filter is specified, we need to check if blok field contains the filter value
    // Since blok can be a comma-separated string or array, we need to filter after fetching
    const { data: allTashihRecords, error: tashihError } = await tashihQuery;

    let tashihRecords = allTashihRecords || [];
    if (blok) {
      // Filter records that contain the specified blok
      tashihRecords = tashihRecords.filter((record: any) => {
        const bloks = parseBlokField(record.blok);
        return bloks.includes(blok);
      });
    }

    // Group tashih records by user_id
    const tashihByUser = new Map();
    tashihRecords.forEach((record: any) => {
      if (!tashihByUser.has(record.user_id)) {
        tashihByUser.set(record.user_id, []);
      }
      tashihByUser.get(record.user_id).push(record);
    });

    // Collect all unique bloks from tashih_records for filter options
    const allBloks = new Set<string>();
    tashihRecords.forEach((record: any) => {
      const bloks = parseBlokField(record.blok);
      bloks.forEach(b => allBloks.add(b));
    });

    // Build combined entries - one per thalibah from daftar_ulang, with their tashih records
    const combinedEntries = userIds.map((userId: string) => {
      const daftarUlang = daftarUlangMap.get(userId);
      const userTashihRecords = tashihByUser.get(userId) || [];
      const latestTashih = userTashihRecords.length > 0 ? userTashihRecords[0] : null;

      return {
        // Daftar ulang info
        user_id: userId,
        confirmed_chosen_juz: daftarUlang?.confirmed_chosen_juz || 0,
        daftar_ulang_status: daftarUlang?.status,
        submitted_at: daftarUlang?.submitted_at,
        approved_at: daftarUlang?.approved_at,

        // User info
        user: userMap.get(userId) || null,

        // Tashih info (latest)
        has_tashih: userTashihRecords.length > 0,
        tashih_count: userTashihRecords.length,
        latest_tashih: latestTashih ? {
          id: latestTashih.id,
          lokasi: latestTashih.lokasi,
          lokasi_detail: latestTashih.lokasi_detail,
          nama_pemeriksa: latestTashih.nama_pemeriksa,
          jumlah_kesalahan_tajwid: latestTashih.jumlah_kesalahan_tajwid,
          waktu_tashih: latestTashih.waktu_tashih,
          blok: latestTashih.blok,
        } : null,

        // All tashih records
        tashih_records: userTashihRecords,
      };
    });

    const uniqueBloks = Array.from(allBloks).sort();

    return NextResponse.json({
      success: true,
      data: combinedEntries,
      meta: {
        bloks: uniqueBloks,
      }
    });
  } catch (error: any) {
    console.error('Error in musyrifah tashih API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

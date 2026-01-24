import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
    const { data: daftarUlangUsers, error: daftarUlangError } = await supabase
      .from('daftar_ulang_submissions')
      .select(`
        user_id,
        blok,
        confirmed_juz_number,
        status,
        submitted_at,
        approved_at
      `)
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

    // Fetch tashih_records for these users
    let tashihQuery = supabase
      .from('tashih_records')
      .select('*')
      .in('user_id', userIds)
      .order('waktu_tashih', { ascending: false });

    if (blok) {
      tashihQuery = tashihQuery.eq('blok', blok);
    }

    const { data: tashihRecords, error: tashihError } = await tashihQuery;

    // Group tashih records by user_id
    const tashihByUser = new Map();
    (tashihRecords || []).forEach((record: any) => {
      if (!tashihByUser.has(record.user_id)) {
        tashihByUser.set(record.user_id, []);
      }
      tashihByUser.get(record.user_id).push(record);
    });

    // Build combined entries - one per thalibah, with their tashih records
    const combinedEntries = (daftarUlangUsers || []).map((daftarUlang: any) => {
      const userTashihRecords = tashihByUser.get(daftarUlang.user_id) || [];
      const latestTashih = userTashihRecords.length > 0 ? userTashihRecords[0] : null;

      return {
        // Daftar ulang info
        user_id: daftarUlang.user_id,
        blok: daftarUlang.blok,
        confirmed_juz_number: daftarUlang.confirmed_juz_number,
        daftar_ulang_status: daftarUlang.status,
        submitted_at: daftarUlang.submitted_at,
        approved_at: daftarUlang.approved_at,

        // User info
        user: userMap.get(daftarUlang.user_id) || null,

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
        } : null,

        // All tashih records
        tashih_records: userTashihRecords,
      };
    });

    // Get unique bloks for filter options
    const { data: bloksData } = await supabase
      .from('daftar_ulang_submissions')
      .select('blok')
      .in('status', ['approved', 'submitted'])
      .not('blok', 'is', null)
      .order('blok', { ascending: true });

    const uniqueBloks = Array.from(new Set(bloksData?.map((d: any) => d.blok).filter((b: any) => b) || []));

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

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
    const pekan = searchParams.get('pekan');
    const batchId = searchParams.get('batch_id');

    // Get active batch if not specified
    let activeBatchId = batchId;
    if (!activeBatchId) {
      const { data: activeBatch } = await supabase
        .from('batches')
        .select('id')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      activeBatchId = activeBatch?.id;
    }

    // Build query for jurnal_records - get ALL records (not filtered by daftar_ulang)
    let query = supabase
      .from('jurnal_records')
      .select(`
        id,
        user_id,
        tanggal_jurnal,
        tanggal_setor,
        juz_code,
        blok,
        tashih_completed,
        rabth_completed,
        murajaah_count,
        simak_murattal_count,
        tikrar_bi_an_nadzar_completed,
        tasmi_record_count,
        simak_record_completed,
        tikrar_bi_al_ghaib_count,
        tafsir_completed,
        menulis_completed,
        total_duration_minutes,
        catatan_tambahan,
        created_at,
        updated_at
      `)
      .order('tanggal_setor', { ascending: false });

    // Apply filters if provided
    if (blok) {
      query = query.eq('blok', blok);
    }
    if (pekan) {
      query = query.eq('pekan', pekan);
    }

    const { data: entries, error } = await query;

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return NextResponse.json({ success: true, data: [] });
      }
      throw error;
    }

    // Extract unique user IDs from entries for fetching user data
    const userIds = entries?.map((e: any) => e.user_id) || [];

    // Fetch user data separately (from public.users)
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, nama_kunyah, whatsapp')
      .in('id', userIds);

    // Create a map for quick user lookup
    const userMap = new Map();
    usersData?.forEach((u: any) => {
      userMap.set(u.id, u);
    });

    // Merge jurnal entries with user data
    const entriesWithUsers = (entries || []).map((entry: any) => ({
      ...entry,
      user: userMap.get(entry.user_id) || null,
    }));

    // Get unique bloks and pekans for filter options
    const { data: bloksData } = await supabase
      .from('jurnal_records')
      .select('blok')
      .not('blok', 'is', null)
      .order('blok', { ascending: true });

    const uniqueBloks = Array.from(new Set(bloksData?.map((d: any) => d.blok).filter((b: any) => b) || []));

    return NextResponse.json({
      success: true,
      data: entriesWithUsers,
      meta: {
        bloks: uniqueBloks,
      }
    });
  } catch (error: any) {
    console.error('Error in musyrifah jurnal API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    // Get user IDs from daftar_ulang_submissions with approved or submitted status
    const { data: daftarUlangUsers } = await supabase
      .from('daftar_ulang_submissions')
      .select('user_id')
      .in('status', ['approved', 'submitted']);

    const userIds = daftarUlangUsers?.map((d: any) => d.user_id) || [];
    if (userIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Build query for tashih_records - filter by daftar_ulang users
    let query = supabase
      .from('tashih_records')
      .select(`
        id,
        user_id,
        blok,
        lokasi,
        lokasi_detail,
        nama_pemeriksa,
        masalah_tajwid,
        catatan_tambahan,
        waktu_tashih,
        created_at,
        updated_at,
        ustadzah_id,
        jumlah_kesalahan_tajwid
      `)
      .in('user_id', userIds)
      .order('waktu_tashih', { ascending: false });

    // Apply blok filter if provided
    if (blok) {
      query = query.eq('blok', blok);
    }

    const { data: entries, error } = await query;

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return NextResponse.json({ success: true, data: [] });
      }
      throw error;
    }

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

    // Merge tashih entries with user data
    const entriesWithUsers = (entries || []).map((entry: any) => ({
      ...entry,
      user: userMap.get(entry.user_id) || null,
    }));

    // Get unique bloks for filter options
    const { data: bloksData } = await supabase
      .from('tashih_records')
      .select('blok')
      .in('user_id', userIds)
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
    console.error('Error in musyrifah tashih API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

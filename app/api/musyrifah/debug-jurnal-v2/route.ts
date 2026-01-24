import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();

    // 1. Check current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const currentUser = user?.id;

    // 2. Direct count query (bypass RLS if possible)
    const { data: allRecords, error: allError } = await supabase
      .rpc('get_all_jurnal_records_count');

    // 3. Get all jurnal records with full details
    const { data: jurnalRecords, error: jurnalError } = await supabase
      .from('jurnal_records')
      .select('*')
      .order('created_at', { ascending: false });

    // 4. Try to count without filters
    const { count: totalCount, error: countError } = await supabase
      .from('jurnal_records')
      .select('*', { count: 'exact', head: true });

    // 5. Check unique user IDs in jurnal
    const uniqueUserIds = Array.from(new Set(jurnalRecords?.map((j: any) => j.user_id) || []));

    // 6. Get all users with jurnal
    const { data: jurnalUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('id', uniqueUserIds);

    // 7. Check RLS policies
    const { data: rlsInfo } = await supabase
      .rpc('check_jurnal_rls', { user_id: currentUser });

    return NextResponse.json({
      success: true,
      debug: {
        current_user: {
          id: currentUser,
          email: user?.email,
        },
        jurnal_records: {
          total_count: totalCount,
          error: countError?.message,
          records_count: jurnalRecords?.length || 0,
          all_records: jurnalRecords?.map((j: any) => ({
            id: j.id,
            user_id: j.user_id,
            blok: j.blok,
            pekan: j.pekan,
            tanggal_setor: j.tanggal_setor,
            created_at: j.created_at,
          })) || [],
        },
        unique_users: {
          count: uniqueUserIds.length,
          user_ids: uniqueUserIds,
        },
        users_with_jurnal: {
          count: jurnalUsers?.length || 0,
          users: jurnalUsers?.map((u: any) => ({
            id: u.id,
            full_name: u.full_name,
            nama_kunyah: u.nama_kunyah,
            roles: u.roles,
          })) || [],
        },
        rls_info: rlsInfo || 'No RLS info',
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

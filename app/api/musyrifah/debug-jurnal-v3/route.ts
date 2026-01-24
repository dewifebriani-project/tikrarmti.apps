import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();

    // 1. Get current auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 2. Check current user's roles
    let currentUserRoles: string[] = [];
    if (user?.id) {
      const { data: userData } = await supabase
        .from('users')
        .select('roles')
        .eq('id', user.id)
        .single();
      currentUserRoles = userData?.roles || [];
    }

    // 3. Try to get ALL jurnal records with different queries
    const queries = {
      // Basic select
      basic: await supabase
        .from('jurnal_records')
        .select('*', { count: 'exact' }),

      // With order
      with_order: await supabase
        .from('jurnal_records')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false }),

      // Just count
      count_only: await supabase
        .from('jurnal_records')
        .select('*', { count: 'exact', head: true }),
    };

    // 4. Get sample data
    const { data: sampleData } = await supabase
      .from('jurnal_records')
      .select('id, user_id, blok, pekan, tanggal_setor, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // 5. Check if table exists
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('check_table_exists', { table_name: 'jurnal_records' });

    // 6. Try raw SQL to count all records (bypassing RLS)
    const { data: rawCount, error: rawError } = await supabase
      .rpc('admin_count_jurnal_records');

    // 7. Get unique user IDs from jurnal_records
    const { data: allRecords } = await supabase
      .from('jurnal_records')
      .select('user_id');
    const uniqueUserIds = Array.from(new Set(allRecords?.map((r: any) => r.user_id) || []));

    // 8. Check if those users exist in public.users
    const { data: usersWithJurnal } = await supabase
      .from('users')
      .select('id, full_name, nama_kunyah, roles')
      .in('id', uniqueUserIds);

    return NextResponse.json({
      success: true,
      debug: {
        auth_user: {
          id: user?.id,
          email: user?.email,
          roles: currentUserRoles,
          error: authError?.message,
        },
        query_results: {
          basic: {
            count: queries.basic.count,
            error: queries.basic.error?.message,
          },
          with_order: {
            count: queries.with_order.count,
            error: queries.with_order.error?.message,
          },
          count_only: {
            count: queries.count_only.count,
            error: queries.count_only.error?.message,
          },
        },
        raw_count: {
          count: rawCount,
          error: rawError?.message,
        },
        sample_data: sampleData?.map((d: any) => ({
          id: d.id,
          user_id: d.user_id,
          blok: d.blok,
          pekan: d.pekan,
          tanggal_setor: d.tanggal_setor,
          created_at: d.created_at,
        })) || [],
        unique_user_ids: uniqueUserIds,
        users_with_jurnal: usersWithJurnal?.map((u: any) => ({
          id: u.id,
          full_name: u.full_name,
          nama_kunyah: u.nama_kunyah,
          roles: u.roles,
        })) || [],
        table_info: {
          exists: tableInfo,
          error: tableError?.message,
        },
      },
      explanation: {
        expected_vs_actual: `User said there should be 50+ records, but query returns: ${queries.basic.count || 0}`,
        possible_reasons: [
          'RLS policies blocking access',
          'Records in different database/environment',
          'Records not actually inserted',
          'Table name mismatch',
        ],
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

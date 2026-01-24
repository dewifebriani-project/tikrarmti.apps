import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Get current user's roles
    let currentUserRoles: string[] = [];
    if (user?.id) {
      const { data: userData } = await supabase
        .from('users')
        .select('roles, role')
        .eq('id', user.id)
        .single();
      currentUserRoles = userData?.roles || [];
    }

    // 1. Test daftar_ulang query
    const { data: daftarUlangUsers, error: daftarUlangError } = await supabase
      .from('daftar_ulang_submissions')
      .select('user_id, status')
      .in('status', ['approved', 'submitted']);

    const daftarUlangUserIds = daftarUlangUsers?.map((d: any) => d.user_id) || [];

    // 2. Test jurnal query with daftar_ulang filter
    const { data: jurnalRecords, error: jurnalError } = await supabase
      .from('jurnal_records')
      .select('id, user_id, blok, pekan')
      .in('user_id', daftarUlangUserIds);

    // 3. Test without filter
    const { data: allJurnalRecords, error: allJurnalError } = await supabase
      .from('jurnal_records')
      .select('id, user_id, blok');

    return NextResponse.json({
      success: true,
      current_user: {
        id: user?.id,
        email: user?.email,
        roles: currentUserRoles,
      },
      daftar_ulang: {
        count: daftarUlangUserIds.length,
        sample_ids: daftarUlangUserIds.slice(0, 5),
        error: daftarUlangError?.message,
      },
      jurnal_with_filter: {
        count: jurnalRecords?.length || 0,
        error: jurnalError?.message,
        sample: jurnalRecords?.slice(0, 5) || [],
      },
      jurnal_all_records: {
        count: allJurnalRecords?.length || 0,
        error: allJurnalError?.message,
      },
      conclusion: {
        expected: jurnalRecords?.length || 0,
        actual_ui: "Check what UI shows",
        possible_issue: jurnalRecords?.length === 0 ? "RLS policy blocking" : "Frontend rendering issue",
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

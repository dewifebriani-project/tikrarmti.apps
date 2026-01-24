import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();

    // Check current user
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

    // Check RLS policies for jurnal_records
    const { data: jurnalPolicies } = await supabase
      .rpc('get_policies_for_table', { table_name: 'jurnal_records' });

    // Check RLS policies for tashih_records
    const { data: tashihPolicies } = await supabase
      .rpc('get_policies_for_table', { table_name: 'tashih_records' });

    // Try to count jurnal_records
    const { count: jurnalCount, error: jurnalCountError } = await supabase
      .from('jurnal_records')
      .select('*', { count: 'exact', head: true });

    // Try to count tashih_records
    const { count: tashihCount, error: tashihCountError } = await supabase
      .from('tashih_records')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      current_user: {
        id: user?.id,
        email: user?.email,
        roles: currentUserRoles,
      },
      jurnal: {
        count: jurnalCount,
        error: jurnalCountError?.message,
      },
      tashih: {
        count: tashihCount,
        error: tashihCountError?.message,
      },
      policies: {
        jurnal_records: jurnalPolicies || 'No policies returned',
        tashih_records: tashihPolicies || 'No policies returned',
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

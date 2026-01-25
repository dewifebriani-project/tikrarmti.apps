import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
    // Use Supabase SSR client to get session
    const supabase = createServerClient();

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    // Check if user is admin using admin client
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || !userData.roles?.includes('admin')) {
      console.error('Admin check failed:', dbError, userData);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');

    console.log('[Daftar Ulang Stats] Fetching statistics with params:', { batchId });

    // Build base query
    let query = supabaseAdmin
      .from('daftar_ulang_submissions')
      .select('status, ujian_halaqah_id, tashih_halaqah_id, akad_files, confirmed_chosen_juz');

    // Apply batch filter (only if batchId is not 'all')
    if (batchId && batchId !== 'all') {
      query = query.eq('batch_id', batchId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Daftar Ulang Stats] Error fetching statistics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch statistics', details: error.message },
        { status: 500 }
      );
    }

    // Calculate statistics
    const total = data?.length || 0;
    const draft = data?.filter(s => s.status === 'draft').length || 0;
    const submitted = data?.filter(s => s.status === 'submitted').length || 0;
    const approved = data?.filter(s => s.status === 'approved').length || 0;
    const rejected = data?.filter(s => s.status === 'rejected').length || 0;
    const withHalaqah = data?.filter(s => s.ujian_halaqah_id || s.tashih_halaqah_id).length || 0;
    const withAkad = data?.filter(s => s.akad_files && s.akad_files.length > 0).length || 0;

    // Count by Juz
    const juzCount: Record<string, number> = {};
    data?.forEach(s => {
      const juz = s.confirmed_chosen_juz || 'Unknown';
      juzCount[juz] = (juzCount[juz] || 0) + 1;
    });

    const stats = {
      total,
      draft,
      submitted,
      approved,
      rejected,
      withHalaqah,
      withAkad,
      juzCount
    };

    console.log('[Daftar Ulang Stats] Success:', stats);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('[Daftar Ulang Stats] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

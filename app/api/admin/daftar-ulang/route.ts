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
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      console.error('Admin check failed:', dbError, userData);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;
    const batchId = searchParams.get('batch_id');
    const status = searchParams.get('status');

    console.log('[Daftar Ulang Admin] Fetching submissions with params:', { page, limit, batchId, status });

    // Build query
    let query = supabaseAdmin
      .from('daftar_ulang_submissions')
      .select(`
        *,
        user:users!daftar_ulang_submissions_user_id_fkey(id, full_name, email),
        registration:pendaftaran_tikrar_tahfidz(id, chosen_juz, exam_score, main_time_slot, backup_time_slot),
        ujian_halaqah:halaqah!daftar_ulang_submissions_ujian_halaqah_id_fkey(id, name, day_of_week, start_time, end_time),
        tashih_halaqah:halaqah!daftar_ulang_submissions_tashih_halaqah_id_fkey(id, name, day_of_week, start_time, end_time),
        partner_user:users!daftar_ulang_submissions_partner_user_id_fkey(id, full_name, email)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (batchId) {
      query = query.eq('batch_id', batchId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('[Daftar Ulang Admin] Error fetching submissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch data', details: error.message },
        { status: 500 }
      );
    }

    // Get total count
    let countQuery = supabaseAdmin
      .from('daftar_ulang_submissions')
      .select('*', { count: 'estimated', head: true });

    if (batchId) {
      countQuery = countQuery.eq('batch_id', batchId);
    }
    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;
    const totalCount = count || 0;

    console.log('[Daftar Ulang Admin] Success, submissions count:', data?.length || 0, 'total:', totalCount);

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('[Daftar Ulang Admin] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

/**
 * GET /api/admin/daftar-ulang/halaqah
 * Fetch thalibah grouped by halaqah for daftar ulang submissions
 */
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
    const batchId = searchParams.get('batch_id');

    console.log('[Daftar Ulang Halaqah] Fetching thalibah per halaqah, batch:', batchId);

    // Fetch all daftar ulang submissions
    let submissionsQuery = supabaseAdmin
      .from('daftar_ulang_submissions')
      .select(`
        *,
        user:users!daftar_ulang_submissions_user_id_fkey(id, full_name, email),
        ujian_halaqah:halaqah!daftar_ulang_submissions_ujian_halaqah_id_fkey(id, name, day_of_week, start_time, end_time, muallimah_id),
        tashih_halaqah:halaqah!daftar_ulang_submissions_tashih_halaqah_id_fkey(id, name, day_of_week, start_time, end_time, muallimah_id)
      `)
      .in('status', ['submitted', 'approved']);

    if (batchId && batchId !== 'all') {
      submissionsQuery = submissionsQuery.eq('batch_id', batchId);
    }

    const { data: submissions, error: submissionsError } = await submissionsQuery;

    if (submissionsError) {
      console.error('[Daftar Ulang Halaqah] Error fetching submissions:', submissionsError);
      return NextResponse.json(
        { error: 'Failed to fetch submissions', details: submissionsError.message },
        { status: 500 }
      );
    }

    // Group submissions by halaqah
    const halaqahMap = new Map<string, {
      halaqah: {
        id: string;
        name: string;
        day_of_week?: number;
        start_time?: string;
        end_time?: string;
        muallimah_id?: string;
      };
      type: 'ujian' | 'tashih';
      thalibah: Array<{
        id: string;
        full_name: string;
        email: string;
        partner_name?: string;
        partner_type?: string;
        status: string;
        submitted_at: string;
        confirmed_juz?: string;
        confirmed_time_slot?: string;
      }>;
    }>();

    submissions?.forEach((submission: any) => {
      // Process Ujian Halaqah
      if (submission.ujian_halaqah) {
        const halaqahId = submission.ujian_halaqah.id;
        if (!halaqahMap.has(`${halaqahId}-ujian`)) {
          halaqahMap.set(`${halaqahId}-ujian`, {
            halaqah: submission.ujian_halaqah,
            type: 'ujian',
            thalibah: []
          });
        }
        halaqahMap.get(`${halaqahId}-ujian`)!.thalibah.push({
          id: submission.user.id,
          full_name: submission.confirmed_full_name || submission.user.full_name,
          email: submission.user.email,
          partner_name: submission.partner_type === 'self_match' && submission.partner_user
            ? submission.partner_user.full_name
            : submission.partner_name,
          partner_type: submission.partner_type,
          status: submission.status,
          submitted_at: submission.submitted_at || submission.created_at,
          confirmed_juz: submission.confirmed_chosen_juz,
          confirmed_time_slot: submission.confirmed_main_time_slot
        });
      }

      // Process Tashih Halaqah (only if not tashih umum)
      if (submission.tashih_halaqah && !submission.is_tashih_umum) {
        const halaqahId = submission.tashih_halaqah.id;
        if (!halaqahMap.has(`${halaqahId}-tashih`)) {
          halaqahMap.set(`${halaqahId}-tashih`, {
            halaqah: submission.tashih_halaqah,
            type: 'tashih',
            thalibah: []
          });
        }
        halaqahMap.get(`${halaqahId}-tashih`)!.thalibah.push({
          id: submission.user.id,
          full_name: submission.confirmed_full_name || submission.user.full_name,
          email: submission.user.email,
          partner_name: submission.partner_type === 'self_match' && submission.partner_user
            ? submission.partner_user.full_name
            : submission.partner_name,
          partner_type: submission.partner_type,
          status: submission.status,
          submitted_at: submission.submitted_at || submission.created_at,
          confirmed_juz: submission.confirmed_chosen_juz,
          confirmed_time_slot: submission.confirmed_main_time_slot
        });
      }
    });

    // Convert map to array and sort by halaqah name
    const halaqahList = Array.from(halaqahMap.values()).sort((a, b) => {
      if (a.halaqah.name && b.halaqah.name) {
        return a.halaqah.name.localeCompare(b.halaqah.name);
      }
      return 0;
    });

    // Fetch muallimah names
    const muallimahIds = new Set<string>();
    halaqahList.forEach(item => {
      if (item.halaqah.muallimah_id) {
        muallimahIds.add(item.halaqah.muallimah_id);
      }
    });

    const { data: muallimahData } = await supabaseAdmin
      .from('users')
      .select('id, full_name')
      .in('id', Array.from(muallimahIds));

    const muallimahMap = new Map(
      (muallimahData || []).map(m => [m.id, m.full_name])
    );

    // Add muallimah names to halaqah
    const result = halaqahList.map(item => ({
      ...item,
      halaqah: {
        ...item.halaqah,
        muallimah_name: muallimahMap.get(item.halaqah.muallimah_id || '') || null
      }
    }));

    console.log('[Daftar Ulang Halaqah] Success, halaqah count:', result.length);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[Daftar Ulang Halaqah] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

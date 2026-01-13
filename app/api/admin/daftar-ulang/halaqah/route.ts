import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

/**
 * GET /api/admin/daftar-ulang/halaqah
 * Fetch thalibah grouped by halaqah for daftar ulang submissions
 * Now uses shared quota calculation API for consistency with thalibah view
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

    // When batch_id is "all" or not provided, return empty result
    // (Grouping by halaqah across all batches doesn't make sense)
    if (!batchId || batchId === 'all') {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Fetch all daftar ulang submissions with halaqah details
    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('daftar_ulang_submissions')
      .select(`
        *,
        user:users!daftar_ulang_submissions_user_id_fkey(id, full_name, email),
        ujian_halaqah:halaqah!daftar_ulang_submissions_ujian_halaqah_id_fkey(id, name, day_of_week, start_time, end_time, muallimah_id, max_students),
        tashih_halaqah:halaqah!daftar_ulang_submissions_tashih_halaqah_id_fkey(id, name, day_of_week, start_time, end_time, muallimah_id, max_students)
      `)
      .eq('batch_id', batchId)
      .in('status', ['submitted', 'approved']);

    if (submissionsError) {
      console.error('[Daftar Ulang Halaqah] Error fetching submissions:', submissionsError);
      return NextResponse.json(
        { error: 'Failed to fetch submissions', details: submissionsError.message },
        { status: 500 }
      );
    }

    // Call shared quota calculation API (without user_id, so all users are counted)
    const quotaUrl = new URL('/api/shared/halaqah-quota', request.url);
    quotaUrl.searchParams.set('batch_id', batchId);
    // Add cache-busting timestamp to ensure fresh data
    quotaUrl.searchParams.set('_t', Date.now().toString());

    const quotaResponse = await fetch(quotaUrl.toString(), {
      headers: {
        'Cookie': request.headers.get('Cookie') || ''
      },
      cache: 'no-store'
    });

    if (!quotaResponse.ok) {
      const errorData = await quotaResponse.json();
      return NextResponse.json(
        { error: 'Failed to fetch quota data', details: errorData.error },
        { status: quotaResponse.status }
      );
    }

    const quotaData = await quotaResponse.json();

    // Create a map of halaqah quota info for quick lookup
    const halaqahQuotaMap = new Map<string, {
      max_students: number;
      total_current_students: number;
      available_slots: number;
      is_full: boolean;
    }>();

    (quotaData.data.halaqah || []).forEach((h: any) => {
      halaqahQuotaMap.set(h.id, {
        max_students: h.total_max_students,
        total_current_students: h.total_current_students,
        available_slots: h.available_slots,
        is_full: h.is_full
      });
    });

    // Group submissions by halaqah
    const halaqahMap = new Map<string, {
      halaqah: {
        id: string;
        name: string;
        day_of_week?: number;
        start_time?: string;
        end_time?: string;
        muallimah_id?: string;
        max_students?: number;
        total_current_students?: number;
        available_slots?: number;
        is_full?: boolean;
        muallimah_name?: string | null;
      };
      type: 'ujian' | 'tashih';
      thalibah: Array<{
        id: string;
        submission_id: string;
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
        const key = `${halaqahId}-ujian`;
        if (!halaqahMap.has(key)) {
          halaqahMap.set(key, {
            halaqah: submission.ujian_halaqah,
            type: 'ujian',
            thalibah: []
          });
        }
        halaqahMap.get(key)!.thalibah.push({
          id: submission.user.id,
          submission_id: submission.id, // Add submission_id for revert feature
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
        const key = `${halaqahId}-tashih`;
        if (!halaqahMap.has(key)) {
          halaqahMap.set(key, {
            halaqah: submission.tashih_halaqah,
            type: 'tashih',
            thalibah: []
          });
        }
        halaqahMap.get(key)!.thalibah.push({
          id: submission.user.id,
          submission_id: submission.id, // Add submission_id for revert feature
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

    // Add muallimah names to halaqah and use quota info from shared API
    const result = halaqahList.map(item => {
      const quotaInfo = halaqahQuotaMap.get(item.halaqah.id) || {
        max_students: item.halaqah.max_students || 20,
        total_current_students: item.thalibah.length,
        available_slots: (item.halaqah.max_students || 20) - item.thalibah.length,
        is_full: item.thalibah.length >= (item.halaqah.max_students || 20)
      };

      return {
        ...item,
        halaqah: {
          ...item.halaqah,
          muallimah_name: muallimahMap.get(item.halaqah.muallimah_id || '') || null,
          max_students: quotaInfo.max_students,
          total_current_students: quotaInfo.total_current_students,
          available_slots: quotaInfo.available_slots,
          is_full: quotaInfo.is_full
        }
      };
    });

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

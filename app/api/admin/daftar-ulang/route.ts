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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 2000);
    const offset = (page - 1) * limit;
    const batchId = searchParams.get('batch_id');
    const status = searchParams.get('status');

    console.log('[Daftar Ulang Admin] Fetching submissions with params:', { page, limit, batchId, status });

    // Build query - get ALL fields from all tables
    let query = supabaseAdmin
      .from('daftar_ulang_submissions')
      .select(`
        *,
        user:users!daftar_ulang_submissions_user_id_fkey(*),
        registration:pendaftaran_tikrar_tahfidz(*),
        ujian_halaqah:halaqah!daftar_ulang_submissions_ujian_halaqah_id_fkey(*),
        tashih_halaqah:halaqah!daftar_ulang_submissions_tashih_halaqah_id_fkey(*),
        partner_user:users!daftar_ulang_submissions_partner_user_id_fkey(*),
        reviewed_by_user:users!daftar_ulang_submissions_reviewed_by_fkey(*)
      `)
      .order('created_at', { ascending: false });

    // Apply filters (only if batchId is not 'all')
    if (batchId && batchId !== 'all') {
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

    // Fetch muallimah names for halaqah
    const muallimahIds = new Set<string>();
    data?.forEach((sub: any) => {
      if (sub.ujian_halaqah?.muallimah_id) muallimahIds.add(sub.ujian_halaqah.muallimah_id);
      if (sub.tashih_halaqah?.muallimah_id) muallimahIds.add(sub.tashih_halaqah.muallimah_id);
    });

    const muallimahNames: Record<string, string> = {};
    if (muallimahIds.size > 0) {
      const { data: muallimahs } = await supabaseAdmin
        .from('users')
        .select('id, full_name')
        .in('id', Array.from(muallimahIds));

      muallimahs?.forEach((m: any) => {
        muallimahNames[m.id] = m.full_name;
      });
    }

    // Attach muallimah names to halaqah data
    let dataWithMuallimah = data?.map((sub: any) => ({
      ...sub,
      ujian_halaqah: sub.ujian_halaqah ? {
        ...sub.ujian_halaqah,
        muallimah_name: sub.ujian_halaqah.muallimah_id ? muallimahNames[sub.ujian_halaqah.muallimah_id] : null
      } : null,
      tashih_halaqah: sub.tashih_halaqah ? {
        ...sub.tashih_halaqah,
        muallimah_name: sub.tashih_halaqah.muallimah_id ? muallimahNames[sub.tashih_halaqah.muallimah_id] : null
      } : null
    }));

    // Fetch study partners for all submissions
    const userIds = dataWithMuallimah?.map((sub: any) => sub.user_id) || [];
    const studyPartnersMap: Record<string, any[]> = {};

    if (userIds.length > 0) {
      // Get batch IDs from submissions
      const batchIds = [...new Set(dataWithMuallimah?.map((sub: any) => sub.batch_id) || [])];

      // Fetch study partners for each batch
      for (const batchId of batchIds) {
        const { data: partners } = await supabaseAdmin
          .from('study_partners')
          .select(`
            *,
            user_1:users!study_partners_user_1_id_fkey(id, full_name, email, whatsapp),
            user_2:users!study_partners_user_2_id_fkey(id, full_name, email, whatsapp),
            user_3:users!study_partners_user_3_id_fkey(id, full_name, email, whatsapp),
            paired_by_user:users!study_partners_paired_by_fkey(id, full_name)
          `)
          .eq('batch_id', batchId)
          .eq('pairing_status', 'active');

        partners?.forEach((partner: any) => {
          // Add to map for both user_1 and user_2
          if (partner.user_1_id) {
            if (!studyPartnersMap[partner.user_1_id]) studyPartnersMap[partner.user_1_id] = [];
            studyPartnersMap[partner.user_1_id].push(partner);
          }
          if (partner.user_2_id) {
            if (!studyPartnersMap[partner.user_2_id]) studyPartnersMap[partner.user_2_id] = [];
            studyPartnersMap[partner.user_2_id].push(partner);
          }
          if (partner.user_3_id) {
            if (!studyPartnersMap[partner.user_3_id]) studyPartnersMap[partner.user_3_id] = [];
            studyPartnersMap[partner.user_3_id].push(partner);
          }
        });
      }
    }

    // Attach study partners to submissions
    const dataWithPartners = dataWithMuallimah?.map((sub: any) => ({
      ...sub,
      study_partners: studyPartnersMap[sub.user_id] || []
    }));

    // Get total count
    let countQuery = supabaseAdmin
      .from('daftar_ulang_submissions')
      .select('*', { count: 'estimated', head: true });

    if (batchId && batchId !== 'all') {
      countQuery = countQuery.eq('batch_id', batchId);
    }
    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;
    const totalCount = count || 0;

    console.log('[Daftar Ulang Admin] Success, submissions count:', dataWithMuallimah?.length || 0, 'total:', totalCount);
    console.log('[Daftar Ulang Admin] Submissions by status:', dataWithMuallimah?.reduce((acc: any, s: any) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {}) || {});

    return NextResponse.json({
      success: true,
      data: dataWithPartners || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error: any) {
    console.error('[Daftar Ulang Admin] Server error:', error);
    console.error('[Daftar Ulang Admin] Error stack:', error?.stack);
    console.error('[Daftar Ulang Admin] Error message:', error?.message);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}

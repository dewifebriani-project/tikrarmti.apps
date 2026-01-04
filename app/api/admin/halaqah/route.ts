import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getClientIp, getUserAgent, logAudit } from '@/lib/audit-log';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    // Admin check
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const batch_id = searchParams.get('batch_id');
    const program_id = searchParams.get('program_id');
    const status = searchParams.get('status');

    console.log('[Halaqah API] Loading halaqahs with filters:', { batch_id, program_id, status });

    let halaqahs: any[] | null = null;

    // If batch_id is provided, we need special handling for halaqah with null program_id
    if (batch_id) {
      // Get all muallimah IDs for this batch
      const { data: batchMuallimahRegs } = await supabaseAdmin
        .from('muallimah_registrations')
        .select('user_id')
        .eq('batch_id', batch_id)
        .eq('status', 'approved');

      const muallimahIds = batchMuallimahRegs?.map((m: { user_id: string }) => m.user_id) || [];

      // Get program IDs for this batch
      const { data: batchPrograms } = await supabaseAdmin
        .from('programs')
        .select('id')
        .eq('batch_id', batch_id);

      const programIds = batchPrograms?.map((p: { id: string }) => p.id) || [];

      console.log('[Halaqah API] Batch muallimah IDs:', muallimahIds.length, 'Program IDs:', programIds.length);

      // Fetch all halaqah and filter manually (needed for OR logic with null program_id)
      const { data: allHalaqahs } = await supabaseAdmin
        .from('halaqah')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter: halaqah belongs to batch if:
      // 1. program_id is in batch programs, OR
      // 2. muallimah_id is in batch muallimah AND program_id is null (unassigned halaqah)
      halaqahs = allHalaqahs?.filter((h: any) => {
        // Match by program
        if (h.program_id && programIds.includes(h.program_id)) {
          return true;
        }
        // Match by muallimah in batch (for halaqah without program)
        if (h.muallimah_id && muallimahIds.includes(h.muallimah_id)) {
          return true;
        }
        return false;
      }) || [];

      console.log('[Halaqah API] Found', halaqahs.length, 'halaqahs for batch');
    } else {
      // No batch filter - use normal query
      let query = supabaseAdmin
        .from('halaqah')
        .select('*')
        .order('created_at', { ascending: false });

      if (program_id) {
        query = query.eq('program_id', program_id);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error: halaqahError } = await query;

      if (halaqahError) {
        console.error('[Halaqah API] Error loading halaqahs:', halaqahError);
        return NextResponse.json(
          { error: 'Failed to load halaqah data', details: halaqahError.message },
          { status: 500 }
        );
      }

      halaqahs = data || [];
      console.log('[Halaqah API] Found', halaqahs.length, 'halaqahs');
    }

    if (!halaqahs || halaqahs.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Apply additional filters
    if (status) {
      halaqahs = halaqahs.filter((h: any) => h.status === status);
    }

    if (program_id) {
      halaqahs = halaqahs.filter((h: any) => h.program_id === program_id);
    }

    // Enrich with program details, student counts, and muallimah info
    const enrichedData = await Promise.all(
      halaqahs.map(async (h: any) => {
        // Fetch program details
        let programData = null;
        if (h.program_id) {
          const { data } = await supabaseAdmin
            .from('programs')
            .select('id, name, class_type, batch_id')
            .eq('id', h.program_id)
            .single();
          programData = data;
        }

        // Fetch batch details
        let batchData = null;
        if (programData?.batch_id) {
          const { data } = await supabaseAdmin
            .from('batches')
            .select('id, name')
            .eq('id', programData.batch_id)
            .single();
          batchData = data;
        }

        // Count active students
        const { count } = await supabaseAdmin
          .from('halaqah_students')
          .select('*', { count: 'exact', head: true })
          .eq('halaqah_id', h.id)
          .eq('status', 'active');

        // Fetch muallimah if assigned
        let muallimah = null;
        if (h.muallimah_id) {
          const { data: muallimahData } = await supabaseAdmin
            .from('users')
            .select('id, full_name, email')
            .eq('id', h.muallimah_id)
            .single();
          muallimah = muallimahData;
        }

        return {
          ...h,
          program: programData ? {
            ...programData,
            batch: batchData
          } : undefined,
          _count: { students: count || 0 },
          muallimah: muallimah || undefined
        };
      })
    );

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'READ',
      resource: 'halaqah',
      details: {
        count: enrichedData.length,
        filters: { batch_id, program_id, status }
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

    return NextResponse.json({
      success: true,
      data: enrichedData
    });

  } catch (error) {
    console.error('[Halaqah API] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

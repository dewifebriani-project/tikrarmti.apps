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

    // Build query for halaqah
    let query = supabaseAdmin
      .from('halaqah')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (batch_id) {
      // First get program IDs for this batch
      const { data: batchPrograms } = await supabaseAdmin
        .from('programs')
        .select('id')
        .eq('batch_id', batch_id);

      if (batchPrograms && batchPrograms.length > 0) {
        query = query.in('program_id', batchPrograms.map((p: { id: string }) => p.id));
      } else {
        // No programs in this batch, return empty
        return NextResponse.json({
          success: true,
          data: []
        });
      }
    }

    if (program_id) {
      query = query.eq('program_id', program_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: halaqahs, error: halaqahError } = await query;

    if (halaqahError) {
      console.error('[Halaqah API] Error loading halaqahs:', halaqahError);
      return NextResponse.json(
        { error: 'Failed to load halaqah data', details: halaqahError.message },
        { status: 500 }
      );
    }

    console.log('[Halaqah API] Found', halaqahs?.length || 0, 'halaqahs');

    if (!halaqahs || halaqahs.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Enrich with program details, student counts, and muallimah info
    const enrichedData = await Promise.all(
      halaqahs.map(async (h: any) => {
        // Fetch program details
        const { data: programData } = await supabaseAdmin
          .from('programs')
          .select('id, name, class_type, batch_id')
          .eq('id', h.program_id)
          .single();

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

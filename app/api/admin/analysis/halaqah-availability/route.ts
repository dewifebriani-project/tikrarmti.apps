import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getClientIp, getUserAgent, logAudit } from '@/lib/audit-log';

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

    // Get batch_id from query parameter
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');

    if (!batchId) {
      return NextResponse.json(
        { error: 'Missing required parameter: batch_id' },
        { status: 400 }
      );
    }

    console.log('[Halaqah Availability API] Loading halaqah availability for batch:', batchId);

    // Call analyze_halaqah_availability_by_juz function
    const { data: availability, error: availabilityError } = await supabaseAdmin
      .rpc('analyze_halaqah_availability_by_juz', { p_batch_id: batchId });

    if (availabilityError) {
      console.error('[Halaqah Availability API] Error loading availability:', availabilityError);
      return NextResponse.json(
        { error: 'Failed to load halaqah availability', details: availabilityError.message },
        { status: 500 }
      );
    }

    // Get batch info
    const { data: batchData, error: batchError } = await supabaseAdmin
      .from('batches')
      .select('name, id')
      .eq('id', batchId)
      .single();

    // Audit log for halaqah availability access
    await logAudit({
      userId: user.id,
      action: 'READ',
      resource: 'halaqah_availability_analysis',
      details: {
        batch_id: batchId,
        batch_name: batchData?.name,
        juz_analyzed: availability?.length || 0
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

    return NextResponse.json({
      success: true,
      data: {
        batch: batchData,
        availability: availability || []
      }
    });

  } catch (error) {
    console.error('[Halaqah Availability API] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get batch_id from query parameter
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');

    if (!batchId) {
      return NextResponse.json(
        { error: 'Missing required parameter: batch_id' },
        { status: 400 }
      );
    }

    console.log('[Matching Analysis API] Loading matching analysis for batch:', batchId);

    // Call analyze_potential_matches function
    const { data: matches, error: matchesError } = await supabaseAdmin
      .rpc('analyze_potential_matches', { p_batch_id: batchId });

    if (matchesError) {
      console.error('[Matching Analysis API] Error loading matches:', matchesError);
      return NextResponse.json(
        { error: 'Failed to load matching analysis', details: matchesError.message },
        { status: 500 }
      );
    }

    // Get batch info
    const { data: batchData, error: batchError } = await supabaseAdmin
      .from('batches')
      .select('name, id')
      .eq('id', batchId)
      .single();

    // Audit log for matching analysis access
    await logAudit({
      userId: user.id,
      action: 'READ',
      resource: 'matching_analysis',
      details: {
        batch_id: batchId,
        batch_name: batchData?.name,
        thalibah_analyzed: matches?.length || 0
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

    return NextResponse.json({
      success: true,
      data: {
        batch: batchData,
        matches: matches || []
      }
    });

  } catch (error) {
    console.error('[Matching Analysis API] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

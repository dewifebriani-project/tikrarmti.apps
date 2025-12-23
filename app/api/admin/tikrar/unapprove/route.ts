import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function POST(request: NextRequest) {
  try {
    console.log('=== Unapprove Tikrar API Started ===');

    // Use Supabase SSR client to get session
    const supabase = createServerClient();

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('Auth error:', userError);
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    console.log('User authenticated:', user.id);

    // Check if user is admin using admin client
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get request body
    const { applicationId, reason } = await request.json();

    console.log('=== Unapprove Tikrar API Called ===');
    console.log('Request body:', { applicationId, reason, userId: user.id });

    if (!applicationId) {
      console.error('Missing application ID');
      return NextResponse.json({ error: 'Missing application ID' }, { status: 400 });
    }

    if (!reason || !reason.trim()) {
      console.error('Missing reason for unapproval');
      return NextResponse.json({ error: 'Reason for unapproval is required' }, { status: 400 });
    }

    // Prepare update data
    const updateData = {
      status: 'pending',
      approved_by: null,
      approved_at: null,
      rejection_reason: `UNAPPROVED: ${reason.trim()}`,
      updated_at: new Date().toISOString()
    };

    console.log('Update data:', updateData);

    // Update the tikrar application using admin client (bypasses RLS)
    const { error, data } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .update(updateData)
      .eq('id', applicationId)
      .select();

    console.log('Unapprove result:', { error, data });

    if (error) {
      console.error('Error unapproving tikrar application:', error);
      return NextResponse.json({
        error: error.message,
        details: {
          code: error.code,
          hint: error.hint,
          details: error.details
        }
      }, { status: 500 });
    }

    console.log('Tikrar application unapproved successfully');
    return NextResponse.json({
      success: true,
      data,
      message: 'Application unapproved successfully'
    });
  } catch (error: any) {
    console.error('Error in unapprove tikrar API:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logAudit, getClientIp, getUserAgent } from '@/lib/audit-log';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
    // Use Supabase SSR client to get session (same as middleware)
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
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get all users with their Tikrar batch info using admin client (bypasses RLS)
    console.log('Fetching users...');

    // Try to fetch with relationships first
    let users;
    let fetchError;

    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          current_batch:batches!users_current_tikrar_batch_id_fkey(
            id,
            name,
            start_date,
            end_date,
            status
          ),
          tikrar_registrations:pendaftaran_tikrar_tahfidz!pendaftaran_tikrar_tahfidz_user_id_fkey(
            id,
            batch_id,
            batch_name,
            status,
            selection_status,
            re_enrollment_completed
          ),
          muallimah_registrations:muallimah_registrations!muallimah_registrations_user_id_fkey(
            id,
            batch_id,
            status
          ),
          musyrifah_registrations:musyrifah_registrations!musyrifah_registrations_user_id_fkey(
            id,
            batch_id,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching users with relationships:', error);
        fetchError = error;
      } else if (data) {
        // Map the response to flatten current_batch (it comes as array from Supabase)
        users = data.map((user: any) => ({
          ...user,
          current_tikrar_batch: user.current_batch?.[0] || null,
          current_batch: undefined,
        }));
        console.log(`Successfully fetched ${users?.length || 0} users with relationships`);
      }
    } catch (err: any) {
      console.warn('Exception fetching users with relationships:', err);
      fetchError = err;
    }

    // If relationship fetch failed, try without relationships
    if (fetchError || !users) {
      console.log('Retrying without relationships...');
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users (fallback):', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return NextResponse.json({
          error: 'Failed to fetch users',
          details: error.message,
          code: error.code,
          hint: error.hint
        }, { status: 500 });
      }

      users = data;
      console.log(`Successfully fetched ${users?.length || 0} users (without relationships)`);
    }

    // Audit log for users list access
    await logAudit({
      userId: user.id,
      action: 'READ',
      resource: 'users',
      details: {
        count: users?.length || 0,
        with_relationships: !!users?.[0]?.current_tikrar_batch
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

    return NextResponse.json({ users: users || [] });
  } catch (error: any) {
    console.error('Error in admin users API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function POST(request: NextRequest) {
  try {
    console.log('=== Bulk Approve Tikrar API Started ===');

    // Get access token from cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const accessTokenCookie = allCookies.find(c => c.name === 'sb-access-token');
    const refreshTokenCookie = allCookies.find(c => c.name === 'sb-refresh-token');
    const accessToken = accessTokenCookie?.value;
    const refreshToken = refreshTokenCookie?.value;

    // Also try to get from Authorization header as fallback
    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader?.replace('Bearer ', '');

    const tokenToUse = accessToken || headerToken;

    console.log('Token availability:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasHeaderToken: !!headerToken,
      tokenToUse: !!tokenToUse
    });

    if (!tokenToUse) {
      console.log('No token found - unauthorized');
      return NextResponse.json({
        error: 'Unauthorized - No token found. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // First try to use the token directly
    let session, sessionError;

    try {
      const result = await supabase.auth.setSession({
        access_token: tokenToUse,
        refresh_token: refreshToken || ''
      });
      session = result.data.session;
      sessionError = result.error;
    } catch (e) {
      console.error('Session setting error:', e);
      sessionError = e;
    }

    // If session setting fails, try to get user from token
    if (sessionError || !session) {
      console.log('Session setting failed, trying getUser...')
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser(tokenToUse);

        if (userError || !userData.user) {
          console.error('User retrieval failed:', userError);
          return NextResponse.json({
            error: 'Unauthorized - Invalid token. Please login again.',
            needsLogin: true
          }, { status: 401 });
        }

        // Create a minimal session-like object for the user
        session = { user: userData.user };
      } catch (e) {
        console.error('User retrieval exception:', e);
        return NextResponse.json({
          error: 'Unauthorized - Token validation failed. Please login again.',
          needsLogin: true
        }, { status: 401 });
      }
    }

    const user = session.user;
    if (!user) {
      console.log('No user in session');
      return NextResponse.json({
        error: 'Unauthorized - No user found. Please login again.',
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
    const { ids, action, rejectionReason, applicationIds, reason } = await request.json();

    console.log('=== Bulk Approve Tikrar API Called ===');
    console.log('Request body:', {
      idsCount: ids?.length || applicationIds?.length,
      action,
      userId: user.id,
      hasApplicationIds: !!applicationIds
    });

    // Support both old format (ids) and new format (applicationIds)
    const targetIds = ids || applicationIds;
    const actualReason = rejectionReason || reason;

    if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
      console.error('Missing or invalid ids array');
      return NextResponse.json({ error: 'Missing or invalid ids array' }, { status: 400 });
    }

    if (!action || !['approve', 'reject', 'unapprove'].includes(action)) {
      console.error('Invalid action. Must be "approve", "reject", or "unapprove"');
      return NextResponse.json({ error: 'Invalid action. Must be "approve", "reject", or "unapprove"' }, { status: 400 });
    }

    // Prepare update data based on action
    const now = new Date().toISOString();
    let updateData: any = {
      updated_at: now
    };

    if (action === 'approve') {
      updateData.status = 'approved';
      updateData.approved_by = user.id;
      updateData.approved_at = now;
    } else if (action === 'reject') {
      updateData.status = 'rejected';
      updateData.approved_by = user.id;
      updateData.approved_at = now;
      if (actualReason) {
        updateData.rejection_reason = actualReason;
      }
    } else if (action === 'unapprove') {
      updateData.status = 'pending';
      updateData.approved_by = null;
      updateData.approved_at = null;
      // Use rejection_reason field to store unapprove reason for simplicity
      if (actualReason) {
        updateData.rejection_reason = `UNAPPROVED: ${actualReason}`;
      }
    }

    console.log('Update data:', updateData);

    // Update all applications in bulk using admin client (bypasses RLS)
    let query = supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .update(updateData)
      .in('id', targetIds);

    // Only filter by status for approve/reject, not for unapprove
    if (action !== 'unapprove') {
      query = query.eq('status', 'pending'); // Only update pending applications
    }

    const { error, data } = await query.select();

    console.log('Bulk update result:', { error, updatedCount: data?.length });

    if (error) {
      console.error('Error bulk updating tikrar applications:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Tikrar applications bulk updated successfully');
    return NextResponse.json({
      success: true,
      updatedCount: data?.length || 0,
      data
    });
  } catch (error: any) {
    console.error('Error in bulk approve tikrar API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

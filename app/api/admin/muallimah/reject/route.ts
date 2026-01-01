import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the public.user record (which has the same id as auth.users.id)
    const { data: publicUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (userError || !publicUser) {
      return NextResponse.json({ error: 'User not found in public.users table' }, { status: 400 });
    }

    const body = await request.json();
    const { id, reason } = body;

    if (!id) {
      return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    // Update status to rejected
    console.log('[Muallimah Reject] Attempting to reject registration:', {
      registrationId: id,
      reviewedBy: publicUser.id,
      reviewerEmail: user.email,
      reason: reason.trim()
    });

    const { error } = await supabaseAdmin
      .from('muallimah_registrations')
      .update({
        status: 'rejected',
        reviewed_by: publicUser.id,
        review_notes: `REJECTED: ${reason.trim()}`
      })
      .eq('id', id);

    if (error) {
      console.error('[Muallimah Reject] Database error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json(
        { error: 'Failed to reject registration', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Muallimah registration rejected successfully',
      version: 'v1'
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

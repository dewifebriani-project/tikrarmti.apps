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
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
    }

    // Update status to approved
    console.log('[Muallimah Approve] Attempting to approve registration:', {
      registrationId: id,
      reviewedBy: publicUser.id,
      reviewerEmail: user.email
    });

    const { error } = await supabaseAdmin
      .from('muallimah_registrations')
      .update({
        status: 'approved',
        reviewed_by: publicUser.id,
        review_notes: body.review_notes || null
      })
      .eq('id', id);

    if (error) {
      console.error('[Muallimah Approve] Database error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json(
        { error: 'Failed to approve registration', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Muallimah registration approved successfully',
      version: 'v2' // Version marker to confirm deployment
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

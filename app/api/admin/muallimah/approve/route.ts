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

    const { data: publicUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (userError || !publicUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Akad ID is required' }, { status: 400 });
    }

    // Update muallimah_akads status
    const { error } = await supabaseAdmin
      .from('muallimah_akads')
      .update({
        status: 'approved',
        reviewed_by: publicUser.id,
        reviewed_at: new Date().toISOString(),
        review_notes: body.review_notes || null
      })
      .eq('id', id);

    if (error) {
      console.error('[Muallimah Approve] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to approve akad', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Muallimah akad approved successfully'
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

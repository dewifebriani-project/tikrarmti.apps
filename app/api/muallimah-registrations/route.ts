import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batch_id = searchParams.get('batch_id');
    const status = searchParams.get('status');

    if (!batch_id) {
      return NextResponse.json(
        { error: 'Missing batch_id parameter' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('muallimah_registrations')
      .select('id, user_id, full_name, email, preferred_juz, preferred_max_thalibah, status')
      .eq('batch_id', batch_id);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Muallimah Registrations API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to load muallimah registrations', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('[Muallimah Registrations API] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

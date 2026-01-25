import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batch_id = searchParams.get('batch_id');

    if (!batch_id) {
      return NextResponse.json(
        { error: 'Missing batch_id parameter' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('programs')
      .select('*')
      .eq('batch_id', batch_id)
      .in('status', ['open', 'ongoing']);

    if (error) {
      console.error('[Programs API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to load programs', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('[Programs API] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

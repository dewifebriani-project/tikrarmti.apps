import { NextRequest, NextResponse } from 'next/server';
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
      .from('muallimah_akads')
      .select('id, user_id, preferred_juz, preferred_max_thalibah, status, user:users!muallimah_akads_user_id_fkey(full_name, email)')
      .eq('batch_id', batch_id);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Muallimah Akads API] Error:', error.code, error.message);
      return NextResponse.json(
        { error: 'Failed to load muallimah akads' },
        { status: 500 }
      );
    }

    const formattedData = data.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      full_name: item.user?.full_name || 'Ustadzah',
      email: item.user?.email || '',
      preferred_juz: item.preferred_juz,
      preferred_max_thalibah: item.preferred_max_thalibah,
      status: item.status
    }));

    return NextResponse.json({
      success: true,
      data: formattedData || []
    });

  } catch (error) {
    console.error('[Muallimah Akads API] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

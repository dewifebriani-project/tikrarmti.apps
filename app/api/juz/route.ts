import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function GET() {
  try {
    // Get all active juz options, ordered by sort_order
    const { data: juzOptions, error } = await supabaseAdmin
      .from('juz_options')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching juz options:', error);
      return NextResponse.json(
        { error: 'Failed to fetch juz options' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: juzOptions || [] });
  } catch (error) {
    console.error('Error in juz API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

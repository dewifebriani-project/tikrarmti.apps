import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

/**
 * @deprecated This endpoint is deprecated.
 *
 * MIGRATION GUIDE:
 * Instead of fetching juz options via API from client:
 * ❌ const { data } = await fetch('/api/juz')
 *
 * Use Server Component:
 * ✅ async function MyServerComponent() {
 * ✅   const supabase = createClient()
 * ✅   const { data } = await supabase.from('juz_options').select('*').eq('is_active', true)
 * ✅   return <ClientComponent juzOptions={data} />
 * ✅ }
 *
 * This endpoint is kept for backward compatibility only.
 */
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

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });

  try {
    const { data: programsCountResult, count: programsCount } = await supabase.from('programs').select('id', { count: 'exact' });
    const { data: programsBody, error: programsError } = await supabase.from('programs').select('*').limit(1).single();

    return NextResponse.json({ 
      programsCount,
      programs: programsCountResult,
      programsBody,
      programsError
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}

import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function POST() {
  try {
    const supabase = createSupabaseAdmin();
    const sql = `
ALTER TABLE public.daftar_ulang_submissions ADD COLUMN IF NOT EXISTS ready_for_team text;
ALTER TABLE public.daftar_ulang_submissions ADD COLUMN IF NOT EXISTS infaq_amount text;
`;

    // Try both parameter names
    let result = await supabase.rpc('exec_sql', { sql_query: sql });
    if (result.error) {
      console.log('Retrying with "sql" parameter...');
      result = await supabase.rpc('sql', { sql: sql });
    }
    
    if (result.error) {
       // Try admin_exec_sql
       console.log('Retrying with admin_exec_sql...');
       result = await supabase.rpc('admin_exec_sql', { sql_query: sql });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

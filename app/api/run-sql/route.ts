import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.rpc('admin_exec_sql', {
    sql_query: `
      ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS registration_start_date timestamp with time zone;
      ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS registration_end_date timestamp with time zone;
    `
  });

  return NextResponse.json({ data, error });
}

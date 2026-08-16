import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.rpc('admin_exec_sql', {
    sql_query: `
      ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS transfer_schedule_end_date timestamp with time zone;
      NOTIFY pgrst, 'reload schema';
    `
  });

  return NextResponse.json({ data, error });
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAnyRole } from '@/lib/rbac';

export async function GET() {
  // Ensure only admins can execute this route
  const authError = await requireAnyRole(['admin']);
  if (authError) return authError;

  const supabase = createClient();

  const { data, error } = await supabase.rpc('admin_exec_sql', {
    sql_query: `
      ALTER TABLE public.jurnal_records 
      ADD COLUMN IF NOT EXISTS rabth_methods TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS tafsir_options TEXT[] DEFAULT '{}';
      
      NOTIFY pgrst, 'reload schema';
    `
  });

  return NextResponse.json({ data, error });
}

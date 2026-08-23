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
      ALTER TABLE public.daftar_ulang_submissions 
      DROP CONSTRAINT IF EXISTS daftar_ulang_submissions_status_check;
      
      ALTER TABLE public.pendaftaran_tikrar_tahfidz 
      DROP CONSTRAINT IF EXISTS pendaftaran_tikrar_tahfidz_status_check;
      
      NOTIFY pgrst, 'reload schema';
    `
  });

  return NextResponse.json({ data, error });
}

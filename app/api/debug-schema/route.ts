import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase.rpc('admin_exec_sql', {
    sql_query: `
      SELECT conname, pg_get_constraintdef(c.oid) AS constraint_def
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE conname = 'tashih_records_ustadzah_id_fkey'
    `
  })
  return new Response(JSON.stringify({ data, error }))
}

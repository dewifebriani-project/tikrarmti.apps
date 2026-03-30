import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const supabase = createSupabaseAdmin();
  
  const sqlQuery = `
CREATE OR REPLACE FUNCTION public.sync_user_roles_to_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- FIX: Using correct column name raw_app_meta_data
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_strip_nulls(jsonb_build_object(
      'roles', NEW.roles, 
      'role', NEW.role
    ))
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;
  `;

  const syncAllSql = `
DO $$
DECLARE
  user_row RECORD;
BEGIN
  FOR user_row IN SELECT * FROM public.users LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_strip_nulls(jsonb_build_object(
        'roles', user_row.roles, 
        'role', user_row.role
      ))
    WHERE id = user_row.id;
  END LOOP;
END;
$$;
  `;

  try {
    console.log('Attempting to fix DB trigger...');
    const { data: d1, error: e1 } = await supabase.rpc('exec_sql', { sql_query: sqlQuery });
    if (e1) throw e1;

    console.log('Attempting to sync all users...');
    const { data: d2, error: e2 } = await supabase.rpc('exec_sql', { sql_query: syncAllSql });
    if (e2) throw e2;

    return NextResponse.json({ 
      success: true, 
      message: 'Database trigger fixed and users synced successfully' 
    });
  } catch (error: any) {
    console.error('Database fix error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

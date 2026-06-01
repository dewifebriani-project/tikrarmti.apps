import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const sql = `
-- 1. muallimah_registrations
DROP POLICY IF EXISTS muallimah_insert_own ON public.muallimah_registrations;
CREATE POLICY muallimah_insert_own ON public.muallimah_registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS muallimah_update_own ON public.muallimah_registrations;
CREATE POLICY muallimah_update_own ON public.muallimah_registrations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. musyrifah_registrations
DROP POLICY IF EXISTS musyrifah_insert_own ON public.musyrifah_registrations;
CREATE POLICY musyrifah_insert_own ON public.musyrifah_registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS musyrifah_update_own ON public.musyrifah_registrations;
CREATE POLICY musyrifah_update_own ON public.musyrifah_registrations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  `;
  const { data, error } = await supabase.rpc('admin_exec_sql', { sql_query: sql });
  console.log({ data, error });
}
run();

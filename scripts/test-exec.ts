import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const sql = `
ALTER TABLE public.muallimah_akads
ALTER COLUMN class_type TYPE TEXT,
ALTER COLUMN preferred_juz TYPE TEXT,
ALTER COLUMN status TYPE TEXT;
  `;
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  console.log({ data, error });
}
run();

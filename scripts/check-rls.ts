import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLS() {
  const { data, error } = await supabase.from('pg_policies').select('*').eq('tablename', 'muallimah_registrations');
  console.log("Policies:", data);
  console.log("Error:", error);
}

checkRLS();

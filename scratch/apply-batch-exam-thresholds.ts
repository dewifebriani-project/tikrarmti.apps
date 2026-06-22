import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load env
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
  const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '20260622_add_batch_exam_thresholds.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('🚀 Executing SQL migration via RPC query...');
  const { data, error } = await supabase.rpc('query', {
    sql: sql
  });

  if (error) {
    console.error('❌ RPC error:', error);
    process.exit(1);
  }

  console.log('✅ query result:', data);
}

run().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  console.log('Querying a single row from pendaftaran_tikrar_tahfidz to inspect keys...');
  const { data: row, error: rowError } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('*')
    .limit(1)
    .maybeSingle();
    
  if (rowError) {
    console.error('Row query failed:', rowError);
  } else {
    console.log('Columns in pendaftaran_tikrar_tahfidz:', Object.keys(row || {}));
  }
}

run().catch(console.error);

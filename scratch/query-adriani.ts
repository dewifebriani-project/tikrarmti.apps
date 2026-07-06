import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load env
dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);

async function check() {
  const { data, error } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('*')
    .eq('id', '3c1509b1-293d-412b-a3ec-14d6c6c2c077')
    .single();

  if (error) {
    console.error('Fetch failed:', error);
    return;
  }

  console.log('--- Adriani Record in Database ---');
  console.log(data);
}

check().catch(console.error);

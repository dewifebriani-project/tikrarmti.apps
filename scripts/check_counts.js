import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(url, key);

async function checkData() {
  const { count: muallimahCount, error: mError } = await supabase
    .from('muallimah_registrations')
    .select('*', { count: 'exact', head: true });

  const { count: pendaftaranCount, error: pError } = await supabase
    .from('pendaftaran')
    .select('*', { count: 'exact', head: true });
    
  const { count: tikrarCount, error: tError } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('*', { count: 'exact', head: true });

  console.log('Muallimah Registrations count:', muallimahCount);
  if (mError) console.error('Error muallimah:', mError);

  console.log('Pendaftaran count:', pendaftaranCount);
  if (pError) console.error('Error pendaftaran:', pError);
  
  console.log('Tikrar Count:', tikrarCount);

  if (muallimahCount > 0) {
    const { data } = await supabase
      .from('muallimah_registrations')
      .select('*')
      .limit(1);
    console.log('Sample Muallimah:', data);
  }
}

checkData();

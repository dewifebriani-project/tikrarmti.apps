import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.from('pendaftaran_tikrar_tahfidz').select('*').limit(1);
  if (error) {
    console.error(error);
  } else {
    if (data.length > 0) {
      console.log(Object.keys(data[0]).join(', '));
    } else {
      console.log("No data");
    }
  }
}
main();

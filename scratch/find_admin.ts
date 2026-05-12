import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function run() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email')
    .contains('roles', ['admin'])
    .limit(1);
    
  if (error) console.error(error);
  else console.log(data);
}

run();

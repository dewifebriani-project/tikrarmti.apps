import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('akad_quiz_attempts').select('*').limit(1);
  if (error) {
    console.error('Error fetching akad_quiz_attempts:', error);
  } else {
    console.log('Successfully fetched akad_quiz_attempts:', data);
  }
}
main();

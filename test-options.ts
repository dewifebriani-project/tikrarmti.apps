import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('akad_quiz_questions').select('id, options');
  if (error) {
    console.error(error);
    return;
  }
  const nullOptions = data.filter(d => !d.options);
  console.log('Null options count:', nullOptions.length);
  if (nullOptions.length > 0) {
    console.log(nullOptions);
  }
}

run();

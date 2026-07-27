import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function checkQuiz() {
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, full_name')
    .ilike('full_name', '%Dewi Nurhayati%')
    .single();
    
  if (user) {
    console.log('User found:', user);
    const { data: attempts, error } = await supabaseAdmin
      .from('akad_quiz_attempts')
      .select('*')
      .eq('user_id', user.id);
      
    console.log('Quiz attempts:', attempts);
  } else {
    console.log('User not found or error:', userError);
  }
}

checkQuiz();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('user_id', '047cd549-0eaa-426f-82f3-77b04d36d401');
  
  console.log("Exam Attempts:", attempts);
}
run();

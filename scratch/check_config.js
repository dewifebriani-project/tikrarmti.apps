const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: config } = await supabase
    .from('exam_configurations')
    .select('*')
    .eq('is_active', true)
    .single();
    
  console.log('CONFIG:', config);
}

check();

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkBlacklist() {
  console.log('🔍 Checking users table for is_blacklisted:');
  
  const { data, count, error } = await supabase
    .from('users')
    .select('id, full_name, email, is_blacklisted')
    .eq('is_blacklisted', true);

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log('✅ Count (exact head):', count);
  console.log('✅ Data length:', data?.length);
  console.log('✅ Sample blacklisted users:', data);
}

checkBlacklist().catch(console.error);

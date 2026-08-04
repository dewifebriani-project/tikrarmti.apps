const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase.rpc('admin_get_rls_policies');
  if (data) {
    const tablePolicies = data.filter(p => p.tablename === 'halaqah_students');
    console.log(tablePolicies);
  } else {
    console.log(error);
  }
}

run();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key] = val.join('=').replace('\r', '');
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const sql = `
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_roles_check;
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_valid_roles;
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

    ALTER TABLE public.users
    ADD CONSTRAINT check_valid_roles
    CHECK (
      roles IS NULL OR roles <@ ARRAY[
        'admin',
        'calon_thalibah',
        'thalibah',
        'muallimah',
        'musyrifah',
        'pengurus'
      ]::text[]
    );
  `;
  const { data, error } = await supabase.rpc('admin_exec_sql', { sql_query: sql });
  console.log('Result:', data, 'Error:', error);
}

main();

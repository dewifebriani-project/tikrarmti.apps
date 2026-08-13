const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase.rpc('admin_exec_sql', {
    sql_query: `
      ALTER TABLE public.programs DROP CONSTRAINT IF EXISTS programs_class_type_check;
      ALTER TABLE public.programs ADD CONSTRAINT programs_class_type_check
      CHECK (
        class_type IS NULL OR
        class_type IN (
          'tikrar_tahfidz',
          'pra_tahfidz',
          'tashih_only',
          'ujian_only',
          'tashih_ujian',
          'muallimah'
        )
      );
    `
  });
  console.log('Done', error || 'Success');
}

main();

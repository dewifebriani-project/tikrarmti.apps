require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase.rpc('admin_exec_sql', {
    sql_query: `
      DROP POLICY IF EXISTS halaqah_students_select_staff ON public.halaqah_students;
      CREATE POLICY halaqah_students_select_staff ON public.halaqah_students
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND (
              'musyrifah' = ANY(roles) OR
              'muallimah' = ANY(roles)
            )
          )
        );
      NOTIFY pgrst, 'reload schema';
    `
  });
  console.log('Result:', data, error);
}
run();

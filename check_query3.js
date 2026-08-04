const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const batch = { id: '2478b493-1b6b-412a-a05f-6193db815a43' };
  const { data, error } = await supabase
        .from('halaqah')
        .select(`
          id,
          name,
          day_of_week,
          start_time,
          end_time,
          preferred_juz,
          zoom_link,
          zoom_name,
          zoom_meeting_id,
          zoom_passcode,
          muallimah:users!halaqah_muallimah_id_fkey(full_name),
          program:programs!inner(class_type, batch_id, batch:batches(name)),
          students:halaqah_students(status, thalibah:users!halaqah_students_thalibah_id_fkey(full_name))
        `)
        .eq('program.batch_id', batch.id)
        .eq('day_of_week', 2)
        .eq('status', 'active')
        .order('start_time', { ascending: true })
        .limit(1);
  console.log(JSON.stringify({data, error}, null, 2));
}
check();

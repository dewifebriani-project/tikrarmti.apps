const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const userId = '5e1b7339-1584-4144-a299-1d8788714fef';
  
  // Check halaqah_students
  const { data: halaqahStudents, error: hsError } = await supabase
    .from('halaqah_students')
    .select('*, halaqah(*)')
    .eq('thalibah_id', userId)
    .eq('status', 'active');
    
  console.log("Halaqah Students:", hsError || JSON.stringify(halaqahStudents, null, 2));

  // Check daftar_ulang_submissions
  const { data: daftarUlang, error: duError } = await supabase
    .from('daftar_ulang_submissions')
    .select('*, ujian_halaqah:halaqah!daftar_ulang_submissions_ujian_halaqah_id_fkey(*), tashih_halaqah:halaqah!daftar_ulang_submissions_tashih_halaqah_id_fkey(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  console.log("Daftar Ulang:", duError || JSON.stringify(daftarUlang, null, 2));
}
run();

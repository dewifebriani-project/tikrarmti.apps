const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const userId = '5e1b7339-1584-4144-a299-1d8788714fef';
  
  const { data: tikrarById, error: errorById } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select(`
      *,
      program:programs(*),
      batch:batches(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  console.log("Pendaftaran:", errorById || tikrarById.length);

  const { data: daftarUlangSubmissions, error: daftarUlangError } = await supabase
    .from('daftar_ulang_submissions')
    .select(`
      *,
      batch:batches(*),
      ujian_halaqah:halaqah!daftar_ulang_submissions_ujian_halaqah_id_fkey(*),
      tashih_halaqah:halaqah!daftar_ulang_submissions_tashih_halaqah_id_fkey(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  console.log("Daftar Ulang submissions:", daftarUlangError || daftarUlangSubmissions.length);

  const allRegistrations = tikrarById
    .map((reg) => {
      const batch = Array.isArray(reg.batch) ? reg.batch[0] : reg.batch;
      const daftarUlang = daftarUlangSubmissions?.find(dus => dus.registration_id === reg.id);
      return {
        ...reg,
        batch: batch || null,
        registration_type: 'thalibah',
        role: 'thalibah',
        status: reg.status || 'pending',
        batch_name: batch?.name || null,
        daftar_ulang: daftarUlang || null
      };
    });

  console.log("Reg 0 daftar ulang:", JSON.stringify(allRegistrations[0].daftar_ulang, null, 2));
}
run();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const introText = "📝 Formulir ini adalah formulir pendaftaran untuk kelas hafalan Al-Qur'an gratis (syarat dan ketentuan berlaku) khusus akhawat, menggunakan metode pengulangan (tikrar) sebanyak 40 kali...\n\n(Lanjutkan dengan teks selengkapnya yang diinginkan admin)";
  
  const { data, error } = await supabase.from('registration_questions').insert({
    field_key: 'intro_text',
    section: 1,
    label: "Bismillah.. Hayyakillah Ahlan wasahlan kakak-kakak calon hafidzah..",
    description: introText,
    warning_text: "⚠️ Peringatan Penting: Bagi kakak-kakak yang sibuk...",
    is_active: true,
    is_required: false,
    sort_order: 0,
    input_type: 'info'
  });
  console.log(data, error);
}
main();

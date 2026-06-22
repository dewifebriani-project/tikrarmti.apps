const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('--- SEEDING COMMITMENT INFO FOR MUALLIMAH & REREG ---');

  // 1. Mu'allimah Registration Form
  console.log('Checking commitment_info in muallimah_registration_questions...');
  const { data: existingMuallimah, error: errM } = await supabase
    .from('muallimah_registration_questions')
    .select('*')
    .eq('field_key', 'commitment_info')
    .maybeSingle();

  if (errM) {
    console.error('Error checking Muallimah question:', errM);
  } else if (existingMuallimah) {
    console.log('commitment_info already exists in muallimah_registration_questions. Updating...');
    const { error: updM } = await supabase
      .from('muallimah_registration_questions')
      .update({
        label: '🤝 Akad Komitmen & Etika Mu\'allimah',
        description: 'Silakan baca dan centang setiap poin di bawah ini sebagai bentuk pemahaman dan kesepakatan Ukhti terhadap akad MTI:',
        input_type: 'info',
        section: 3,
        sort_order: 16,
        is_required: false,
        is_active: true
      })
      .eq('field_key', 'commitment_info');
    if (updM) console.error('Error updating Muallimah commitment_info:', updM);
    else console.log('Successfully updated existing Muallimah commitment_info.');
  } else {
    console.log('commitment_info does not exist in muallimah_registration_questions. Inserting...');
    const { error: insM } = await supabase
      .from('muallimah_registration_questions')
      .insert({
        field_key: 'commitment_info',
        section: 3,
        label: '🤝 Akad Komitmen & Etika Mu\'allimah',
        description: 'Silakan baca dan centang setiap poin di bawah ini sebagai bentuk pemahaman dan kesepakatan Ukhti terhadap akad MTI:',
        warning_text: null,
        input_type: 'info',
        sort_order: 16,
        is_required: false,
        is_active: true,
        options: []
      });
    if (insM) console.error('Error inserting Muallimah commitment_info:', insM);
    else console.log('Successfully inserted Muallimah commitment_info.');
  }

  // 2. Re-registration Form
  console.log('Checking commitment_info in reregistration_questions...');
  const { data: existingRereg, error: errR } = await supabase
    .from('reregistration_questions')
    .select('*')
    .eq('field_key', 'commitment_info')
    .maybeSingle();

  if (errR) {
    console.error('Error checking Reregistration question:', errR);
  } else if (existingRereg) {
    console.log('commitment_info already exists in reregistration_questions. Updating...');
    const { error: updR } = await supabase
      .from('reregistration_questions')
      .update({
        label: '🤝 Ketentuan Akad Daftar Ulang',
        description: 'Silakan baca dengan teliti intisari akad di bawah ini. Anda diwajibkan menulis tangan seluruh poin akad tersebut pada selembar kertas, menandatanganinya, dan mengunggah foto/scan hasil tanda tangan Anda.',
        input_type: 'info',
        section: 4,
        sort_order: 9,
        is_required: false,
        is_active: true
      })
      .eq('field_key', 'commitment_info');
    if (updR) console.error('Error updating Reregistration commitment_info:', updR);
    else console.log('Successfully updated existing Reregistration commitment_info.');
  } else {
    console.log('commitment_info does not exist in reregistration_questions. Inserting...');
    const { error: insR } = await supabase
      .from('reregistration_questions')
      .insert({
        field_key: 'commitment_info',
        section: 4,
        label: '🤝 Ketentuan Akad Daftar Ulang',
        description: 'Silakan baca dengan teliti intisari akad di bawah ini. Anda diwajibkan menulis tangan seluruh poin akad tersebut pada selembar kertas, menandatanganinya, dan mengunggah foto/scan hasil tanda tangan Anda.',
        warning_text: null,
        input_type: 'info',
        sort_order: 9,
        is_required: false,
        is_active: true,
        options: []
      });
    if (insR) console.error('Error inserting Reregistration commitment_info:', insR);
    else console.log('Successfully inserted Reregistration commitment_info.');
  }

  console.log('--- SEEDING COMPLETED ---');
}

seed();

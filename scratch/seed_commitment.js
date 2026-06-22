const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const commitmentDescription = `• Program ini melibatkan banyak pihak dan pasangan setoran. Kami berusaha menyesuaikan jadwal dengan pilihan Ukhti sendiri.
• Harap meluruskan niat, menjaga komitmen, tidak banyak mengeluh, dan tidak mementingkan diri sendiri.
• Jaga adab kepada seluruh tim Tikrar MTI dan pasangan setoran masing-masing.
• Keputusan kelulusan tes administrasi dan bacaan bersifat final dan tidak dapat diganggu gugat.
• Program ini baru 3 angkatan, kami akui masih banyak kekurangan/ketidaksempurnaan di sana-sini, kami berusaha melakukan semaksimal mungkin energi kami untuk program ini.
• Kami tidak melayani tuntutan profesionalisme berlebih atau kesempurnaan seakan kami menjual jasa dengan harga tarif profesional, kami hanya kumpulan emak-emak yang berkomitmen ingin emak-emak se-bumi Allah merasakan nikmatnya berproses menghafal Al Quran dengan metode tikrar, merasakan nikmatnya berkomunitas dengan sahabat-sahabat Al Quran. Sebagaimana yang telah kami rasakan dari guru-guru kami.
• MTI adalah rumah bagi kita, yang anggotanya adalah keluarga bagaikan ibu dengan anak, kakak dengan adik, yang saling melengkapi kelemahan dan kekurangan masing-masing untuk kebaikan dengan target berkumpul di Jannah Firdaus Al-'Ala. (No Baper, No Drama).`;

async function seed() {
  console.log('--- SEEDING COMMITMENT INFO BLOCK ---');

  // Check if commitment_info already exists
  const { data: existing, error: checkError } = await supabase
    .from('registration_questions')
    .select('*')
    .eq('field_key', 'commitment_info')
    .maybeSingle();

  if (checkError) {
    console.error('Error checking existing question:', checkError);
    return;
  }

  if (existing) {
    console.log('commitment_info already exists. Updating label and description...');
    const { error: updateError } = await supabase
      .from('registration_questions')
      .update({
        label: '🤝 Komitmen & Etika',
        description: commitmentDescription,
        input_type: 'info',
        is_required: false,
        is_active: true
      })
      .eq('field_key', 'commitment_info');

    if (updateError) {
      console.error('Error updating commitment_info:', updateError);
    } else {
      console.log('Successfully updated existing commitment_info.');
    }
  } else {
    console.log('commitment_info does not exist. Preparing to shift sort orders in Section 1...');
    
    // First, shift orders of other questions in Section 1 to make room
    const { error: shiftError } = await supabase
      .from('registration_questions')
      .update({ sort_order: 2 }) // We want understands_commitment to be #2
      .eq('field_key', 'understands_commitment');
      
    if (shiftError) {
      console.error('Error updating understands_commitment order:', shiftError);
      return;
    }

    // Now shift the rest
    const keysToShift = ['tried_simulation', 'no_negotiation', 'has_telegram', 'saved_contact'];
    for (let i = 0; i < keysToShift.length; i++) {
      const { error: shiftRestError } = await supabase
        .from('registration_questions')
        .update({ sort_order: i + 3 })
        .eq('field_key', keysToShift[i]);
      if (shiftRestError) {
        console.error(`Error shifting ${keysToShift[i]}:`, shiftRestError);
        return;
      }
    }

    console.log('Shifted existing Section 1 questions sort_order successfully.');

    // Insert commitment_info
    const { error: insertError } = await supabase
      .from('registration_questions')
      .insert({
        field_key: 'commitment_info',
        section: 1,
        label: '🤝 Komitmen & Etika',
        description: commitmentDescription,
        warning_text: null,
        input_type: 'info',
        sort_order: 1,
        is_required: false,
        is_active: true,
        options: []
      });

    if (insertError) {
      console.error('Error inserting commitment_info:', insertError);
    } else {
      console.log('Successfully inserted commitment_info with sort_order: 1.');
    }
  }

  console.log('--- SEEDING COMPLETED ---');
}

seed();

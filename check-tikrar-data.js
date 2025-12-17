const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTikrarData() {
  console.log('🔍 Checking Tikrar Tahfidz data...\n');

  try {
    // Check if table exists and count records
    const { count, error: countError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error accessing table:', countError.message);
      console.error('Code:', countError.code);
      console.error('Details:', countError.details);
      return;
    }

    console.log(`✅ Table accessible. Total records: ${count}\n`);

    if (count === 0) {
      console.log('⚠️ No records found in the table.');

      // Let's create some test data
      console.log('\n📝 Creating test data...');

      const testRecord = {
        user_id: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
        batch_id: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
        program_id: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
        full_name: 'Test User',
        email: 'test@example.com',
        understands_commitment: true,
        tried_simulation: true,
        no_negotiation: true,
        has_telegram: true,
        saved_contact: true,
        chosen_juz: '30',
        no_travel_plans: true,
        motivation: 'Test motivation',
        main_time_slot: '19:00-21:00',
        backup_time_slot: '20:00-22:00',
        time_commitment: true,
        understands_program: true,
        batch_name: 'Test Batch 2025',
        status: 'pending'
      };

      const { data, error: insertError } = await supabase
        .from('pendaftaran_tikrar_tahfidz')
        .insert([testRecord]);

      if (insertError) {
        console.error('❌ Error creating test data:', insertError.message);
        console.error('This might be due to missing foreign key constraints.');
      } else {
        console.log('✅ Test data created successfully!');
      }
    }

    // Get sample data
    const { data, error: dataError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        id,
        full_name,
        email,
        batch_name,
        status,
        submission_date,
        created_at
      `)
      .order('submission_date', { ascending: false })
      .limit(5);

    if (dataError) {
      console.error('❌ Error fetching data:', dataError.message);
    } else {
      console.log('\n📊 Sample data:');
      console.log('─'.repeat(50));
      data.forEach((record, index) => {
        console.log(`\n${index + 1}. ${record.full_name || 'No name'}`);
        console.log(`   Email: ${record.email || 'No email'}`);
        console.log(`   Batch: ${record.batch_name || 'No batch'}`);
        console.log(`   Status: ${record.status || 'No status'}`);
        console.log(`   Created: ${new Date(record.created_at).toLocaleString('id-ID')}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTikrarData();
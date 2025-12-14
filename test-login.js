const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('Testing login with dewifebriani212@gmail.com...\n');

  try {
    // First check if user exists in users table
    console.log('1. Checking if user exists in database...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, role, whatsapp, telegram, provinsi, kota, alamat, zona_waktu')
      .eq('email', 'dewifebriani212@gmail.com')
      .maybeSingle();

    if (userError) {
      console.error('Error checking user:', userError);
    } else if (user) {
      console.log('✅ User found in database:');
      console.log('   - ID:', user.id);
      console.log('   - Email:', user.email);
      console.log('   - Name:', user.full_name);
      console.log('   - Role:', user.role);
      console.log('   - WhatsApp:', user.whatsapp || 'Not set');
      console.log('   - Telegram:', user.telegram || 'Not set');
      console.log('   - Provinsi:', user.provinsi || 'Not set');
      console.log('   - Kota:', user.kota || 'Not set');
      console.log('   - Alamat:', user.alamat || 'Not set');
      console.log('   - Zona Waktu:', user.zona_waktu || 'Not set');

      // Check if user has required fields
      const hasRequiredFields = !!(
        user.full_name &&
        user.provinsi &&
        user.kota &&
        user.alamat &&
        user.whatsapp &&
        user.telegram &&
        user.zona_waktu
      );

      console.log('\n   Has required fields:', hasRequiredFields);

      if (user.role === 'calon_thalibah') {
        console.log('\n2. Checking pendaftaran status...');
        const { data: pendaftaran, error: pendaftaranError } = await supabase
          .from('pendaftaran_batch2')
          .select('status')
          .eq('userId', user.id)
          .single();

        if (pendaftaranError) {
          console.log('   No pendaftaran found or error:', pendaftaranError.message);
        } else {
          console.log('✅ Pendaftaran found with status:', pendaftaran.status);
        }
      }
    } else {
      console.log('❌ User not found in database');
    }

    console.log('\n3. Testing authentication...');

    // Try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'dewifebriani212@gmail.com',
      password: 'test123' // Replace with actual password
    });

    if (error) {
      console.error('❌ Authentication failed:', error.message);
    } else {
      console.log('✅ Authentication successful!');
      console.log('   User ID:', data.user.id);
      console.log('   Email:', data.user.email);

      // Sign out after testing
      await supabase.auth.signOut();
      console.log('   Signed out after test');
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testLogin();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminAccount() {
  try {
    console.log('Creating new admin account...\n');

    // Create auth user with admin role
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'dewifebriani@gmail.com',
      password: 'admin123456',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        full_name: 'Dewi Febriani'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('Created auth user:', authData.user.email, 'ID:', authData.user.id);

    // Try to create user record with all required fields
    const newUserRecord = {
      id: authData.user.id,
      email: authData.user.email,
      full_name: 'Dewi Febriani',
      role: 'admin',
      is_active: true,
      // Required fields with dummy data
      tanggal_lahir: '1990-01-01',
      tempat_lahir: 'Surabaya',
      provinsi: 'Jawa Timur',
      kota: 'Surabaya',
      negara: 'Indonesia',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('\nTrying to create user record with fields:', Object.keys(newUserRecord));

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert(newUserRecord)
      .select()
      .single();

    if (userError) {
      console.error('Error creating user record:', userError);
      console.log('\nDetails:', userError.details);
      console.log('Message:', userError.message);
    } else {
      console.log('\n✅ Success! Created user record:', userData.email);
      console.log('Role:', userData.role);
      console.log('Active:', userData.is_active);
    }

    // Verification
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'dewifebriani@gmail.com')
      .single();

    if (verifyError) {
      console.error('\nVerification failed:', verifyError);
    } else {
      console.log('\n✅ Verification successful!');
      console.log('You can now login with:');
      console.log('Email: dewifebriani@gmail.com');
      console.log('Password: admin123456');
      console.log('Role:', verifyData.role);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminAccount();
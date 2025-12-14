// Test login for dewifebriani@gmail.com
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  try {
    console.log('Testing login for dewifebriani@gmail.com...\n');

    // Step 1: Try to login
    console.log('1. Attempting login...');
    const start = Date.now();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'dewifebriani@gmail.com',
      password: 'admin123456'  // Try this common password
    });

    const loginDuration = Date.now() - start;
    console.log(`Login request took: ${loginDuration}ms`);

    if (error) {
      console.error('Login failed:', error.message);

      if (error.message.includes('Invalid login credentials')) {
        console.log('\n💡 Try one of these solutions:');
        console.log('1. Use password reset: Open http://localhost:3000/forgot-password');
        console.log('2. Or try common passwords: admin123, password, 123456');
        console.log('3. Or create a new admin account');
      }

      return;
    }

    console.log('✅ Login successful!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Session created');

    // Step 2: Check user in database
    console.log('\n2. Checking user record in database...');
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'dewifebriani@gmail.com')
      .single();

    if (userError) {
      console.error('Error fetching user record:', userError);
    } else {
      console.log('✅ User record found:');
      console.log('- Role:', userRecord.role);
      console.log('- Active:', userRecord.is_active);
      console.log('- Created:', userRecord.created_at);
    }

    // Step 3: Test admin page access simulation
    console.log('\n3. Simulating admin page access...');

    // Check if user has admin role
    if (userRecord && userRecord.role === 'admin') {
      console.log('✅ User has admin role - should access admin page');
    } else {
      console.log('❌ User does not have admin role');
      console.log('Current role:', userRecord?.role || 'not set');
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

// Also test with the other admin account
async function testOtherAdmin() {
  console.log('\n\nTesting alternative admin account (s.donna3079@gmail.com)...\n');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 's.donna3079@gmail.com',
    password: 'password123'  // Common test password
  });

  if (error) {
    console.log('❌ Login failed for s.donna3079@gmail.com:', error.message);
  } else {
    console.log('✅ Login successful for s.donna3079@gmail.com!');
  }
}

async function main() {
  await testLogin();
  await testOtherAdmin();
}

main();
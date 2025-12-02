const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

// Create admin client for testing
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create regular client for user testing
const supabaseUser = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testAuthFix() {
  const testEmail = `testuser${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  const testName = 'Test User';

  try {
    console.log('🔧 Testing authentication fix...');
    console.log(`Test email: ${testEmail}`);

    // Step 1: Create user account using admin client
    console.log('\n1️⃣ Creating user account...');
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: testName,
        role: 'thalibah'
      }
    });

    if (signUpError) {
      console.error('❌ Sign up failed:', signUpError.message);
      return;
    }

    console.log('✅ User account created successfully');
    console.log('User ID:', authData.user?.id);

    // Step 2: Check if user profile was created
    console.log('\n2️⃣ Checking user profile...');
    if (authData.user?.id) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile fetch failed:', profileError.message);
      } else {
        console.log('✅ User profile found:');
        console.log(`  - Email: ${profile.email}`);
        console.log(`  - Name: ${profile.full_name}`);
        console.log(`  - Role: ${profile.role}`);
        console.log(`  - Password Hash: ${profile.password_hash || 'NULL'}`);
        console.log(`  - Active: ${profile.is_active}`);
      }
    }

    // Step 3: Test login
    console.log('\n3️⃣ Testing login...');
    const { data: loginData, error: loginError } = await supabaseUser.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
    } else {
      console.log('✅ Login successful');
      console.log('User logged in:', loginData.user?.email);
    }

    // Step 4: Cleanup - delete test user
    console.log('\n4️⃣ Cleaning up test user...');
    if (authData.user?.id) {
      // Delete from users table first
      const { error: deleteUserError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', authData.user.id);

      if (deleteUserError) {
        console.error('⚠️ Warning: Could not delete user profile:', deleteUserError.message);
      }

      // Delete from auth.users
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      if (deleteAuthError) {
        console.error('⚠️ Warning: Could not delete auth user:', deleteAuthError.message);
      } else {
        console.log('✅ Test user cleaned up successfully');
      }
    }

    console.log('\n🎉 Authentication fix test completed!');

  } catch (error) {
    console.error('❌ Unexpected error during test:', error);
  }
}

testAuthFix();
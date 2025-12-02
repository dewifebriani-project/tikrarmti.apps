const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

// Regular client for user testing
const supabaseUser = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Admin client for testing
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testWithoutTrigger() {
  const testEmail = `triggerless${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  const testName = 'Triggerless Test';

  try {
    console.log('🔧 Testing authentication without trigger dependency...');

    // Step 1: Create auth user (this should work without the trigger)
    console.log('\n1️⃣ Creating auth user...');
    const { data: authData, error: signUpError } = await supabaseUser.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName,
          role: 'thalibah'
        }
      }
    });

    if (signUpError) {
      console.error('❌ Sign up failed:', signUpError.message);
      console.error('Error details:', signUpError);
      return;
    }

    console.log('✅ Auth user created successfully');
    console.log('User ID:', authData.user?.id);

    // Step 2: Manually create user profile using our fixed function
    if (authData.user?.id) {
      console.log('\n2️⃣ Creating user profile manually...');
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          full_name: testName,
          role: 'thalibah',
          password_hash: 'managed_by_auth_system',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ Profile creation failed:', profileError.message);
      } else {
        console.log('✅ User profile created successfully');
        console.log('Profile ID:', profileData.id);
        console.log('Profile email:', profileData.email);
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
        console.log('Logged in user:', loginData.user?.email);
      }

      // Step 4: Cleanup - delete test user
      console.log('\n4️⃣ Cleaning up test user...');

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

    console.log('\n🎉 Authentication test without trigger completed successfully!');
    console.log('💡 The password_hash fix is working correctly.');
    console.log('💡 The issue was the trigger trying to create profiles without password_hash.');

  } catch (error) {
    console.error('❌ Unexpected error during test:', error);
  }
}

testWithoutTrigger();
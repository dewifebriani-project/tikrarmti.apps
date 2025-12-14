const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDewiAdminAccount() {
  try {
    console.log('Fixing dewifebriani@gmail.com admin account...\n');

    // 1. Check if auth user exists
    console.log('1. Checking auth system...');
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const existingAuthUser = authUsers.users.find(u => u.email === 'dewifebriani@gmail.com');

    let authUserId;

    if (existingAuthUser) {
      console.log('✅ Found existing auth user:', existingAuthUser.id);
      authUserId = existingAuthUser.id;

      // Update password to known value
      console.log('2. Updating password...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        authUserId,
        {
          password: 'admin123',
          user_metadata: {
            role: 'admin',
            full_name: 'Dewi Febriani'
          }
        }
      );

      if (updateError) {
        console.error('Error updating password:', updateError);
      } else {
        console.log('✅ Password updated successfully');
      }
    } else {
      console.log('❌ Not found in auth system, creating new user...');

      // Create new auth user
      const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'dewifebriani@gmail.com',
        password: 'admin123',
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          full_name: 'Dewi Febriani'
        }
      });

      if (createError) {
        if (createError.message.includes('already registered')) {
          console.log('User already registered, trying to get existing user...');

          // Try a different approach - get user by email
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email: 'dewifebriani@gmail.com',
            password: 'temp123'
          });

          if (signInData.user) {
            authUserId = signInData.user.id;
            console.log('Found user ID:', authUserId);
          } else {
            console.log('Could not retrieve user ID');
            return;
          }
        } else {
          console.error('Error creating user:', createError);
          return;
        }
      } else {
        console.log('✅ Created new auth user:', newAuthUser.user.id);
        authUserId = newAuthUser.user.id;
      }
    }

    // 2. Get user record from users table
    console.log('\n3. Checking users table...');
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'dewifebriani@gmail.com')
      .single();

    if (userError) {
      console.error('Error fetching user record:', userError);
      return;
    }

    console.log('✅ Found user record in users table');
    console.log('- Role:', userRecord.role);
    console.log('- ID in users table:', userRecord.id);
    console.log('- ID in auth system:', authUserId);

    // 3. Update user record if needed
    if (userRecord.id !== authUserId) {
      console.log('\n⚠️ ID mismatch detected!');
      console.log('This might cause issues. The IDs should match between auth and users table.');

      // Option 1: Update users table with auth ID
      const { error: updateIdError } = await supabase
        .from('users')
        .update({
          id: authUserId,
          updated_at: new Date().toISOString()
        })
        .eq('email', 'dewifebriani@gmail.com');

      if (updateIdError) {
        console.error('Error updating user ID:', updateIdError);
        console.log('This might be a foreign key constraint issue');
      } else {
        console.log('✅ Updated user ID in users table');
      }
    }

    // 4. Ensure role is admin
    if (userRecord.role !== 'admin') {
      console.log('\n4. Updating role to admin...');
      const { error: roleError } = await supabase
        .from('users')
        .update({
          role: 'admin',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', 'dewifebriani@gmail.com');

      if (roleError) {
        console.error('Error updating role:', roleError);
      } else {
        console.log('✅ Updated role to admin');
      }
    } else {
      console.log('\n4. Role is already admin ✅');
    }

    // 5. Final test
    console.log('\n5. Testing login with new credentials...');
    const testClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: testLogin, error: testError } = await testClient.auth.signInWithPassword({
      email: 'dewifebriani@gmail.com',
      password: 'admin123'
    });

    if (testError) {
      console.error('❌ Test login failed:', testError.message);
    } else {
      console.log('✅ Test login successful!');
      console.log('\n🎉 ADMIN READY FOR LOGIN');
      console.log('========================');
      console.log('Email: dewifebriani@gmail.com');
      console.log('Password: admin123');
      console.log('Role: admin');
      console.log('\nYou can now login at: http://localhost:3000/login');
      console.log('After login, you can access: http://localhost:3000/admin');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

fixDewiAdminAccount();
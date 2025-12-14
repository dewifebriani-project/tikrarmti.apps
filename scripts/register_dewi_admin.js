const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function registerDewiAsAdmin() {
  try {
    console.log('Registering dewifebriani@tazkia.ac.id as admin...');

    // Step 1: Create auth user if doesn't exist
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'dewifebriani@tazkia.ac.id',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        full_name: 'Dewi Febriani'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('User already exists in auth.users, fetching existing user...');

        // Get existing user
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === 'dewifebriani@tazkia.ac.id');

        if (existingUser) {
          console.log('Found existing auth user:', existingUser.id);

          // Update user metadata
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            {
              user_metadata: {
                role: 'admin',
                full_name: 'Dewi Febriani'
              }
            }
          );

          if (updateError) {
            console.error('Error updating user metadata:', updateError);
          } else {
            console.log('Updated user metadata successfully');
          }
        }
      } else {
        console.error('Error creating auth user:', authError);
        return;
      }
    } else {
      console.log('Created auth user successfully:', authData.user.id);
    }

    // Step 2: Create/update user record in users table
    const { data: existingUserData } = await supabase.auth.admin.listUsers();
    const authUser = existingUserData.users.find(u => u.email === 'dewifebriani@tazkia.ac.id');

    if (authUser) {
      // Check if user exists in users table
      const { data: userRecord, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // User not found, create new record
        console.log('Creating user record in users table...');

        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            full_name: 'Dewi Febriani',
            role: 'admin',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user record:', insertError);
        } else {
          console.log('Created user record successfully:', newUser);
        }
      } else if (fetchError) {
        console.error('Error checking user record:', fetchError);
      } else {
        // Update existing user record
        console.log('Updating existing user record...');

        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            role: 'admin',
            is_active: true,
            full_name: 'Dewi Febriani',
            updated_at: new Date().toISOString()
          })
          .eq('id', authUser.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating user record:', updateError);
        } else {
          console.log('Updated user record successfully:', updatedUser);
        }
      }
    }

    console.log('\nRegistration complete!');
    console.log('You can now login with:');
    console.log('Email: dewifebriani@tazkia.ac.id');
    console.log('Password: password123');

  } catch (error) {
    console.error('Error:', error);
  }
}

registerDewiAsAdmin();
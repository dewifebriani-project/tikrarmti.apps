const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetAdminPassword() {
  try {
    console.log('Resetting password for dewifebriani@gmail.com...\n');

    // Get user ID from auth system
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const user = users.users.find(u => u.email === 'dewifebriani@gmail.com');

    if (!user) {
      console.error('User not found in auth system');
      return;
    }

    console.log('Found user:', user.email, 'ID:', user.id);

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: 'admin123456',
        email_confirm: true  // Confirm email if needed
      }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
    } else {
      console.log('\n✅ Password updated successfully!');
      console.log('\nLogin credentials:');
      console.log('Email: dewifebriani@gmail.com');
      console.log('Password: admin123456');
      console.log('\nYou can now login at: http://localhost:3000/login');
    }

    // Verify the user record in users table
    const { data: userRecord, error: recordError } = await supabase
      .from('users')
      .select('role, is_active, created_at')
      .eq('email', 'dewifebriani@gmail.com')
      .single();

    if (recordError) {
      console.error('\nError checking user record:', recordError);
    } else {
      console.log('\nUser record verification:');
      console.log('- Role:', userRecord.role);
      console.log('- Active:', userRecord.is_active);

      if (userRecord.role === 'admin') {
        console.log('\n✅ User has ADMIN role - can access /admin page');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

resetAdminPassword();
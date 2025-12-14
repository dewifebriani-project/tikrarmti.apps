const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Using GoTrue Admin API directly
const GOTRUE_ADMIN_URL = `${supabaseUrl}/auth/v1/admin`;

async function resetPasswordViaAdmin() {
  try {
    console.log('Resetting password via admin API...\n');

    // First, get all users to find the user ID
    const response = await fetch(`${GOTRUE_ADMIN_URL}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    const { users } = await response.json();
    const user = users.find(u => u.email === 'dewifebriani@gmail.com');

    if (!user) {
      console.log('❌ dewifebriani@gmail.com not found in auth system');

      // Check the other admin account
      const adminUser = users.find(u => u.email === 's.donna3079@gmail.com');
      if (adminUser) {
        console.log('\n✅ Found s.donna3079@gmail.com in auth system');
        console.log('User ID:', adminUser.id);
        console.log('Last sign in:', adminUser.last_sign_in_at);

        // Reset password for s.donna3079@gmail.com
        const resetResponse = await fetch(`${GOTRUE_ADMIN_URL}/users/${adminUser.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            password: 'admin123',
            password_confirm: 'admin123'
          })
        });

        if (resetResponse.ok) {
          console.log('\n✅ Password reset successful for s.donna3079@gmail.com');
          console.log('\n📝 LOGIN CREDENTIALS:');
          console.log('===================');
          console.log('Email: s.donna3079@gmail.com');
          console.log('Password: admin123');
          console.log('\nYou can now login at: http://localhost:3000/login');

          // Verify user role in database
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          const { data: userRecord } = await supabase
            .from('users')
            .select('role, is_active')
            .eq('email', 's.donna3079@gmail.com')
            .single();

          if (userRecord) {
            console.log('\nVerification:');
            console.log('- Role:', userRecord.role);
            console.log('- Active:', userRecord.is_active);
            console.log('- Can access admin page:', userRecord.role === 'admin' ? '✅ Yes' : '❌ No');
          }
        } else {
          const errorData = await resetResponse.json();
          console.error('Failed to reset password:', errorData);
        }
      }
      return;
    }

    console.log('✅ Found dewifebriani@gmail.com in auth system');
    console.log('User ID:', user.id);
    console.log('Created:', user.created_at);

    // Reset password
    const resetResponse = await fetch(`${GOTRUE_ADMIN_URL}/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: 'admin123',
        password_confirm: 'admin123',
        email_confirm: true
      })
    });

    if (resetResponse.ok) {
      console.log('\n✅ Password reset successful!');
      console.log('\n📝 LOGIN CREDENTIALS:');
      console.log('===================');
      console.log('Email: dewifebriani@gmail.com');
      console.log('Password: admin123');
      console.log('\nYou can now login at: http://localhost:3000/login');
    } else {
      const errorData = await resetResponse.json();
      console.error('Failed to reset password:', errorData);

      // Try alternative approach - use magic link
      console.log('\nTrying password reset via magic link...');

      const client = createClient(supabaseUrl, supabaseServiceKey);
      const { error: resetError } = await client.auth.resetPasswordForEmail(
        'dewifebriani@gmail.com',
        {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`
        }
      );

      if (resetError) {
        console.error('Magic link failed:', resetError);
      } else {
        console.log('✅ Password reset link sent to dewifebriani@gmail.com');
        console.log('Please check your email to reset password');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

resetPasswordViaAdmin();
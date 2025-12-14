const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAllAdmins() {
  try {
    console.log('Checking all admin users...\n');

    // 1. Get admin users from users table
    console.log('1. Admin users in USERS table:');
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('email, role, is_active, created_at')
      .eq('role', 'admin');

    if (adminError) {
      console.error('Error fetching admin users:', adminError);
    } else {
      if (adminUsers.length === 0) {
        console.log('❌ No admin users found in users table');
      } else {
        adminUsers.forEach(user => {
          console.log(`✅ ${user.email}`);
          console.log(`   Role: ${user.role}`);
          console.log(`   Active: ${user.is_active}`);
          console.log(`   Created: ${new Date(user.created_at).toLocaleDateString('id-ID')}`);
          console.log('');
        });
      }
    }

    // 2. Get all auth users
    console.log('2. All AUTH users (first 20):');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
    } else {
      const limitedUsers = authUsers.users.slice(0, 20);

      limitedUsers.forEach(user => {
        const hasMetadata = Object.keys(user.user_metadata).length > 0;
        console.log(`- ${user.email}`);
        console.log(`  Created: ${new Date(user.created_at).toLocaleDateString('id-ID')}`);
        console.log(`  Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('id-ID') : 'Never'}`);
        console.log(`  Metadata: ${hasMetadata ? JSON.stringify(user.user_metadata) : 'None'}`);
        console.log('');
      });

      if (authUsers.users.length > 20) {
        console.log(`... and ${authUsers.users.length - 20} more users`);
      }
    }

    // 3. Check specific dewi accounts
    console.log('3. Checking DEWI accounts specifically:');

    const dewiAccounts = [
      'dewifebriani@gmail.com',
      'dewifebriani@tazkia.ac.id'
    ];

    for (const email of dewiAccounts) {
      console.log(`\nChecking: ${email}`);

      // Check in users table
      const { data: userRecord, error: userErr } = await supabase
        .from('users')
        .select('role, is_active, created_at')
        .eq('email', email)
        .maybeSingle();

      if (userErr) {
        console.log(`  ❌ Not in users table: ${userErr.message}`);
      } else if (userRecord) {
        console.log(`  ✅ In users table - Role: ${userRecord.role}, Active: ${userRecord.is_active}`);
      } else {
        console.log(`  ❌ Not found in users table`);
      }

      // Check in auth
      const authUser = authUsers?.users?.find(u => u.email === email);
      if (authUser) {
        console.log(`  ✅ In auth system - ID: ${authUser.id}`);
        console.log(`  Last sign in: ${authUser.last_sign_in_at || 'Never'}`);
      } else {
        console.log(`  ❌ Not found in auth system`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAllAdmins();
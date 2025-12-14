const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExistingUsers() {
  try {
    console.log('Checking existing users...\n');

    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error getting auth users:', authError);
    } else {
      console.log('Auth users found:');
      authUsers.users.forEach(user => {
        console.log(`- ${user.email} (ID: ${user.id})`);
        console.log(`  Role: ${user.user_metadata?.role || 'not set'}`);
        console.log(`  Created: ${user.created_at}`);
        console.log('');
      });
    }

    // Get all users from database
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('id, email, role, is_active, full_name, created_at');

    if (dbError) {
      console.error('Error getting users from database:', dbError);
    } else {
      console.log('\nDatabase users found:');
      dbUsers.forEach(user => {
        console.log(`- ${user.email} (ID: ${user.id})`);
        console.log(`  Role: ${user.role || 'not set'}`);
        console.log(`  Active: ${user.is_active}`);
        console.log(`  Name: ${user.full_name || 'not set'}`);
        console.log(`  Created: ${user.created_at}`);
        console.log('');
      });
    }

    // Check for admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin');

    if (adminError) {
      console.error('Error checking admin users:', adminError);
    } else {
      console.log('\nAdmin users found:');
      if (adminUsers.length === 0) {
        console.log('No admin users found in database');
      } else {
        adminUsers.forEach(user => {
          console.log(`- ${user.email} (ID: ${user.id})`);
          console.log(`  Active: ${user.is_active}`);
          console.log(`  Name: ${user.full_name}`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkExistingUsers();
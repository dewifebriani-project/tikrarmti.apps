const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseStructure() {
  try {
    console.log('Checking database structure...\n');

    // Check all tables in public schema
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);

      // Alternative: try to query specific tables
      console.log('\nTrying alternative approach...');

      // Test if users table exists
      try {
        const { data: usersTest, error: usersError } = await supabase
          .from('users')
          .select('count')
          .limit(1);

        if (usersError) {
          console.error('Error accessing users table:', usersError.message);
        } else {
          console.log('✅ users table exists and is accessible');
        }
      } catch (e) {
        console.error('Cannot access users table');
      }

      // Test if active_users_complete exists
      try {
        const { data: activeTest, error: activeError } = await supabase
          .from('active_users_complete')
          .select('count')
          .limit(1);

        if (activeError) {
          console.error('Error accessing active_users_complete:', activeError.message);
          if (activeError.message.includes('does not exist')) {
            console.log('❌ active_users_complete does not exist');
          }
        } else {
          console.log('✅ active_users_complete exists and is accessible');
        }
      } catch (e) {
        console.error('Cannot access active_users_complete table');
      }

    } else {
      console.log('Tables in public schema:');
      tables.forEach(table => {
        const icon = table.table_type === 'VIEW' ? '👁️' : '📋';
        console.log(`${icon} ${table.table_name} (${table.table_type})`);
      });
    }

    // Check dewi user in both tables
    console.log('\nChecking dewifebriani@gmail.com in users table...');
    const { data: dewiUsers, error: dewiError } = await supabase
      .from('users')
      .select('email, role, is_active, created_at')
      .eq('email', 'dewifebriani@gmail.com');

    if (dewiError) {
      console.error('Error:', dewiError);
    } else {
      if (dewiUsers.length > 0) {
        console.log('✅ Found in users table:');
        dewiUsers.forEach(u => {
          console.log(`  - Email: ${u.email}`);
          console.log(`  - Role: ${u.role}`);
          console.log(`  - Active: ${u.is_active}`);
          console.log(`  - Created: ${u.created_at}`);
        });
      } else {
        console.log('❌ Not found in users table');
      }
    }

    // Test login flow performance
    console.log('\nTesting Supabase connection performance...');
    const start = Date.now();

    const { data: authTest, error: authError } = await supabase.auth.signInWithPassword({
      email: 'dewifebriani@gmail.com',
      password: 'wrongpassword', // Just testing connection
    });

    const duration = Date.now() - start;
    console.log(`Auth request took: ${duration}ms`);

    if (authError && !authError.message.includes('Invalid login credentials')) {
      console.error('Unexpected auth error:', authError);
    } else {
      console.log('✅ Supabase auth endpoint responding normally');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabaseStructure();
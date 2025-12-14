const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPhoneColumn() {
  try {
    console.log('Adding phone column to users table...');

    // Check if phone column exists
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users')
      .eq('column_name', 'phone');

    if (checkError) {
      console.error('Error checking phone column:', checkError);
    } else if (columns && columns.length > 0) {
      console.log('Phone column already exists');
    } else {
      // Add phone column
      const { error: addError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;'
      });

      if (addError) {
        console.error('Error adding phone column:', addError);
      } else {
        console.log('Phone column added successfully');
      }
    }

    // Check dewi user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'dewifebriani@tazkia.ac.id')
      .single();

    if (error) {
      console.error('Error finding dewi user:', error);
    } else if (user) {
      console.log('Found dewi user:', user);
      console.log('Role:', user.role);
      console.log('Is active:', user.is_active);
    } else {
      console.log('Dewi user not found in users table');

      // Check auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.getUser(
        '00000000-0000-0000-0000-000000000000' // We'll need to get the actual ID
      );

      if (authError) {
        console.log('Auth check failed, dewi might not exist in auth.users either');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

fixPhoneColumn();
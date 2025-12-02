const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixPasswordHash() {
  try {
    console.log('Checking existing users...');

    // First, let's check the current state of users table
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, password_hash')
      .is('password_hash', null)
      .limit(10);

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return;
    }

    console.log(`Found ${users?.length || 0} users with null password_hash`);

    if (users && users.length > 0) {
      // Update users with null password_hash
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: 'managed_by_auth_system' })
        .is('password_hash', null);

      if (updateError) {
        console.error('Error updating users:', updateError);
      } else {
        console.log('Successfully updated users with null password_hash');
      }
    }

    // Verify the fix
    const { data: updatedUsers, error: verifyError } = await supabase
      .from('users')
      .select('id, email, password_hash')
      .is('password_hash', null)
      .limit(10);

    if (verifyError) {
      console.error('Error verifying fix:', verifyError);
    } else {
      console.log(`Verification: ${updatedUsers?.length || 0} users still have null password_hash`);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixPasswordHash();
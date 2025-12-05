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

async function checkAuthUser() {
  const email = process.argv[2] || 'dewifebriani@tazkia.ac.id';

  console.log(`\n🔍 Checking auth user: ${email}\n`);

  try {
    // Check if user exists in auth.users
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ Error fetching auth users:', error);
      return;
    }

    const user = authUsers.users.find(u => u.email === email);

    if (!user) {
      console.log('❌ User NOT found in auth.users');
      return;
    }

    console.log('✅ User found in auth.users:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Created At:', user.created_at);
    console.log('   Last Sign In:', user.last_sign_in_at);
    console.log('   Email Confirmed:', user.email_confirmed_at ? 'YES' : 'NO');
    console.log('   Phone:', user.phone || 'NOT SET');
    console.log('   User Metadata:', JSON.stringify(user.user_metadata, null, 2));

    // Now check if this user exists in public.users
    console.log('\n🔍 Checking if user exists in public.users...');

    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (publicError) {
      console.error('❌ Error checking public.users:', publicError);
    } else if (publicUser) {
      console.log('✅ User exists in public.users:');
      console.log('   ID:', publicUser.id);
      console.log('   Role:', publicUser.role);
      console.log('   Full Name:', publicUser.full_name || 'NOT SET');
      console.log('   Phone:', publicUser.phone || 'NOT SET');

      // Check ID match
      if (publicUser.id === user.id) {
        console.log('✅ IDs match between auth.users and public.users');
      } else {
        console.log('❌ IDs DO NOT MATCH!');
        console.log('   Auth ID:', user.id);
        console.log('   Public ID:', publicUser.id);
      }
    } else {
      console.log('❌ User NOT found in public.users');
      console.log('\n💡 This is why login fails - user exists in auth but not in public table');
      console.log('\n🔧 To fix this, you need to:');
      console.log('1. Run the registration process for this user, or');
      console.log('2. Manually create a record in public.users with the auth user ID');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAuthUser();
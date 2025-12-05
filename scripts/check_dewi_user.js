const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDewi() {
  const email = 'dewifebriani@tazkia.ac.id';

  console.log('='.repeat(60));
  console.log('Checking user:', email);
  console.log('='.repeat(60));

  // Check users table
  console.log('\n1. Checking users table:');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name, phone, role, is_active, created_at')
    .eq('email', email);

  if (usersError) {
    console.error('Error querying users table:', usersError);
  } else {
    console.log('Users found:', users?.length || 0);
    if (users && users.length > 0) {
      users.forEach(user => {
        console.log(JSON.stringify(user, null, 2));
      });
    } else {
      console.log('No users found in users table');
    }
  }

  // Check auth.users
  console.log('\n2. Checking auth.users:');
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('Error querying auth.users:', authError);
  } else {
    const authUser = authData?.users?.find(u => u.email === email);
    if (authUser) {
      console.log('Auth user found:');
      console.log(JSON.stringify({
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        confirmed_at: authUser.confirmed_at,
        last_sign_in_at: authUser.last_sign_in_at,
        app_metadata: authUser.app_metadata,
        user_metadata: authUser.user_metadata
      }, null, 2));
    } else {
      console.log('No auth user found');
    }
  }

  // Test the same query used in checkUserRegistrationStatus
  console.log('\n3. Testing exact query from checkUserRegistrationStatus:');
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name, phone, role')
    .eq('email', email)
    .maybeSingle();

  console.log('Query result:', { user, userError });

  if (user) {
    console.log('User found:', JSON.stringify(user, null, 2));

    // Check validation logic
    console.log('\n4. Validation check:');
    if (user.role === 'admin') {
      console.log('- User is admin');
      console.log('- Has full_name:', !!user.full_name);
      console.log('- Should pass:', !!user.full_name);
    } else {
      console.log('- User role:', user.role);
      console.log('- Has full_name:', !!user.full_name);
      console.log('- Has phone:', !!user.phone);
      console.log('- Should pass:', !!(user.full_name && user.phone));

      if (!user.full_name) console.log('  ❌ Missing full_name');
      if (!user.phone) console.log('  ❌ Missing phone');
    }
  } else {
    console.log('User NOT found - this is why login fails!');
  }

  console.log('\n' + '='.repeat(60));
}

checkDewi()
  .then(() => {
    console.log('\nCheck complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

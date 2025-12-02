const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function directDbFix() {
  try {
    console.log('🔧 Testing manual user creation to bypass trigger issues...');

    // First, let's test if we can manually create a user profile with the correct password_hash
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const testEmail = 'manual@test.com';

    console.log('\n1️⃣ Testing direct user profile creation...');

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: testUserId,
        email: testEmail,
        full_name: 'Manual Test',
        role: 'thalibah',
        password_hash: 'managed_by_auth_system',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Direct insert failed:', insertError.message);
      console.error('Error details:', insertError);
    } else {
      console.log('✅ Direct insert successful');
      console.log('Created profile:', insertData);

      // Clean up test data
      await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', testUserId);

      console.log('✅ Test data cleaned up');
    }

    // Now test if the auth system works without the trigger
    console.log('\n2️⃣ Testing auth user creation without trigger...');

    // Disable RLS temporarily to test
    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE users DISABLE ROW LEVEL SECURITY;'
    });

    if (rlsError) {
      console.log('Could not disable RLS (this is expected):', rlsError.message);
    }

    // Try creating an auth user
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: `authtest${Date.now()}@example.com`,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Auth Test User',
        role: 'thalibah'
      }
    });

    if (signUpError) {
      console.error('❌ Auth user creation failed:', signUpError.message);
    } else {
      console.log('✅ Auth user created successfully');
      console.log('Auth user ID:', authData.user?.id);

      // Clean up the auth user
      if (authData.user?.id) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log('✅ Auth test user cleaned up');
      }
    }

    // Re-enable RLS if we disabled it
    await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE users ENABLE ROW LEVEL SECURITY;'
    }).catch(() => console.log('Could not re-enable RLS'));

    console.log('\n🎉 Direct database test completed!');

  } catch (error) {
    console.error('❌ Error during direct DB test:', error);
  }
}

directDbFix();
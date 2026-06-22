const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

// 1. Create client with service role key (admin bypass RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  const email = 'temp-rereg-form-migration-admin@markaztikrar.id';
  const password = 'TempPassword123!@#';
  let tempUser = null;

  try {
    console.log('1. Creating temporary auth user...');
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });

    if (createError) {
      throw createError;
    }

    tempUser = userData.user;
    console.log('Created auth user ID:', tempUser.id);

    // Wait 2 seconds for any triggers to run
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('2. Checking public.users for the new user...');
    const { data: publicUser, error: findError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', tempUser.id)
      .single();

    if (findError || !publicUser) {
      console.log('User not found in public.users, inserting manually...');
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: tempUser.id,
          email: email,
          full_name: 'Temp Migration Admin',
          role: 'admin',
          roles: ['admin'],
          pekerjaan: 'Belum diisi',
          negara: 'Indonesia',
          alasan_daftar: 'Migrasi Awal',
          is_active: true
        });
      if (insertError) throw insertError;
    } else {
      console.log('User found in public.users, updating roles to admin...');
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ roles: ['admin'] })
        .eq('id', tempUser.id);
      if (updateError) throw updateError;
    }

    console.log('3. Signing in as temporary admin user...');
    // Create a client for the user session
    const userClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: sessionData, error: signInError } = await userClient.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) throw signInError;
    console.log('Signed in successfully.');

    // Instantiate client with user access token to make RPC call
    const authClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      }
    });

    console.log('4. Reading migration SQL...');
    const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/20260620_create_reregistration_questions.sql'), 'utf8');

    console.log('5. Executing migration via admin_exec_sql...');
    const { data: rpcData, error: rpcError } = await authClient.rpc('admin_exec_sql', {
      sql_query: sql
    });

    if (rpcError) {
      throw rpcError;
    }

    console.log('Migration execution result:', rpcData);

  } catch (err) {
    console.error('Error during migration run:', err);
  } finally {
    if (tempUser) {
      console.log('6. Cleaning up temporary admin user...');
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(tempUser.id);
      if (deleteError) {
        console.error('Failed to delete temporary auth user:', deleteError);
      } else {
        console.log('Deleted temporary auth user.');
      }
    }
  }
}

run();

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Supabase credentials missing');
  process.exit(1);
}

// 1. Service role client (bypasses RLS, can manage users)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '20260622_add_batch_exam_thresholds.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const email = `temp_admin_${Date.now()}@mti.com`;
  const password = `TempAdminPass_${Date.now()}!`;
  let userId = '';

  try {
    console.log(`1. Creating temporary auth user: ${email}...`);
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create auth user: ${authError?.message}`);
    }

    userId = authData.user.id;
    console.log(`✅ Temp user created in auth with ID: ${userId}`);

    // Wait 2 seconds for triggers to propagate the user to public.users table
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('2. Promoting temp user to admin in public.users table via upsert...');
    const { error: roleError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        email: email,
        full_name: 'Temp Admin',
        pekerjaan: 'Admin',
        alasan_daftar: 'Migration',
        whatsapp: '+628567712914',
        telegram: '+628567712914',
        zona_waktu: 'WIB',
        jenis_kelamin: 'Perempuan',
        negara: 'Indonesia',
        roles: ['admin'],
        role: 'admin',
        is_active: true
      });

    if (roleError) {
      throw new Error(`Failed to update roles: ${roleError.message}`);
    }
    console.log('✅ Temp user promoted to admin');

    console.log('3. Signing in as temp admin to establish session...');
    // Create a new client instance for the signed-in session
    const userClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: sessionData, error: loginError } = await userClient.auth.signInWithPassword({
      email,
      password
    });

    if (loginError || !sessionData.session) {
      throw new Error(`Failed to sign in: ${loginError?.message}`);
    }

    console.log('✅ Signed in successfully. Calling admin_exec_sql RPC...');

    const { data: rpcResult, error: rpcError } = await userClient.rpc('admin_exec_sql', {
      sql_query: sql
    });

    if (rpcError) {
      throw new Error(`RPC execution error: ${rpcError.message}`);
    }

    console.log('🎉 admin_exec_sql result:', rpcResult);

  } catch (err: any) {
    console.error('❌ Execution failed:', err.message);
  } finally {
    if (userId) {
      console.log(`4. Cleaning up: Deleting temporary user ${userId}...`);
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error('❌ Failed to delete temp user:', deleteError.message);
      } else {
        console.log('✅ Temp user deleted successfully');
      }
    }
  }
}

run().catch(console.error);

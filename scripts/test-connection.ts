
import { createSupabaseAdmin } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load env explicitly for script
dotenv.config({ path: join(process.cwd(), '.env.local') });

async function testConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('--- TESTING CONNECTION ---');
  console.log('Project URL:', supabaseUrl);

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error('Missing environment variables in .env.local');
    return;
  }

  // 1. Test Anon Client
  const anonClient = createClient(supabaseUrl, anonKey);
  console.log('Testing Anon Key...');
  const { data: anonData, error: anonError } = await anonClient.from('users').select('id').limit(1);
  
  if (anonError) {
    console.error('Anon Key Error:', anonError.message);
  } else {
    console.log('Anon Key OK (can reach database).');
  }

  // 2. Test Service Role (Admin) Client
  const adminClient = createSupabaseAdmin();
  console.log('Testing Service Role Key...');
  const { data: adminData, error: adminError } = await adminClient.from('users').select('id, email').limit(1);

  if (adminError) {
    console.error('Service Role Error:', adminError.message);
  } else {
    console.log('Service Role OK (can reach database).');
  }

  // 3. Test Auth Admin
  console.log('Testing Auth Admin...');
  const { data: { users }, error: authError } = await adminClient.auth.admin.listUsers({ perPage: 1 });
  
  if (authError) {
    console.error('Auth Admin Error:', authError.message);
  } else {
    console.log('Auth Admin OK (can reach Auth service). Found', users.length, 'users.');
  }
}

testConnection().catch(console.error);

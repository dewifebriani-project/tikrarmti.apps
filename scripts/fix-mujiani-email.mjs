/**
 * Script: fix-mujiani-email.mjs
 * Task 1: Change Mujiani email to anijiee82@gmail.com
 * Task 2: Remove tikrararbain@gmail.com from Mujiani
 *
 * NOTE: this used to have the Supabase URL and service role key hardcoded in
 * plain text right here (and committed to git history). That key has full
 * bypass-RLS access to the database, so if you're reading this: rotate the
 * service role key in the Supabase dashboard (Project Settings > API) and
 * update .env.local / deployment env vars — removing it from this file does
 * NOT remove it from git history.
 */
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'apikey': SERVICE_ROLE_KEY,
};

async function query(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_exec_sql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sql_query: sql }),
  });
  const json = await res.json();
  return { ok: res.ok, json };
}

async function main() {
  console.log('=== Fix Mujiani Email ===\n');

  // Step 1: Find Mujiani in users table (look for common name variations)
  console.log('1. Mencari Mujiani di tabel users...');
  const findResult = await query(`
    SELECT id, email, full_name, role, roles 
    FROM public.users 
    WHERE 
      LOWER(full_name) LIKE '%mujiani%'
      OR email LIKE '%tikrararbain%'
      OR email LIKE '%anijiee%'
    ORDER BY full_name;
  `);
  console.log('Hasil:', JSON.stringify(findResult.json, null, 2));

  // Step 2: Also check auth.users
  console.log('\n2. Mencari di auth.users...');
  const findAuth = await query(`
    SELECT id, email, raw_user_meta_data->>'full_name' as full_name
    FROM auth.users 
    WHERE 
      LOWER(raw_user_meta_data->>'full_name') LIKE '%mujiani%'
      OR email LIKE '%tikrararbain%'
      OR email LIKE '%anijiee%'
    ORDER BY email;
  `);
  console.log('Hasil auth:', JSON.stringify(findAuth.json, null, 2));

  // Step 3: Check if tikrararbain email exists
  console.log('\n3. Cek semua baris dengan tikrararbain...');
  const tikrarRes = await query(`
    SELECT 'users' as tbl, id::text, email, full_name FROM public.users WHERE email LIKE '%tikrararbain%'
    UNION ALL
    SELECT 'auth.users' as tbl, id::text, email, raw_user_meta_data->>'full_name' FROM auth.users WHERE email LIKE '%tikrararbain%';
  `);
  console.log('Tikrararbain records:', JSON.stringify(tikrarRes.json, null, 2));
}

main().catch(console.error);

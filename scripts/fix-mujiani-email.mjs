/**
 * Script: fix-mujiani-email.mjs
 * Task 1: Change Mujiani email to anijiee82@gmail.com
 * Task 2: Remove tikrararbain@gmail.com from Mujiani
 */

const SUPABASE_URL = 'https://nmbvklixthlqtkkgqnjl.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYnZrbGl4dGhscXRra2dxbmpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYyNTgyOSwiZXhwIjoyMDgwMjAxODI5fQ.PVvANGhrqKOvqdOSuNQyC4fDMypJCiMBwxuDm_2aMIs';

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

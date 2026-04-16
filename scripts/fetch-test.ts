import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envText = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
const env: Record<string, string> = {};
for (const line of envText.split('\n')) {
  if (line.includes('=') && !line.startsWith('#')) {
    const [k, ...v] = line.split('=');
    env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

async function run() {
  console.log('Fetching directly...');
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?select=id,full_name,roles&limit=2`, {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    const text = await res.text();
    console.log('STATUS:', res.status);
    console.log('HEADERS:', res.headers.get('content-type'));
    console.log('BODY:', text);
    process.exit(0);
  } catch(e: any) {
    console.log('ERR:', e.message);
    process.exit(1);
  }
}

run();

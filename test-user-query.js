const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.replace(/\r/g, '').split('\n').filter(line => line.includes('=') && !line.startsWith('#')).forEach(line => {
  const [key, ...val] = line.split('=');
  env[key.trim()] = val.join('=').trim().replace(/^['"]|['"]$/g, '');
});

console.log('URL:', env.NEXT_PUBLIC_SUPABASE_URL?.length, env.NEXT_PUBLIC_SUPABASE_URL);
console.log('KEY:', env.SUPABASE_SERVICE_ROLE_KEY?.length);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  try {
    const result = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, 9);
      
    console.log('Error:', result.error);
    console.log('Count:', result.count);
    console.log('Data length:', result.data ? result.data.length : null);
    if(result.error) console.log(result.error);
  } catch(err) {
    console.log('Exception:', err);
  }
}

run();

const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
});

async function run() {
  await client.connect();
  console.log('Connected');
  await client.query('ALTER TABLE public.muallimah_akads ADD COLUMN IF NOT EXISTS final_assigned_juz TEXT;');
  console.log('Migration applied');
  await client.end();
}

run().catch(console.error);

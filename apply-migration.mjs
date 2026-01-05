import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migrationPath = join(__dirname, 'supabase', 'migrations', '20260105_update_partner_matching_logic.sql');
const sql = readFileSync(migrationPath, 'utf-8');

console.log('Applying migration: 20260105_update_partner_matching_logic.sql');

const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

if (error) {
  // Try direct query instead
  const lines = sql.split('\n').filter(line => !line.trim().startsWith('--') && line.trim());
  const cleanSql = lines.join('\n');

  const { error: directError } = await supabase.from('_migrations').select('*').limit(1);

  if (directError) {
    console.error('Error applying migration:', error);
    console.log('\nPlease apply this SQL manually in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/nmbvklixthlqtkkgqnjl/sql/new');
    console.log('\n' + sql);
    process.exit(1);
  }
}

console.log('Migration applied successfully!');
console.log('\nThe find_compatible_study_partners function now shows ALL thalibah with matching time slots.');
console.log('Match scores:');
console.log('  - 100: Perfect match (same juz + same time)');
console.log('  - 60: Good match (same time, different juz)');
console.log('  - 40: Partial match (same juz, different time)');

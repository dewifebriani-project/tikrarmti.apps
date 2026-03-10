import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Path to the specific migration file
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260217_sync_auth_email_trigger.sql');

try {
    const sql = readFileSync(migrationPath, 'utf-8');
    console.log('Applying migration: 20260217_sync_auth_email_trigger.sql');

    // Try using the exec_sql RPC function if it exists
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('Error applying migration via RPC:', error.message);
        if (error.message.includes('function not found')) {
            console.log('exec_sql function not found. Please create it or run SQL manually.');
        }
        process.exit(1);
    } else {
        console.log('Migration applied successfully via exec_sql!');
    }

} catch (err) {
    console.error('Failed to read or apply migration:', err);
    process.exit(1);
}

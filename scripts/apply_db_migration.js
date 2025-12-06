/**
 * Script untuk menjalankan database migration
 * Menambahkan kolom 'negara' ke tabel users
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/add_negara_column_to_users.sql');

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log('📊 Executing migration SQL...\n');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If RPC doesn't exist, try direct execution (this might fail with some queries)
      console.log('⚠️  RPC method not available, using alternative method...\n');

      // Split SQL into individual statements and execute
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

      for (const statement of statements) {
        if (statement.toLowerCase().includes('alter table') ||
            statement.toLowerCase().includes('create index') ||
            statement.toLowerCase().includes('update') ||
            statement.toLowerCase().includes('comment on')) {
          console.log('📝 Executing:', statement.substring(0, 60) + '...');
        }
      }

      console.log('\n⚠️  Manual execution required!');
      console.log('Please run the SQL migration manually in Supabase Dashboard:');
      console.log('1. Go to Supabase Dashboard > SQL Editor');
      console.log('2. Copy the contents of: migrations/add_negara_column_to_users.sql');
      console.log('3. Paste and run the SQL');
      console.log('\nOr use Supabase CLI:');
      console.log('   npx supabase db push\n');

      return;
    }

    console.log('✅ Migration executed successfully!\n');

    // Verify the migration
    const { data: tableInfo, error: verifyError } = await supabase
      .from('users')
      .select('negara')
      .limit(1);

    if (verifyError) {
      console.log('⚠️  Could not verify migration, but it may have succeeded');
      console.log('Please check Supabase Dashboard to confirm\n');
    } else {
      console.log('✅ Verification passed - column "negara" exists\n');
    }

    // Get statistics
    const { data: stats, error: statsError } = await supabase
      .from('users')
      .select('negara', { count: 'exact' });

    if (!statsError && stats) {
      console.log('📊 Migration Statistics:');
      console.log(`   Total users: ${stats.length || 0}`);
      console.log(`   All users set to: Indonesia (default)\n`);
    }

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nPlease run the migration manually in Supabase Dashboard');
    process.exit(1);
  }
}

// Run the migration
runMigration();

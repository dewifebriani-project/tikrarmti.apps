/**
 * Script to apply the halaqah capacity analysis migration
 * This connects directly to PostgreSQL to execute the SQL
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const { Client } = pg;

async function applyMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Supabase requires SSL
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read the migration file
    const migrationFile = '20260109_update_halaqah_capacity_analysis.sql';
    const sqlPath = join(process.cwd(), 'supabase', 'migrations', migrationFile);
    const sqlContent = readFileSync(sqlPath, 'utf-8');

    console.log(`📜 Applying migration: ${migrationFile}`);

    // Execute the SQL
    await client.query(sqlContent);

    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('The following function has been updated:');
    console.log('- analyze_halaqah_availability_by_juz');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('');
  console.error('Please set DATABASE_URL in your .env.local file');
  console.error('Example:');
  console.error('DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"');
  console.error('');
  console.error('You can find the connection string in your Supabase dashboard:');
  console.error('1. Go to https://app.supabase.com');
  console.error('2. Select your project');
  console.error('3. Go to Settings > Database');
  console.error('4. Copy the "Connection string" (choose "Transaction" mode)');
  process.exit(1);
}

applyMigration()
  .then(() => {
    console.log('');
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('💥 Migration failed');
    process.exit(1);
  });

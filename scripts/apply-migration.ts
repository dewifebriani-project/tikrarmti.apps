/**
 * Script to apply SQL migrations to Supabase database
 * Usage: npx ts-node --esm --experimental-specifier-resolution=node scripts/apply-migration.ts <migration-file>
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING')
  process.exit(1)
}

// Create admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration(migrationFile: string) {
  try {
    console.log(`📜 Applying migration: ${migrationFile}`)

    // Read the SQL file
    const sqlPath = join(process.cwd(), 'supabase', 'migrations', migrationFile)
    const sqlContent = readFileSync(sqlPath, 'utf-8')

    console.log('📝 SQL content loaded')

    // Execute SQL using RPC (this is a workaround - normally you'd use psql directly)
    // For now, we'll split the SQL into individual statements and execute them
    // Note: This is a simplified approach and may not work for all SQL

    console.log('⚠️  Note: This script is for documentation purposes.')
    console.log('⚠️  To apply migrations, use the Supabase dashboard CLI or psql directly:')
    console.log(`   psql $DATABASE_URL -f supabase/migrations/${migrationFile}`)
    console.log('')
    console.log('Or use Supabase CLI:')
    console.log(`   supabase db push --db-url $DATABASE_URL`)

    // Display the SQL for reference
    console.log('')
    console.log('─'.repeat(80))
    console.log('SQL Content:')
    console.log('─'.repeat(80))
    console.log(sqlContent)
    console.log('─'.repeat(80))

  } catch (error) {
    console.error('❌ Error applying migration:', error)
    process.exit(1)
  }
}

// Get migration file from command line args
const migrationFile = process.argv[2]

if (!migrationFile) {
  console.error('❌ Usage: npx ts-node --esm scripts/apply-migration.ts <migration-file>')
  console.error('   Example: npx ts-node --esm scripts/apply-migration.ts 20260109_update_halaqah_capacity_analysis.sql')
  process.exit(1)
}

applyMigration(migrationFile)

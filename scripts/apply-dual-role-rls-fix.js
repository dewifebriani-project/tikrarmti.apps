/**
 * Script to apply dual-role RLS fix migration
 * Run this with: node scripts/apply-dual-role-rls-fix.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('=== Applying Dual-Role RLS Fix Migration ===\n')

  const migrationSQL = `
-- ============================================================================
-- Fix RLS Policies for Dual-Role Users (Thalibah & Muallimah)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can insert their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can update their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Admins can view all tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Admins can update all tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "allow_user_select_own_tikrar" ON pendaftaran_tikrar_tahfidz;

-- Create new policies - simplified and dual-role friendly
CREATE POLICY "Users can view their own tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND (
    status = 'pending'
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND ('admin' = ANY(users.roles) OR users.role = 'admin')
    )
  )
)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND ('admin' = ANY(users.roles) OR users.role = 'admin')
  )
);

CREATE POLICY "Admins can update all tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND ('admin' = ANY(users.roles) OR users.role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND ('admin' = ANY(users.roles) OR users.role = 'admin')
  )
);
  `.trim()

  try {
    // Execute the migration using SQL via RPC or direct SQL
    // Note: Supabase JS client doesn't support arbitrary SQL execution directly
    // We need to use the REST API or create a SQL function

    console.log('Migration SQL prepared (length:', migrationSQL.length, 'chars)')
    console.log('\nTo apply this migration:')
    console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/nmbvklixthlqtkkgqnjl')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the content from: supabase/migrations/20260110_fix_dual_role_thalibah_muallimah_rls.sql')
    console.log('4. Run the SQL\n')

    console.log('=== SQL to execute ===')
    console.log(migrationSQL)
    console.log('=== End of SQL ===\n')

    console.log('Or use the migration file: supabase/migrations/20260110_fix_dual_role_thalibah_muallimah_rls.sql')

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

applyMigration()
  .then(() => {
    console.log('\n=== Migration instructions complete ===')
    process.exit(0)
  })
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

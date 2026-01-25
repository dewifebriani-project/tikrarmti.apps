import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase'

/**
 * API endpoint to apply dual-role RLS fix migration
 * This should be called by admin or deleted after applying
 *
 * POST /api/apply-migration-dual-role
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const supabaseAdmin = createSupabaseAdmin()
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('roles, role')
      .eq('id', user.id)
      .single()

    const isAdmin = userData?.roles?.includes('admin') || userData?.role === 'admin'

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin only' },
        { status: 403 }
      )
    }

    // Migration SQL
    const migrationSteps = [
      // Step 1: Drop existing policies
      `DROP POLICY IF EXISTS "Users can view their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;`,
      `DROP POLICY IF EXISTS "Users can insert their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;`,
      `DROP POLICY IF EXISTS "Users can update their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;`,
      `DROP POLICY IF EXISTS "Admins can view all tikrar registrations" ON pendaftaran_tikrar_tahfidz;`,
      `DROP POLICY IF EXISTS "Admins can update all tikrar registrations" ON pendaftaran_tikrar_tahfidz;`,
      `DROP POLICY IF EXISTS "allow_user_select_own_tikrar" ON pendaftaran_tikrar_tahfidz;`,

      // Step 2: Create new policies
      `CREATE POLICY "Users can view their own tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);`,

      `CREATE POLICY "Users can insert their own tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);`,

      `CREATE POLICY "Users can update their own tikrar registrations"
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
WITH CHECK (auth.uid() = user_id);`,

      `CREATE POLICY "Admins can view all tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND ('admin' = ANY(users.roles) OR users.role = 'admin')
  )
);`,

      `CREATE POLICY "Admins can update all tikrar registrations"
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
);`
    ]

    const results = []
    const errors = []

    // Execute each step using RPC through a SQL function
    for (let i = 0; i < migrationSteps.length; i++) {
      const sql = migrationSteps[i]

      // Use Supabase Admin to execute SQL via RPC
      // We need to create a temporary function that executes the SQL
      const functionName = `temp_exec_step_${Date.now()}_${i}`

      try {
        // Create a temporary function to execute the SQL
        const createFunctionSQL = `
          CREATE OR REPLACE FUNCTION ${functionName}()
          RETURNS text AS $$
          BEGIN
            ${sql}
            RETURN 'Success';
          EXCEPTION WHEN OTHERS THEN
            RETURN SQLERRM;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `

        await supabaseAdmin.rpc('exec_sql', { sql: createFunctionSQL })

        // Execute the function
        const { data, error } = await supabaseAdmin.rpc(functionName)

        if (error) {
          errors.push({ step: i + 1, sql, error: error.message })
        } else {
          results.push({ step: i + 1, result: data })
        }

        // Clean up the function
        await supabaseAdmin.rpc('exec_sql', { sql: `DROP FUNCTION IF EXISTS ${functionName}();` })

      } catch (e: any) {
        errors.push({ step: i + 1, sql, error: e.message })
      }
    }

    // Verify the new policies
    const { data: policies, error: policyError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT
            policyname,
            cmd,
            permissive::text as permissive,
            qual as using_clause
          FROM pg_policies
          WHERE schemaname = 'public'
            AND tablename = 'pendaftaran_tikrar_tahfidz'
          ORDER BY cmd, policyname;
        `
      })

    return NextResponse.json({
      success: true,
      message: 'Migration applied. Please verify in Supabase Dashboard.',
      results,
      errors,
      policies: policies || []
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        instructions: [
          'Go to Supabase Dashboard: https://supabase.com/dashboard/project/nmbvklixthlqtkkgqnjl',
          'Navigate to SQL Editor',
          'Copy and paste the content from: supabase/migrations/20260110_fix_dual_role_thalibah_muallimah_rls.sql',
          'Run the SQL'
        ]
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to apply the dual-role RLS fix migration',
    instructions: [
      'This endpoint applies migration to fix RLS policies for dual-role users',
      'Run: POST /api/apply-migration-dual-role',
      'Or manually apply: supabase/migrations/20260110_fix_dual_role_thalibah_muallimah_rls.sql'
    ]
  })
}

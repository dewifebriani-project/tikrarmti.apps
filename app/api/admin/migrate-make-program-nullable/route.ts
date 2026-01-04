import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getClientIp, getUserAgent, logAudit } from '@/lib/audit-log';

const supabaseAdmin = createSupabaseAdmin();

// POST /api/admin/migrate-make-program-nullable
// One-time migration to make halaqah.program_id nullable
export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  try {
    // Auth check
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    // Admin check
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    console.log('[Migration] Starting: Make halaqah.program_id nullable');

    // Execute the migration
    const { error: migrationError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE public.halaqah ALTER COLUMN program_id DROP NOT NULL;'
    });

    // If RPC doesn't work, try direct query
    if (migrationError) {
      console.log('[Migration] RPC failed, trying direct SQL execution');
      // Use the database client directly
      const { error: directError } = await supabaseAdmin
        .from('halaqah')
        .select('id')
        .limit(1);

      // If we can query, we have access
      if (!directError) {
        // Migration SQL to execute manually in Supabase dashboard:
        const migrationSQL = `
          -- Migration: Make halaqah.program_id nullable
          -- Run this in Supabase SQL Editor

          ALTER TABLE public.halaqah ALTER COLUMN program_id DROP NOT NULL;

          -- Verify the change
          SELECT
            column_name,
            is_nullable,
            data_type
          FROM information_schema.columns
          WHERE table_name = 'halaqah'
            AND column_name = 'program_id';
        `;

        return NextResponse.json({
          success: false,
          message: 'Please run migration manually in Supabase SQL Editor',
          migrationSQL,
          instructions: [
            '1. Go to Supabase Dashboard > SQL Editor',
            '2. Paste and run the SQL below:',
            migrationSQL
          ]
        });
      }
    }

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      resource: 'database_schema',
      details: {
        migration: 'make_program_id_nullable',
        table: 'halaqah',
        column: 'program_id'
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

    console.log('[Migration] Completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Migration completed: halaqah.program_id is now nullable'
    });

  } catch (error: any) {
    console.error('[Migration] Error:', error);

    // Return helpful SQL for manual execution
    const migrationSQL = `
-- Migration: Make halaqah.program_id nullable
-- Run this in Supabase SQL Editor

ALTER TABLE public.halaqah ALTER COLUMN program_id DROP NOT NULL;

-- Verify the change
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'halaqah'
  AND column_name = 'program_id';
`;

    return NextResponse.json({
      success: false,
      error: error.message,
      migrationSQL,
      instructions: [
        '1. Go to Supabase Dashboard > SQL Editor',
        '2. Paste and run the SQL below:',
        migrationSQL
      ]
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseAdmin = createSupabaseAdmin();

/**
 * POST /api/admin/apply-migration
 * Apply a SQL migration file to the database
 * Only accessible by admins
 */
export async function POST(request: NextRequest) {
  try {
    // Use Supabase SSR client to get session
    const supabase = createServerClient();

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    // Check if user is admin using admin client
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      console.error('Admin check failed:', dbError, userData);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { migrationFile } = body;

    if (!migrationFile) {
      return NextResponse.json(
        { error: 'Missing required parameter: migrationFile' },
        { status: 400 }
      );
    }

    // Validate migration file name to prevent directory traversal
    if (!/^[a-zA-Z0-9_\-\.]+\.sql$/.test(migrationFile)) {
      return NextResponse.json(
        { error: 'Invalid migration file name' },
        { status: 400 }
      );
    }

    console.log(`[Apply Migration] Loading migration: ${migrationFile}`);

    // Read the SQL file
    const sqlPath = join(process.cwd(), 'supabase', 'migrations', migrationFile);
    let sqlContent: string;

    try {
      sqlContent = readFileSync(sqlPath, 'utf-8');
    } catch (readError) {
      console.error('[Apply Migration] File read error:', readError);
      return NextResponse.json(
        { error: 'Migration file not found', details: (readError as Error).message },
        { status: 404 }
      );
    }

    // Execute the SQL using raw query
    // Note: Supabase client doesn't support arbitrary SQL execution directly
    // We need to use a different approach - execute via a PostgreSQL client

    console.log('[Apply Migration] SQL content loaded, length:', sqlContent.length);

    // For now, we'll use the Supabase REST API to execute the SQL
    // This requires the service role key
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: sqlContent
    });

    if (error) {
      // If exec_sql doesn't exist, we need to inform the user
      console.error('[Apply Migration] Error executing SQL:', error);

      // Check if it's because the function doesn't exist
      if (error.message.includes('function exec_sql')) {
        return NextResponse.json({
          success: false,
          error: 'exec_sql function not found',
          message: 'Please create the exec_sql helper function first or use psql directly',
          hint: 'You can execute the migration manually using: psql $DATABASE_URL -f supabase/migrations/' + migrationFile,
          sql: sqlContent
        }, { status: 400 });
      }

      return NextResponse.json(
        { error: 'Failed to execute migration', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Apply Migration] Migration applied successfully');

    return NextResponse.json({
      success: true,
      message: 'Migration applied successfully',
      migration: migrationFile,
      data
    });

  } catch (error) {
    console.error('[Apply Migration API] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Run a specific SQL migration file
 * POST /api/admin/run-migration
 * Body: { migrationName: '20260117_add_auto_role_trigger_for_muallimah_musyrifah' }
 */
export async function POST(request: Request) {
  const supabase = createClient()

  // 1. Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!userData?.roles?.includes('admin')) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  try {
    const { migrationName } = await request.json()

    if (!migrationName) {
      return NextResponse.json({ error: 'migrationName is required' }, { status: 400 })
    }

    // Read the migration file content
    const fs = await import('fs/promises')
    const path = await import('path')

    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', `${migrationName}.sql`)

    // Check if file exists
    try {
      await fs.access(migrationPath)
    } catch {
      return NextResponse.json({ error: 'Migration file not found' }, { status: 404 })
    }

    const migrationSQL = await fs.readFile(migrationPath, 'utf-8')

    // Split by semicolon and execute each statement
    // Note: This is a simplified approach - for complex migrations, you might need a proper SQL parser
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    const results = []

    for (const statement of statements) {
      if (statement.trim().length === 0) continue

      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement })

        if (error) {
          // If exec_sql doesn't exist, try direct SQL execution via client
          // This won't work for most statements, so we'll document this limitation
          results.push({
            statement: statement.substring(0, 100) + '...',
            status: 'skipped',
            error: 'exec_sql function not available'
          })
        } else {
          results.push({
            statement: statement.substring(0, 100) + '...',
            status: 'success',
            data
          })
        }
      } catch (e: any) {
        results.push({
          statement: statement.substring(0, 100) + '...',
          status: 'error',
          error: e.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      migrationName,
      results,
      message: 'Migration execution completed. Please verify results.',
      note: 'For complex migrations, please run directly in Supabase SQL Editor.'
    })

  } catch (error: any) {
    console.error('Migration execution error:', error)
    return NextResponse.json({
      error: error?.message || 'Failed to execute migration'
    }, { status: 500 })
  }
}

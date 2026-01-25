import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

/**
 * Get migration SQL file content
 * GET /api/admin/migration/[filename]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  // Security: Only allow .sql files from migrations directory
  if (!filename.endsWith('.sql')) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  // Sanitize filename to prevent directory traversal
  const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '')

  try {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', safeFilename)
    const sqlContent = await readFile(migrationPath, 'utf-8')

    return NextResponse.json({
      filename: safeFilename,
      content: sqlContent
    })
  } catch (error: any) {
    console.error('Error reading migration file:', error)
    return NextResponse.json(
      { error: 'Migration file not found' },
      { status: 404 }
    )
  }
}

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get RLS policies from system catalog
    const { data: policies, error } = await supabase.rpc('admin_get_rls_policies')

    if (error) {
      console.error('Error fetching RLS policies:', error)
      return NextResponse.json(
        { error: 'Failed to fetch RLS policies' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: policies })
  } catch (error: any) {
    console.error('Error in RLS policies API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, sql } = body

    if (action === 'apply_fix') {
      const supabase = createClient()

      // Execute SQL via admin function
      const { data, error } = await supabase.rpc('admin_exec_sql', { sql_query: sql })

      if (error) {
        console.error('Error executing SQL:', error)
        return NextResponse.json(
          { error: 'Failed to execute SQL', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error in RLS policies POST API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

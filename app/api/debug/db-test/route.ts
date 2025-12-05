import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServerClient()

    // Test table access
    const { data, error } = await supabase
      .from('tikrar_tahfidz')
      .select('id, user_id, status')
      .limit(1)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 })
    }

    // Test table structure
    const { data: columns, error: columnsError } = await supabase
      .from('tikrar_tahfidz')
      .select('*')
      .limit(0)

    if (columnsError) {
      return NextResponse.json({
        success: false,
        columnsError: columnsError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      sampleData: data,
      message: 'Database connection successful'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
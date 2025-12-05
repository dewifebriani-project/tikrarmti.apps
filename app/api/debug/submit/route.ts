import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    console.log('Debug submit data:', JSON.stringify(body, null, 2))

    // Test insert to tikrar_tahfidz table
    const { data, error } = await supabase
      .from('tikrar_tahfidz')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 400 })
    }

    console.log('Insert success:', data)

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
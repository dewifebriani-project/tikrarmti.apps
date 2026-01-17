import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/debug/daftar-ulang
 *
 * Debug API untuk mengecek data daftar ulang user
 * Menampilkan detail pendaftaran_tikrar_tahfidz dan daftar_ulang_submissions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get pendaftaran_tikrar_tahfidz
    const { data: tikrarRegs, error: tikrarError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        id,
        user_id,
        full_name,
        selection_status,
        status,
        batch_id,
        batch:batches(id, name, status)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Get daftar_ulang_submissions
    const { data: daftarUlangSubs, error: daftarUlangError } = await supabase
      .from('daftar_ulang_submissions')
      .select(`
        id,
        user_id,
        registration_id,
        status,
        batch_id,
        batch:batches(id, name, status),
        submitted_at,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Analyze matching
    const analysis = {
      tikrarRegistrations: (tikrarRegs || []).map((r: any) => ({
        id: r.id,
        id_short: r.id?.slice(0, 8),
        selection_status: r.selection_status,
        batch_id: r.batch_id,
        batch_name: r.batch?.name,
        batch_status: r.batch?.status
      })),
      daftarUlangSubmissions: (daftarUlangSubs || []).map((d: any) => ({
        id: d.id,
        id_short: d.id?.slice(0, 8),
        registration_id: d.registration_id,
        registration_id_short: d.registration_id?.slice(0, 8),
        status: d.status,
        batch_id: d.batch_id,
        batch_name: d.batch?.name,
        batch_status: d.batch?.status
      })),
      matching: []
    } as any

    // Check matching
    if (tikrarRegs && daftarUlangSubs) {
      analysis.matching = tikrarRegs.map((reg: any) => {
        const match = daftarUlangSubs.find((d: any) => d.registration_id === reg.id)
        return {
          reg_id: reg.id,
          reg_id_short: reg.id?.slice(0, 8),
          has_daftar_ulang: !!match,
          match_status: match ? 'MATCH ✓' : 'NO MATCH',
          daftar_ulang_id: match?.id,
          daftar_ulang_status: match?.status,
          daftar_ulang_reg_id: match?.registration_id?.slice(0, 8)
        }
      })
    }

    return NextResponse.json({
      user_id: user.id,
      user_email: user.email,
      timestamp: new Date().toISOString(),
      raw_tikrar_count: tikrarRegs?.length || 0,
      raw_daftar_ulang_count: daftarUlangSubs?.length || 0,
      tikrar_error: tikrarError?.message,
      daftar_ulang_error: daftarUlangError?.message,
      ...analysis
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

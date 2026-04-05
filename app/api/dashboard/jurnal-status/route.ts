import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthorizationContext, isUserAdmin } from '@/lib/rbac'

export interface JurnalBlockStatus {
  block_code: string
  week_number: number
  part: string
  start_page: number
  end_page: number
  is_completed: boolean
  jurnal_date?: string
  jurnal_count: number
}

async function processJurnalStatus(supabase: any, user: any, activeRegistration: any) {
  // Get juz from confirmed_chosen_juz from daftar_ulang, or chosen_juz from registration
  const juzCode = activeRegistration.daftar_ulang?.confirmed_chosen_juz ||
                  activeRegistration.chosen_juz

  if (!juzCode) {
    return NextResponse.json(
      { success: false, error: 'No juz assigned' },
      { status: 404 }
    )
  }

  // Get juz info
  const { data: juzInfo, error: juzError } = await supabase
    .from('juz_options')
    .select('*')
    .eq('code', juzCode)
    .single()

  if (juzError || !juzInfo) {
    return NextResponse.json(
      { success: false, error: 'Juz not found' },
      { status: 404 }
    )
  }

  // Generate all blocks for this juz dynamically
  const allBlocks: JurnalBlockStatus[] = []
  const parts = ['A', 'B', 'C', 'D']
  const totalWeeks = 10
  const blockOffset = juzInfo.part === 'B' ? 10 : 0

  for (let week = 1; week <= totalWeeks; week++) {
    const blockNumber = week + blockOffset
    const weekPage = Math.min(juzInfo.start_page + (week - 1), juzInfo.end_page)
    for (let i = 0; i < 4; i++) {
      allBlocks.push({
        block_code: `H${blockNumber}${parts[i]}`,
        week_number: week,
        part: parts[i],
        start_page: weekPage,
        end_page: weekPage,
        is_completed: false,
        jurnal_count: 0
      })
    }
  }

  // Get all jurnal records for this user (skip for preview-id mock)
  if (activeRegistration.id !== 'preview-id') {
    const { data: jurnalRecords, error: jurnalError } = await supabase
      .from('jurnal_records')
      .select('blok, tanggal_setor')
      .eq('user_id', user.id)
      .order('tanggal_setor', { ascending: true })

    if (!jurnalError && jurnalRecords) {
      const blockStatus = new Map<string, { is_completed: boolean; jurnal_count: number; jurnal_date?: string }>()
      allBlocks.forEach(block => blockStatus.set(block.block_code, { is_completed: false, jurnal_count: 0 }))

      jurnalRecords.forEach((record: any) => {
        if (record.blok) {
          const blocksInRecord: string[] = typeof record.blok === 'string'
            ? record.blok.split(',').map((b: string) => b.trim()).filter((b: string) => b)
            : (Array.isArray(record.blok) ? record.blok : [])

          blocksInRecord.forEach((blockCode: string) => {
            const current = blockStatus.get(blockCode)
            if (current) {
              current.is_completed = true
              current.jurnal_count += 1
              if (!current.jurnal_date || new Date(record.tanggal_setor) < new Date(current.jurnal_date)) {
                current.jurnal_date = record.tanggal_setor
              }
              blockStatus.set(blockCode, current)
            }
          })
        }
      })

      allBlocks.forEach(block => {
        const status = blockStatus.get(block.block_code)
        if (status) {
          block.is_completed = status.is_completed
          block.jurnal_count = status.jurnal_count
          block.jurnal_date = status.jurnal_date
        }
      })
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      juz_code: juzCode,
      juz_info: juzInfo,
      blocks: allBlocks,
      summary: {
        total_blocks: allBlocks.length,
        completed_blocks: allBlocks.filter(b => b.is_completed).length,
        pending_blocks: allBlocks.filter(b => !b.is_completed).length
      }
    }
  })
}

export async function GET() {
  try {
    const response = new NextResponse()
    const context = await getAuthorizationContext({ response })

    if (!context) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient({ response })
    const user = { id: context.userId, email: context.email }

    // Get user's active registration with daftar ulang
    const { data: registrations, error: regsError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        id,
        status,
        batch_id,
        chosen_juz,
        batch:batches(id, start_date, status),
        daftar_ulang:daftar_ulang_submissions(
          id,
          user_id,
          batch_id,
          registration_id,
          confirmed_chosen_juz,
          status
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['approved', 'selected'])

    if (regsError) {
      return NextResponse.json({ success: false, error: 'Failed to fetch registrations', details: regsError }, { status: 500 })
    }

    if (!registrations || registrations.length === 0) {
      // Admin Preview Fallback
      if (isUserAdmin(context)) {
        console.log(`[Jurnal Status] Admin Preview activated for ${user.email}`)
        return processJurnalStatus(supabase, user, {
          id: 'preview-id',
          status: 'approved',
          batch_id: 'preview-batch',
          chosen_juz: '30A',
          batch: { id: 'preview-batch', start_date: new Date().toISOString(), status: 'open' },
          daftar_ulang: { confirmed_chosen_juz: '30A' }
        })
      }

      console.log(`[Jurnal Status] No admin access and no registrations for ${user.email}`)
      return NextResponse.json({ success: true, data: null, message: 'No active registration found' }, { status: 200 })
    }

    // Process first registration
    const reg = registrations[0]
    const daftarUlang = reg.daftar_ulang && Array.isArray(reg.daftar_ulang)
      ? reg.daftar_ulang.find((du: any) => du.batch_id === reg.batch_id)
      : null

    const activeRegistration = { ...reg, daftar_ulang: daftarUlang || null }
    return processJurnalStatus(supabase, user, activeRegistration)

  } catch (error) {
    console.error('[Jurnal Status] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch jurnal status' }, { status: 500 })
  }
}

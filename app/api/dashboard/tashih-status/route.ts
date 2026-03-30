import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthorizationContext, isUserAdmin } from '@/lib/rbac'

export interface TashihBlockStatus {
  block_code: string
  week_number: number
  part: string
  start_page: number
  end_page: number
  is_completed: boolean
  tashih_date?: string
  tashih_count: number
}

async function processJuzStatus(supabase: any, user: any, activeRegistration: any) {
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
  const allBlocks: TashihBlockStatus[] = []
  const parts = ['A', 'B', 'C', 'D']
  const totalPages = juzInfo.end_page - juzInfo.start_page + 1
  const totalWeeks = totalPages
  const blockOffset = juzInfo.part === 'B' ? 10 : 0

  for (let week = 1; week <= totalWeeks; week++) {
    const blockNumber = week + blockOffset
    const weekPage = juzInfo.start_page + (week - 1)
    for (let i = 0; i < 4; i++) {
      allBlocks.push({
        block_code: `H${blockNumber}${parts[i]}`,
        week_number: week,
        part: parts[i],
        start_page: weekPage,
        end_page: weekPage,
        is_completed: false,
        tashih_count: 0
      })
    }
  }

  // Get all tashih records for this user (skip for preview-id mock)
  if (activeRegistration.id !== 'preview-id') {
    const { data: tashihRecords, error: tashihError } = await supabase
      .from('tashih_records')
      .select('blok, waktu_tashih')
      .eq('user_id', user.id)
      .order('waktu_tashih', { ascending: true })

    if (!tashihError && tashihRecords) {
      const blockStatus = new Map<string, { is_completed: boolean; tashih_count: number; tashih_date?: string }>()
      allBlocks.forEach(block => blockStatus.set(block.block_code, { is_completed: false, tashih_count: 0 }))

      tashihRecords.forEach((record: any) => {
        if (record.blok) {
          const blocksInRecord: string[] = typeof record.blok === 'string'
            ? record.blok.split(',').map((b: string) => b.trim()).filter((b: string) => b)
            : (Array.isArray(record.blok) ? record.blok : [])

          blocksInRecord.forEach((blockCode: string) => {
            const current = blockStatus.get(blockCode)
            if (current) {
              current.is_completed = true
              current.tashih_count += 1
              if (!current.tashih_date || new Date(record.waktu_tashih) < new Date(current.tashih_date)) {
                current.tashih_date = record.waktu_tashih
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
          block.tashih_count = status.tashih_count
          block.tashih_date = status.tashih_date
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
        console.log(`[Tashih Status] Admin Preview activated for ${user.email}`)
        return processJuzStatus(supabase, user, {
          id: 'preview-id',
          status: 'approved',
          batch_id: 'preview-batch',
          chosen_juz: '30A',
          batch: { id: 'preview-batch', start_date: new Date().toISOString(), status: 'open' },
          daftar_ulang: { confirmed_chosen_juz: '30A' }
        })
      }

      console.log(`[Tashih Status] No admin access and no registrations for ${user.email}`)
      return NextResponse.json({ success: false, error: 'No active registration found' }, { status: 404 })
    }

    // Process first registration
    const reg = registrations[0]
    const daftarUlang = reg.daftar_ulang && Array.isArray(reg.daftar_ulang)
      ? reg.daftar_ulang.find((du: any) => du.batch_id === reg.batch_id)
      : null

    const activeRegistration = { ...reg, daftar_ulang: daftarUlang || null }
    return processJuzStatus(supabase, user, activeRegistration)

  } catch (error) {
    console.error('[Tashih Status] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch tashih status' }, { status: 500 })
  }
}

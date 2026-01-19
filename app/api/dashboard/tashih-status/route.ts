import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's active registration with daftar ulang
    const { data: registrations, error: regError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        id,
        status,
        daftar_ulang,
        batch_id,
        chosen_juz
      `)
      .eq('user_id', user.id)
      .in('status', ['approved', 'selected'])

    if (regError) {
      console.error('Error fetching registrations:', regError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch registrations' },
        { status: 500 }
      )
    }

    if (!registrations || registrations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active registration found' },
        { status: 404 }
      )
    }

    // Get batch info separately
    const batchIds = registrations.map(r => r.batch_id).filter(Boolean)
    const { data: batches } = await supabase
      .from('batches')
      .select('id, start_date, status')
      .in('id', batchIds as string[])

    // Find active registration
    const activeRegistration = registrations.find((reg: any) => {
      const batch = batches?.find(b => b.id === reg.batch_id)
      return batch?.status === 'open' &&
        (reg.status === 'approved' || (reg as any).selection_status === 'selected')
    }) || registrations[0]

    if (!activeRegistration) {
      return NextResponse.json(
        { success: false, error: 'No active registration found' },
        { status: 404 }
      )
    }

    // Get juz from daftar_ulang.confirmed_chosen_juz or chosen_juz
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

    // Get batch start date
    const batch = batches?.find(b => b.id === activeRegistration.batch_id)
    const batchStartDate = batch?.start_date

    // Generate all blocks for this juz (13 weeks, 4 blocks per week = 52 blocks total)
    const allBlocks: TashihBlockStatus[] = []
    const parts = ['A', 'B', 'C', 'D']

    for (let week = 1; week <= 13; week++) {
      // Part B starts from H11, Part A starts from H1
      const blockOffset = juzInfo.part === 'B' ? 10 : 0
      const blockNumber = week + blockOffset
      const weekStartPage = juzInfo.start_page + (week - 1)

      for (let i = 0; i < 4; i++) {
        const part = parts[i]
        const blockCode = `H${blockNumber}${part}`
        const blockPage = Math.min(weekStartPage + i, juzInfo.end_page)

        allBlocks.push({
          block_code: blockCode,
          week_number: blockNumber,
          part,
          start_page: blockPage,
          end_page: blockPage,
          is_completed: false,
          tashih_count: 0
        })
      }
    }

    // Get all tashih records for this user
    const { data: tashihRecords, error: tashihError } = await supabase
      .from('tashih_records')
      .select('blok, waktu_tashih')
      .eq('user_id', user.id)
      .order('waktu_tashih', { ascending: true })

    if (!tashihError && tashihRecords) {
      // Create a map to track completion status and count
      const blockStatus = new Map<string, { is_completed: boolean; tashih_count: number; tashih_date?: string }>()

      // Initialize map with all blocks
      allBlocks.forEach(block => {
        blockStatus.set(block.block_code, { is_completed: false, tashih_count: 0 })
      })

      // Process tashih records
      tashihRecords.forEach(record => {
        if (record.blok) {
          // Handle both comma-separated string and array formats
          const blocksInRecord: string[] = typeof record.blok === 'string'
            ? record.blok.split(',').map(b => b.trim()).filter(b => b)
            : (Array.isArray(record.blok) ? record.blok : [])

          blocksInRecord.forEach(blockCode => {
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

      // Update status in all blocks
      allBlocks.forEach(block => {
        const status = blockStatus.get(block.block_code)
        if (status) {
          block.is_completed = status.is_completed
          block.tashih_count = status.tashih_count
          block.tashih_date = status.tashih_date
        }
      })
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

  } catch (error) {
    console.error('Tashih status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tashih status',
      },
      { status: 500 }
    )
  }
}

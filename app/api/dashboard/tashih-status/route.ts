import { NextResponse } from 'next/server'
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

export async function GET() {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    console.log('[Tashih Status] User:', user?.id, userError)

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's active registration with daftar ulang
    // Use the same pattern as /api/pendaftaran/all - fetch daftar_ulang_submissions via foreign key
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

    console.log('[Tashih Status] Registrations query error:', regsError)
    console.log('[Tashih Status] Registrations result:', registrations?.length || 0)

    // Log detailed error for debugging
    if (regsError) {
      console.error('[Tashih Status] Query error:', JSON.stringify(regsError, Object.keys(regsError)))
      return NextResponse.json(
        { success: false, error: 'Failed to fetch registrations', details: regsError },
        { status: 500 }
      )
    }

    if (!registrations || registrations.length === 0) {
      console.log('[Tashih Status] No registrations found for user:', user.id)
      return NextResponse.json(
        { success: false, error: 'No active registration found' },
        { status: 404 }
      )
    }

    // Process registrations and embed daftar ulang data (same pattern as /api/pendaftaran/all)
    const processedRegistrations = registrations
      .map((reg: any) => {
        // Get daftar ulang submission for this batch
        const daftarUlang = reg.daftar_ulang && Array.isArray(reg.daftar_ulang)
          ? reg.daftar_ulang.find((du: any) => du.batch_id === reg.batch_id)
          : null

        return {
          ...reg,
          daftar_ulang: daftarUlang || null
        }
      })

    if (processedRegistrations.length > 0) {
      console.log('[Tashih Status] First registration data:', JSON.stringify({
        id: processedRegistrations[0].id,
        status: processedRegistrations[0].status,
        chosen_juz: processedRegistrations[0].chosen_juz,
        confirmed_chosen_juz: processedRegistrations[0].daftar_ulang?.confirmed_chosen_juz,
        batch_id: processedRegistrations[0].batch_id,
        batch_status: processedRegistrations[0].batch?.status
      }))
    }

    // Use first registration as active registration
    const activeRegistration = processedRegistrations[0]

    if (!activeRegistration) {
      return NextResponse.json(
        { success: false, error: 'No active registration found' },
        { status: 404 }
      )
    }

    // Get juz from confirmed_chosen_juz from daftar_ulang, or chosen_juz from registration
    const juzCode = activeRegistration.daftar_ulang?.confirmed_chosen_juz ||
                    activeRegistration.chosen_juz

    console.log('[Tashih Status] Juz code:', juzCode, 'from daftar_ulang.confirmed_chosen_juz:', activeRegistration.daftar_ulang?.confirmed_chosen_juz, 'from chosen_juz:', activeRegistration.chosen_juz)

    if (!juzCode) {
      console.log('[Tashih Status] No juz assigned for registration:', activeRegistration.id)
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

    console.log('[Tashih Status] Juz info query result:', 'juzInfo:', juzInfo ? 'found' : 'null', 'error:', juzError)

    if (juzError || !juzInfo) {
      console.log('[Tashih Status] Juz not found or error, juzCode was:', juzCode)
      return NextResponse.json(
        { success: false, error: 'Juz not found' },
        { status: 404 }
      )
    }

    // Generate all blocks for this juz (10 weeks, 4 blocks per week = 40 blocks total)
    // Part A: H1A-H10D, Part B: H11A-H20D
    // But week_number is always 1-10 for UI display (Pekan 1, Pekan 2, etc.)
    const allBlocks: TashihBlockStatus[] = []
    const parts = ['A', 'B', 'C', 'D']

    // Part B starts from H11, Part A starts from H1
    const blockOffset = juzInfo.part === 'B' ? 10 : 0

    for (let week = 1; week <= 10; week++) {
      // Block number includes offset for Part B (H11-H20), Part A is H1-H10
      const blockNumber = week + blockOffset
      const weekStartPage = juzInfo.start_page + (week - 1)

      for (let i = 0; i < 4; i++) {
        const part = parts[i]
        const blockCode = `H${blockNumber}${part}`
        const blockPage = Math.min(weekStartPage + i, juzInfo.end_page)

        allBlocks.push({
          block_code: blockCode,
          week_number: week, // Always 1-10 for UI display (Pekan 1, Pekan 2, etc.)
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

    console.log('[Tashih Status] Tashih records:', tashihRecords?.length || 0, 'error:', tashihError)

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

    console.log('[Tashih Status] Returning data:', {
      juz_code: juzCode,
      total_blocks: allBlocks.length,
      completed: allBlocks.filter(b => b.is_completed).length
    })

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
    console.error('[Tashih Status] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tashih status',
      },
      { status: 500 }
    )
  }
}

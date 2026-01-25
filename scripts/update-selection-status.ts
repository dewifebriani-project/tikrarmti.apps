/**
 * Script untuk update selection status secara batch
 * Run: npx tsx scripts/update-selection-status.ts
 *
 * Environment variables needed:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables')
  console.error('Needed: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function updateSelectionStatus(batchId?: string) {
  console.log('🔄 Starting selection status update...')
  if (batchId) {
    console.log(`📦 Batch ID: ${batchId}`)
  } else {
    console.log(`📦 Updating ALL batches`)
  }

  try {
    // Build query
    let query = supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, chosen_juz, oral_assessment_status, exam_score, selection_status')
      .eq('selection_status', 'pending')
      .eq('status', 'approved')

    if (batchId) {
      query = query.eq('batch_id', batchId)
    }

    const { data: registrations, error: fetchError } = await query

    if (fetchError) {
      console.error('❌ Error fetching registrations:', fetchError)
      throw fetchError
    }

    if (!registrations || registrations.length === 0) {
      console.log('✅ No pending registrations to update')
      return {
        success: true,
        updated_count: 0,
        message: 'No registrations to update'
      }
    }

    console.log(`📋 Found ${registrations.length} pending registrations`)

    const idsToSelect: string[] = []
    const idsToPraTikrar: string[] = []
    const juzAdjustments: {
      id: string
      original_juz: string
      adjusted_juz: string
      reason: string
    }[] = []

    // Process each registration
    for (const reg of registrations) {
      const oralStatus = reg.oral_assessment_status
      const examScore = reg.exam_score
      const chosenJuz = reg.chosen_juz?.toUpperCase() || ''

      // Rule 1: Pass oral test → Selected
      if (oralStatus === 'pass') {
        idsToSelect.push(reg.id)
      }
      // Rule 2: Fail oral test → Pra-Tikrar
      else if (oralStatus === 'fail') {
        idsToPraTikrar.push(reg.id)
      }
      // Rule 3: Pending → Skip
      else {
        console.log(`⏭️  Skipping ${reg.id} - oral assessment pending`)
      }
    }

    // Update selected registrations
    let updatedSelectedCount = 0
    if (idsToSelect.length > 0) {
      console.log(`✅ Updating ${idsToSelect.length} to 'selected' (Tikrar Tahfidz MTI)`)

      const { error: updateError } = await supabase
        .from('pendaftaran_tikrar_tahfidz')
        .update({
          selection_status: 'selected',
          selected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', idsToSelect)

      if (updateError) {
        console.error('❌ Error updating selected:', updateError)
        throw updateError
      }

      updatedSelectedCount = idsToSelect.length
    }

    // Update Pra-Tikrar registrations
    let updatedPraTikrarCount = 0
    if (idsToPraTikrar.length > 0) {
      console.log(`📚 Updating ${idsToPraTikrar.length} to 'not_selected' (Pra-Tikrar)`)

      const { error: updateError } = await supabase
        .from('pendaftaran_tikrar_tahfidz')
        .update({
          selection_status: 'not_selected',
          updated_at: new Date().toISOString()
        })
        .in('id', idsToPraTikrar)

      if (updateError) {
        console.error('❌ Error updating Pra-Tikrar:', updateError)
        throw updateError
      }

      updatedPraTikrarCount = idsToPraTikrar.length
    }

    const totalUpdated = updatedSelectedCount + updatedPraTikrarCount

    console.log('\n✅ Update completed!')
    console.log(`📊 Summary:`)
    console.log(`   - Selected (Tikrar Tahfidz MTI): ${updatedSelectedCount}`)
    console.log(`   - Pra-Tikrar: ${updatedPraTikrarCount}`)
    console.log(`   - Total updated: ${totalUpdated}`)

    return {
      success: true,
      updated_count: totalUpdated,
      selected_count: updatedSelectedCount,
      pratikrar_count: updatedPraTikrarCount,
      message: 'Update completed successfully'
    }

  } catch (error) {
    console.error('❌ Update failed:', error)
    throw error
  }
}

// Get batch_id from command line argument
const batchIdArg = process.argv[2]

// Run the update
updateSelectionStatus(batchIdArg)
  .then((result) => {
    console.log('\n✅ Script completed successfully')
    console.log(JSON.stringify(result, null, 2))
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

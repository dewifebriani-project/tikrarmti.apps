const { createClient } = require('@supabase/supabase-js')

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'process.env.NEXT_PUBLIC_SUPABASE_URL'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createBatch() {
  try {
    console.log('🔍 Checking if batch already exists...')

    // Check if batch already exists
    const { data: existingBatch, error: checkError } = await supabase
      .from('batches')
      .select('*')
      .eq('name', 'Tikrar MTI Batch 2')
      .maybeSingle()

    if (existingBatch) {
      console.log('ℹ️  Batch already exists. Updating it instead...')

      const { data: updateData, error: updateError } = await supabase
        .from('batches')
        .update({
          status: 'active',
          is_free: true,
          price: 0,
          total_quota: 100,
          duration_weeks: 16,
          start_date: '2026-01-05',
          end_date: '2026-04-26',
          registration_start_date: '2025-12-06T00:00:00Z',
          registration_end_date: '2025-12-13T23:59:59Z',
          description: 'Program Hafalan Al-Qur\'an Gratis Khusus Akhawat - Metode Tikrar 40 Kali (Juz 1, 28, 29, 30)'
        })
        .eq('id', existingBatch.id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error updating batch:', updateError)
        return
      }

      console.log('✅ Successfully updated batch!')
      console.log('Updated data:', JSON.stringify(updateData, null, 2))
      return
    }

    console.log('📝 Creating new batch "Tikrar MTI Batch 2"...')

    // Create the batch
    const { data: batchData, error: batchError } = await supabase
      .from('batches')
      .insert({
        name: 'Tikrar MTI Batch 2',
        description: 'Program Hafalan Al-Qur\'an Gratis Khusus Akhawat - Metode Tikrar 40 Kali (Juz 1, 28, 29, 30)',
        start_date: '2026-01-05',
        end_date: '2026-04-26',
        registration_start_date: '2025-12-06T00:00:00Z',
        registration_end_date: '2025-12-13T23:59:59Z',
        status: 'active',
        duration_weeks: 16,
        is_free: true,
        price: 0,
        total_quota: 100
      })
      .select()
      .single()

    if (batchError) {
      console.error('❌ Error creating batch:', batchError)
      return
    }

    console.log('✅ Successfully created batch!')
    console.log('Batch data:', JSON.stringify(batchData, null, 2))

    // Verify the batch was created
    const { data: verifyData, error: verifyError } = await supabase
      .from('batches')
      .select('*')
      .eq('name', 'Tikrar MTI Batch 2')
      .single()

    if (verifyError) {
      console.error('❌ Error verifying batch:', verifyError)
      return
    }

    console.log('\n📊 Batch Details:')
    console.log('  ID:', verifyData.id)
    console.log('  Name:', verifyData.name)
    console.log('  Status:', verifyData.status)
    console.log('  Is Free:', verifyData.is_free)
    console.log('  Price:', verifyData.price)
    console.log('  Total Quota:', verifyData.total_quota)
    console.log('  Duration (weeks):', verifyData.duration_weeks)
    console.log('  Start Date:', verifyData.start_date)
    console.log('  End Date:', verifyData.end_date)
    console.log('  Registration Start:', verifyData.registration_start_date)
    console.log('  Registration End:', verifyData.registration_end_date)

    console.log('\n✅ All done! The batch is now active and ready for registrations.')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createBatch()

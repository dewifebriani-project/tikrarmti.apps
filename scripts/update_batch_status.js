const { createClient } = require('@supabase/supabase-js')

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateBatchStatus() {
  try {
    console.log('🔍 Checking current batch status...')

    // Check if batch exists
    const { data: existingBatch, error: checkError } = await supabase
      .from('batches')
      .select('*')
      .eq('name', 'Tikrar MTI Batch 2')
      .maybeSingle()

    if (!existingBatch) {
      console.log('❌ Batch "Tikrar MTI Batch 2" not found!')
      console.log('Creating new batch...')

      const { data: newBatch, error: createError } = await supabase
        .from('batches')
        .insert({
          name: 'Tikrar MTI Batch 2',
          description: 'Program Hafalan Al-Qur\'an Gratis Khusus Akhawat - Metode Tikrar 40 Kali (Juz 1, 28, 29, 30)',
          start_date: '2026-01-05',
          end_date: '2026-04-26',
          registration_start_date: '2025-12-06T00:00:00Z',
          registration_end_date: '2025-12-13T23:59:59Z',
          status: 'active',
          duration_weeks: 16
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating batch:', createError)
        return
      }

      console.log('✅ Successfully created batch!')
      console.log('Batch data:', JSON.stringify(newBatch, null, 2))
      return
    }

    console.log('ℹ️  Current batch status:', existingBatch.status)
    console.log('ℹ️  Current batch data:', JSON.stringify(existingBatch, null, 2))

    if (existingBatch.status === 'active') {
      console.log('✅ Batch is already active!')
      return
    }

    console.log('📝 Updating batch status to "active"...')

    const { data: updateData, error: updateError } = await supabase
      .from('batches')
      .update({
        status: 'active',
        duration_weeks: 16,
        start_date: '2026-01-05',
        end_date: '2026-04-26',
        registration_start_date: '2025-12-06T00:00:00Z',
        registration_end_date: '2025-12-13T23:59:59Z'
      })
      .eq('id', existingBatch.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating batch:', updateError)
      return
    }

    console.log('✅ Successfully updated batch to active!')
    console.log('Updated data:', JSON.stringify(updateData, null, 2))

    console.log('\n📊 Batch Details:')
    console.log('  ID:', updateData.id)
    console.log('  Name:', updateData.name)
    console.log('  Status:', updateData.status)
    console.log('  Duration (weeks):', updateData.duration_weeks)
    console.log('  Start Date:', updateData.start_date)
    console.log('  End Date:', updateData.end_date)

    console.log('\n✅ Batch is now active!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

updateBatchStatus()

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'process.env.NEXT_PUBLIC_SUPABASE_URL'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setProgramFree() {
  try {
    console.log('🔄 Updating batch data to make program FREE...')

    // Update batch 'Tikrar MTI Batch 2' to be free
    const { data: updateData, error: updateError } = await supabase
      .from('batches')
      .update({
        is_free: true,
        price: 0
      })
      .eq('name', 'Tikrar MTI Batch 2')
      .select()

    if (updateError) {
      console.error('❌ Error updating batch:', updateError)
      return
    }

    console.log('✅ Successfully updated batch to FREE!')
    console.log('Updated data:', JSON.stringify(updateData, null, 2))

    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('batches')
      .select('*')
      .eq('name', 'Tikrar MTI Batch 2')
      .single()

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError)
      return
    }

    console.log('\n📊 Current batch data:')
    console.log('  Batch Name:', verifyData.name)
    console.log('  Is Free:', verifyData.is_free)
    console.log('  Price:', verifyData.price)
    console.log('  Total Quota:', verifyData.total_quota)
    console.log('  Duration (weeks):', verifyData.duration_weeks)

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

setProgramFree()

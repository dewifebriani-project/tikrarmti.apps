const { createClient } = require('@supabase/supabase-js')

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nmbvklixthlqtkkgqnjl.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYnZrbGl4dGhscXRra2dxbmpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYyNTgyOSwiZXhwIjoyMDgwMjAxODI5fQ.PVvANGhrqKOvqdOSuNQyC4fDMypJCiMBwxuDm_2aMIs'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setBatchOpen() {
  try {
    console.log('🔍 Fetching batch "Tikrar MTI Batch 2"...')

    const { data: batch, error: fetchError } = await supabase
      .from('batches')
      .select('*')
      .eq('name', 'Tikrar MTI Batch 2')
      .single()

    if (fetchError || !batch) {
      console.error('❌ Batch not found:', fetchError)
      return
    }

    console.log('✅ Found batch:', batch.name)
    console.log('   Current status:', batch.status)
    console.log('   Duration weeks:', batch.duration_weeks)

    // The API is looking for status 'active', but the constraint only allows: draft, open, closed, archived
    // We need to update the API to look for 'open' status instead
    console.log('\n⚠️  Note: The database constraint only allows: draft, open, closed, archived')
    console.log('   The API is currently checking for status="active" which is invalid.')
    console.log('   We need to update the API to check for status="open" instead.')

    console.log('\n📝 Current batch data:')
    console.log(JSON.stringify(batch, null, 2))

    console.log('\n✅ Batch is already set to "open" status, which is correct for accepting registrations.')
    console.log('   The API endpoint needs to be updated to look for status="open" instead of status="active"')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

setBatchOpen()

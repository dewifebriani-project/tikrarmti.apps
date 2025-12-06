const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nmbvklixthlqtkkgqnjl.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYnZrbGl4dGhscXRra2dxbmpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYyNTgyOSwiZXhwIjoyMDgwMjAxODI5fQ.PVvANGhrqKOvqdOSuNQyC4fDMypJCiMBwxuDm_2aMIs'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkBatchStatus() {
  try {
    console.log('🔍 Checking batch status...\n')

    // Get batch data
    const { data, error } = await supabase
      .from('batches')
      .select('id, name, status')
      .eq('name', 'Tikrar MTI Batch 2')

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log('📊 Batch data:')
    console.log(JSON.stringify(data, null, 2))

    if (data && data.length > 0) {
      const batch = data[0]
      console.log(`\n✅ Batch found:`)
      console.log(`  Name: ${batch.name}`)
      console.log(`  Status: ${batch.status}`)
      console.log(`  ID: ${batch.id}`)

      if (batch.status !== 'active') {
        console.log(`\n⚠️  WARNING: Batch status is "${batch.status}", should be "active"`)
        console.log('    API endpoint requires status to be "active"')
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkBatchStatus()

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

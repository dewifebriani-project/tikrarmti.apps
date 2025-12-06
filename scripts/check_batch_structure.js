const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nmbvklixthlqtkkgqnjl.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYnZrbGl4dGhscXRra2dxbmpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYyNTgyOSwiZXhwIjoyMDgwMjAxODI5fQ.PVvANGhrqKOvqdOSuNQyC4fDMypJCiMBwxuDm_2aMIs'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkBatchStructure() {
  try {
    console.log('🔍 Checking current batch structure...\n')

    // Get batch data
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('name', 'Tikrar MTI Batch 2')
      .single()

    if (error) {
      console.error('❌ Error fetching batch:', error)
      return
    }

    console.log('📊 Current batch columns and values:')
    console.log(JSON.stringify(data, null, 2))

    console.log('\n📋 Available columns:')
    Object.keys(data).forEach(key => {
      console.log(`  - ${key}: ${typeof data[key]} = ${data[key]}`)
    })

    // Check if required columns exist
    const requiredColumns = ['is_free', 'price', 'total_quota']
    console.log('\n✅ Required columns check:')
    requiredColumns.forEach(col => {
      const exists = col in data
      console.log(`  ${exists ? '✅' : '❌'} ${col}: ${exists ? 'EXISTS' : 'MISSING'}`)
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkBatchStructure()

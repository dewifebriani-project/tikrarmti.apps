const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nmbvklixthlqtkkgqnjl.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYnZrbGl4dGhscXRra2dxbmpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYyNTgyOSwiZXhwIjoyMDgwMjAxODI5fQ.PVvANGhrqKOvqdOSuNQyC4fDMypJCiMBwxuDm_2aMIs'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkProgram() {
  try {
    console.log('🔍 Checking program...\n')

    // Get all programs
    const { data: allPrograms, error: allError } = await supabase
      .from('programs')
      .select('*')

    console.log('📊 All programs:')
    console.log(JSON.stringify(allPrograms, null, 2))

    // Search for Tikrar Tahfidz
    const { data: tikrarProgram, error } = await supabase
      .from('programs')
      .select('*')
      .eq('name', 'Tikrar Tahfidz')

    console.log('\n🔍 Searching for "Tikrar Tahfidz":')
    if (error) {
      console.error('❌ Error:', error)
    } else if (!tikrarProgram || tikrarProgram.length === 0) {
      console.log('❌ Program "Tikrar Tahfidz" NOT FOUND')
      console.log('\n💡 Available program names:')
      allPrograms?.forEach(p => console.log(`  - "${p.name}"`))
    } else {
      console.log('✅ Found:', JSON.stringify(tikrarProgram, null, 2))
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkProgram()

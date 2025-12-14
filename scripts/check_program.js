const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'process.env.NEXT_PUBLIC_SUPABASE_URL'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

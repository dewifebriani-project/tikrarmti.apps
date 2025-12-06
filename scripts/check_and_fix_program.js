const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nmbvklixthlqtkkgqnjl.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYnZrbGl4dGhscXRra2dxbmpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYyNTgyOSwiZXhwIjoyMDgwMjAxODI5fQ.PVvANGhrqKOvqdOSuNQyC4fDMypJCiMBwxuDm_2aMIs'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkProgram() {
  console.log('🔍 Checking programs...\n')

  const { data: programs, error } = await supabase
    .from('programs')
    .select('*')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${programs.length} program(s):\n`)
  programs.forEach(p => {
    console.log(`  - ${p.name} (ID: ${p.id})`)
  })

  // Check for Tahfidz program
  const tahfidzProgram = programs.find(p => p.name === 'Tahfidz' || p.name === 'Tikrar Tahfidz')

  if (!tahfidzProgram) {
    console.log('\n❌ No "Tahfidz" program found!')
    console.log('Creating it now...\n')

    const { data: newProgram, error: createError } = await supabase
      .from('programs')
      .insert({
        name: 'Tahfidz',
        description: 'Program Hafalan Al-Qur\'an dengan Metode Tikrar',
        status: 'active'
      })
      .select()
      .single()

    if (createError) {
      console.error('Create error:', createError)
    } else {
      console.log('✅ Created "Tahfidz" program!')
      console.log(JSON.stringify(newProgram, null, 2))
    }
  } else {
    console.log(`\n✅ Found program: ${tahfidzProgram.name}`)
    console.log(`   ID: ${tahfidzProgram.id}`)
    console.log(`   Status: ${tahfidzProgram.status}`)
  }
}

checkProgram()

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nmbvklixthlqtkkgqnjl.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYnZrbGl4dGhscXRra2dxbmpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYyNTgyOSwiZXhwIjoyMDgwMjAxODI5fQ.PVvANGhrqKOvqdOSuNQyC4fDMypJCiMBwxuDm_2aMIs'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('🔄 Creating juz_options table and inserting data...')

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'create_juz_options_table.sql')
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')

    console.log('📝 SQL migration loaded')
    console.log('⚠️  Note: This migration needs to be run manually via Supabase SQL Editor')
    console.log('   or using a database client with superuser privileges.')
    console.log('')
    console.log('📋 SQL Content:')
    console.log('─'.repeat(80))
    console.log(sqlContent)
    console.log('─'.repeat(80))
    console.log('')
    console.log('✅ Please copy the SQL above and run it in Supabase SQL Editor')
    console.log('   URL: https://supabase.com/dashboard/project/nmbvklixthlqtkkgqnjl/sql')

    // Verify if table exists and show data
    console.log('\n🔍 Checking if juz_options table exists and has data...')
    const { data, error } = await supabase
      .from('juz_options')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.log('⚠️  Table not found or error:', error.message)
      console.log('   Please run the migration SQL first.')
    } else {
      console.log('✅ Table exists! Current data:')
      console.log(JSON.stringify(data, null, 2))
      console.log(`\n📊 Total juz options: ${data.length}`)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

applyMigration()

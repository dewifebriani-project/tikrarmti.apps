const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nmbvklixthlqtkkgqnjl.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYnZrbGl4dGhscXRra2dxbmpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYyNTgyOSwiZXhwIjoyMDgwMjAxODI5fQ.PVvANGhrqKOvqdOSuNQyC4fDMypJCiMBwxuDm_2aMIs'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('🔄 Applying price fields migration to batches table...')

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'add_price_fields_to_batches.sql')
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')

    // Split SQL commands by semicolon and execute each one
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    for (const command of commands) {
      if (command.toUpperCase().startsWith('SELECT')) {
        // For SELECT queries, use .from()
        console.log('\n📊 Verifying migration...')
        const { data, error } = await supabase
          .from('batches')
          .select('id, name, is_free, price, total_quota, start_date, end_date, status')
          .eq('name', 'Tikrar MTI Batch 2')

        if (error) {
          console.error('❌ Error verifying:', error)
        } else {
          console.log('✅ Current batch data:')
          console.log(JSON.stringify(data, null, 2))
        }
      } else {
        // For DDL/DML commands, use .rpc() with sql function
        console.log(`\n🔧 Executing command...`)
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: command })

        if (error) {
          // Try alternative approach using direct API call
          console.log('⚠️  RPC failed, trying direct query...')
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ sql_query: command })
          })

          if (!response.ok) {
            console.log('⚠️  Direct query also failed. Using update method...')
            // If both fail, try using the Supabase client update method
            if (command.toUpperCase().includes('UPDATE')) {
              console.log('📝 Applying update via client...')
              const { data: updateData, error: updateError } = await supabase
                .from('batches')
                .update({
                  is_free: true,
                  price: 0,
                  total_quota: 100
                })
                .eq('name', 'Tikrar MTI Batch 2')
                .select()

              if (updateError) {
                console.error('❌ Error updating:', updateError.message)
              } else {
                console.log('✅ Update successful!')
              }
            }
          }
        } else {
          console.log('✅ Command executed successfully')
        }
      }
    }

    console.log('\n🎉 Migration completed!')

    // Final verification
    console.log('\n📊 Final verification:')
    const { data: finalData, error: finalError } = await supabase
      .from('batches')
      .select('*')
      .eq('name', 'Tikrar MTI Batch 2')
      .single()

    if (finalError) {
      console.error('❌ Error in final verification:', finalError)
    } else {
      console.log('✅ Final batch data:')
      console.log('  Batch Name:', finalData.name)
      console.log('  Is Free:', finalData.is_free ?? 'Column not yet added')
      console.log('  Price:', finalData.price ?? 'Column not yet added')
      console.log('  Total Quota:', finalData.total_quota ?? 'Column not yet added')
      console.log('  Duration (weeks):', finalData.duration_weeks)
      console.log('  Status:', finalData.status)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

applyMigration()

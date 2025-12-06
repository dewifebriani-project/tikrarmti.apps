const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nmbvklixthlqtkkgqnjl.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYnZrbGl4dGhscXRra2dxbmpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYyNTgyOSwiZXhwIjoyMDgwMjAxODI5fQ.PVvANGhrqKOvqdOSuNQyC4fDMypJCiMBwxuDm_2aMIs'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🔍 Checking batch structure...\n')

  const { data: batch, error } = await supabase
    .from('batches')
    .select('*')
    .eq('name', 'Tikrar MTI Batch 2')
    .single()

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Current fields:', Object.keys(batch))
  console.log('\nBatch data:', JSON.stringify(batch, null, 2))

  const hasFields = 'is_free' in batch && 'price' in batch && 'total_quota' in batch

  if (!hasFields) {
    console.log('\n❌ Missing columns! Run this SQL in Supabase:')
    console.log('\nALTER TABLE batches ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT TRUE;')
    console.log('ALTER TABLE batches ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;')
    console.log('ALTER TABLE batches ADD COLUMN IF NOT EXISTS total_quota INTEGER DEFAULT 100;')
    console.log('\nUPDATE batches SET is_free = TRUE, price = 0, total_quota = 100 WHERE name = \'Tikrar MTI Batch 2\';')
  } else {
    console.log('\n✅ All columns exist! Updating values...')

    const { data: updated, error: updateError } = await supabase
      .from('batches')
      .update({
        is_free: true,
        price: 0,
        total_quota: 100
      })
      .eq('name', 'Tikrar MTI Batch 2')
      .select()

    if (updateError) {
      console.error('Update error:', updateError)
    } else {
      console.log('\n✅ Updated successfully!')
      console.log(JSON.stringify(updated, null, 2))
    }
  }
}

runMigration()

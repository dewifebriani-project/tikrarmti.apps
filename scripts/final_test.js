const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nmbvklixthlqtkkgqnjl.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYnZrbGl4dGhscXRra2dxbmpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYyNTgyOSwiZXhwIjoyMDgwMjAxODI5fQ.PVvANGhrqKOvqdOSuNQyC4fDMypJCiMBwxuDm_2aMIs'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function test() {
  console.log('🧪 Final API Test\n')

  // Simulate what the API endpoint does
  const { data: batch, error: batchError } = await supabase
    .from('batches')
    .select('*')
    .eq('name', 'Tikrar MTI Batch 2')
    .in('status', ['open', 'active'])
    .single()

  if (batchError || !batch) {
    console.error('❌ Batch NOT found:', batchError?.message)
    return
  }

  console.log('✅ Batch found!')

  const { data: program, error: programError } = await supabase
    .from('programs')
    .select('id, name')
    .eq('name', 'Tahfidz')
    .single()

  if (programError || !program) {
    console.error('❌ Program NOT found:', programError?.message)
    return
  }

  console.log('✅ Program found!')

  const { data: registrations } = await supabase
    .from('pendaftaran')
    .select('id')
    .eq('batch_id', batch.id)

  const registeredCount = registrations?.length || 0
  const availableQuota = batch.total_quota - registeredCount

  console.log('\n📊 API Response:')
  console.log({
    batch_id: batch.id,
    batch_name: batch.name,
    program_id: program.id,
    program_name: program.name,
    start_date: batch.start_date,
    end_date: batch.end_date,
    duration_weeks: batch.duration_weeks,
    price: batch.price,
    is_free: batch.is_free,
    total_quota: batch.total_quota,
    registered_count: registeredCount,
    scholarship_quota: availableQuota
  })

  console.log('\n✅ The /api/batch/default endpoint should now work!')
  console.log('   No more 404 errors!')
}

test()

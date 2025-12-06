const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nmbvklixthlqtkkgqnjl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYnZrbGl4dGhscXRra2dxbmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MjU4MjksImV4cCI6MjA4MDIwMTgyOX0.v7IhJB0C3v5s43T3LzxCPXwXHY4XH0sZMNZ27Ow2Y7M'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAPI() {
  console.log('🧪 Testing batch API...\n')

  // Test 1: Get batch with 'open' status
  const { data: batch, error: batchError } = await supabase
    .from('batches')
    .select('*')
    .eq('name', 'Tikrar MTI Batch 2')
    .in('status', ['open', 'active'])
    .single()

  if (batchError || !batch) {
    console.error('❌ Batch query failed:', batchError)
    return
  }

  console.log('✅ Batch found:', batch.name)
  console.log('   Status:', batch.status)
  console.log('   Is Free:', batch.is_free)
  console.log('   Price:', batch.price)
  console.log('   Total Quota:', batch.total_quota)

  // Test 2: Get program
  const { data: program, error: programError } = await supabase
    .from('programs')
    .select('id, name')
    .eq('name', 'Tahfidz')
    .single()

  if (programError || !program) {
    console.error('\n❌ Program query failed:', programError)
    return
  }

  console.log('\n✅ Program found:', program.name)
  console.log('   ID:', program.id)

  // Test 3: Count registrations
  const { data: registrations, error: regError } = await supabase
    .from('pendaftaran')
    .select('id')
    .eq('batch_id', batch.id)

  const registeredCount = regError ? 0 : (registrations?.length || 0)

  console.log('\n✅ Registrations count:', registeredCount)

  // Test 4: Simulate API response
  const availableQuota = batch.total_quota - registeredCount

  console.log('\n📊 API Response would be:')
  const apiResponse = {
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
  }

  console.log(JSON.stringify(apiResponse, null, 2))

  console.log('\n✅ API test completed successfully!')
}

testAPI()

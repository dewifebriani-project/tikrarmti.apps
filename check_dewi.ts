import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('user_id, full_name, batch_id, selection_status, oral_score, oral_total_score')
    .ilike('full_name', '%Dewi%')
    
  console.log('Error:', error)
  console.log('Data:', data)
}
test()

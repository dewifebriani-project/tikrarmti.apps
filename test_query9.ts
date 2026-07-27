import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const batchId = '2478b493-1b6b-412a-a05f-6193db815a43'
  
  const { data: regs, error } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('id, user_id, users(full_name)')
    .eq('batch_id', batchId)
    
  console.log('regs error:', error)
  console.log('regs data length:', regs?.length)
}

test()

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const batchId = '2478b493-1b6b-412a-a05f-6193db815a43'
  
  const { data: batch, error } = await supabase
    .from('batches')
    .select('opening_class_date')
    .eq('id', batchId)
    .single()
    
  console.log('batch error:', error)
  console.log('batch data:', batch)
}

test()

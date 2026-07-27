import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data } = await supabase.from('halaqah').select('preferred_juz').limit(1)
  console.log('halaqah:', data)

  const { data: mData } = await supabase.from('muallimah_registrations').select('preferred_juz').limit(1)
  console.log('muallimah_registrations:', mData)
}

test()

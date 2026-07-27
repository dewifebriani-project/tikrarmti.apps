import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data: rawHalaqah, error } = await supabase
    .from('halaqah')
    .select(`
      id, name,
      mentors:halaqah_mentors(
        mentor_id, role,
        users:users!halaqah_mentors_mentor_id_fkey(full_name)
      )
    `)
    .limit(2)

  console.log("Error:", error)
  console.log("Data:", JSON.stringify(rawHalaqah, null, 2))
}

test()

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data: userData } = await supabase
    .from('users')
    .select('id, full_name')
    .ilike('full_name', '%Sainah%')
    .limit(1)
    
  if (userData && userData.length > 0) {
    const userId = userData[0].id
    const { data: exams } = await supabase
      .from('akad_quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      
    console.log("Akad Quiz attempts for Sainah:", exams)
  }
}

test()

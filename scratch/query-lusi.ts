import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, roles')
    .ilike('email', '%lusitarani00%')
    
  console.log('Query result for lusitarani00:', data)
  
  const { data: data2 } = await supabase
    .from('users')
    .select('id, email, full_name, roles')
    .ilike('email', '%lusi%')
    
  console.log('Query result for lusi:', data2)
}

main()

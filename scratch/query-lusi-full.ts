import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  const { data: user, error } = await supabaseAdmin.auth.admin.getUserById('5ec39b12-7907-4925-afdd-cf36c286cc0a')
  
  if (error) {
    console.error('Error fetching user:', error)
    return
  }
  
  console.log('Lusi Auth Data:')
  console.log(JSON.stringify(user, null, 2))
}

main()

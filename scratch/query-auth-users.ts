import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()
  
  if (error) {
    console.error('Error fetching auth users:', error)
    return
  }

  const lusi = users.users.filter(u => u.email?.includes('lusitarani00'))
  console.log('Auth users for lusitarani00:')
  lusi.forEach(u => {
    console.log(`ID: ${u.id}, Email: ${u.email}, Created: ${u.created_at}`)
    console.log(`Identities:`, u.identities?.map(i => i.provider))
  })
}

main()

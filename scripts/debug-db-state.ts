import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugUser(email: string) {
  console.log(`=== DEBUGGING USER: ${email} ===`)
  
  // 1. Check public.users
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .ilike('email', email)
  
  if (userError) {
    console.error('Error fetching from public.users:', userError)
  } else {
    console.log(`Found ${users?.length || 0} records in public.users:`)
    users?.forEach(u => {
      console.log(` - ID: ${u.id}, Email: ${u.email}, Roles: ${JSON.stringify(u.roles)}, Role: ${u.role}, CreatedAt: ${u.created_at}`)
    })
  }

  // 2. Check auth.users (if possible via RPC or admin API)
  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    console.error('Error listing auth users:', authError)
  } else {
    const targetAuthUser = authUsers.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (targetAuthUser) {
      console.log(`Found in auth.users:`)
      console.log(` - ID: ${targetAuthUser.id}, Email: ${targetAuthUser.email}, Metadata: ${JSON.stringify(targetAuthUser.user_metadata)}, AppData: ${JSON.stringify(targetAuthUser.app_metadata)}`)
    } else {
      console.log('Not found in auth.users')
    }
  }
}

const targetEmail = 'dewifebriani@gmail.com'
debugUser(targetEmail).catch(console.error)

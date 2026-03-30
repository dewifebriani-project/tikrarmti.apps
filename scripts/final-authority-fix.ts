import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

// Bypasses RLS with service_role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const TARGET_EMAIL = 'dewifebriani@gmail.com'
const TARGET_ID = 'eccdf0f7-e9e7-4284-bf8f-5b5816dcf682'

async function runFix() {
  console.log('--- STARTING AUTHORITY FIX ---')

  // 1. DEDUPLICATE public.users
  console.log('Checking for duplicates for:', TARGET_EMAIL)
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', TARGET_EMAIL)

  if (userError) {
    console.error('Error fetching users:', userError)
  } else if (users && users.length > 1) {
    console.log(`Found ${users.length} duplicates. Deduplicating...`)
    // Keep the one with the correct ID if possible
    const mainUser = users.find(u => u.id === TARGET_ID) || users[0]
    const otherIds = users.filter(u => u.id !== mainUser.id).map(u => u.id)
    
    if (otherIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .in('id', otherIds)
      
      if (deleteError) console.error('Error deleting duplicates:', deleteError)
      else console.log('Successfully deleted duplicates:', otherIds)
    }
  } else {
    console.log('No duplicates found or only 1 record exists.')
  }

  // 2. SYNC Profile to ADMIN
  console.log('Ensuring roles: admin in public.users...')
  const { error: updatePublicError } = await supabase
    .from('users')
    .update({ 
      roles: ['admin'], 
      role: 'admin',
      id: TARGET_ID // Force sync to the canonical ID
    })
    .eq('email', TARGET_EMAIL)

  if (updatePublicError) {
    console.error('Error updating public.users:', updatePublicError)
  } else {
    console.log('Successfully updated roles in public.users')
  }

  // 3. Fix metadata in auth.users (to prevent trigger overwrite)
  console.log('Updating auth.users app_metadata...')
  const { data: authUser, error: authError } = await supabase.auth.admin.updateUserById(
    TARGET_ID,
    {
      app_metadata: { role: 'admin', roles: ['admin'] },
      user_metadata: { full_name: 'Dewi Febriani', role: 'admin' }
    }
  )

  if (authError) {
    console.error('Error updating auth.users:', authError)
  } else {
    console.log('Successfully updated auth metadata. Trigger sync should now yield admin.')
  }

  console.log('--- FIX COMPLETE ---')
}

runFix().catch(console.error)

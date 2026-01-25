/**
 * Test script to verify ensure-user endpoint works correctly
 *
 * Usage: npx tsx scripts/test-ensure-user.ts <user_id>
 */

import { createSupabaseAdmin } from '../lib/supabase'

const supabaseAdmin = createSupabaseAdmin()

async function testEnsureUser(userId: string) {
  console.log('Testing ensure-user for user_id:', userId)

  // 1. Check if user exists in auth.users
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

  console.log('Auth user check:', {
    found: !!authUser?.user,
    email: authUser?.user?.email,
    error: authError?.message
  })

  if (!authUser?.user) {
    console.error('User not found in Supabase auth!')
    return
  }

  // 2. Check if user exists in users table
  const { data: dbUser, error: dbError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  console.log('Database user check:', {
    found: !!dbUser,
    error: dbError?.message,
    user: dbUser ? {
      id: dbUser.id,
      email: dbUser.email,
      full_name: dbUser.full_name,
      role: dbUser.role
    } : null
  })

  // 3. If not exists, create user
  if (!dbUser) {
    console.log('User not in database, creating...')

    const userMetadata = authUser.user.user_metadata || {}
    const userEmail = authUser.user.email

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: userEmail,
        full_name: userMetadata.full_name || userEmail?.split('@')[0] || '',
        role: userMetadata.role || 'calon_thalibah',
        whatsapp: userMetadata.whatsapp,
        telegram: userMetadata.telegram,
        negara: userMetadata.negara,
        provinsi: userMetadata.provinsi,
        kota: userMetadata.kota,
        alamat: userMetadata.alamat,
        zona_waktu: userMetadata.zona_waktu || 'WIB',
        jenis_kelamin: userMetadata.jenis_kelamin,
        pekerjaan: userMetadata.pekerjaan,
        alasan_daftar: userMetadata.alasan_daftar,
        provider: 'email',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating user:', insertError)
      return
    }

    console.log('User created successfully:', newUser.id)
  }

  console.log('Test complete!')
}

// Get user_id from command line argument
const userId = process.argv[2]

if (!userId) {
  console.error('Please provide a user_id as argument')
  process.exit(1)
}

testEnsureUser(userId)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err)
    process.exit(1)
  })

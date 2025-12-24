/**
 * Script to check if a user exists and has complete profile
 * Usage: npx ts-node scripts/check-user-profile.ts <user_id_or_email>
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const requiredFields = [
  'full_name',
  'tanggal_lahir',
  'tempat_lahir',
  'pekerjaan',
  'alasan_daftar',
  'jenis_kelamin',
  'negara'
]

async function checkUserProfile(identifier: string) {
  console.log(`\n🔍 Checking user profile for: ${identifier}\n`)

  try {
    // Check if identifier is email or ID
    const isEmail = identifier.includes('@')

    let query = supabase
      .from('users')
      .select('*')

    if (isEmail) {
      query = query.eq('email', identifier)
    } else {
      query = query.eq('id', identifier)
    }

    const { data: user, error } = await query.maybeSingle()

    if (error) {
      console.error('❌ Error checking user:', error.message)
      return
    }

    if (!user) {
      console.log('❌ User NOT FOUND in database!')
      console.log('\n💡 Solution:')
      console.log('   1. User needs to register via /register page')
      console.log('   2. Or complete profile via /lengkapi-profile page')
      return
    }

    console.log('✅ User found in database!')
    console.log('\nUser Info:')
    console.log(`  ID: ${user.id}`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Full Name: ${user.full_name || '❌ MISSING'}`)
    console.log(`  Role: ${user.role}`)

    console.log('\n📋 Required Fields Status:')
    const missingFields: string[] = []

    requiredFields.forEach(field => {
      const value = user[field]
      const status = value ? '✅' : '❌'
      console.log(`  ${status} ${field}: ${value || 'MISSING'}`)
      if (!value) {
        missingFields.push(field)
      }
    })

    console.log('\n📊 Profile Completeness:')
    const totalFields = requiredFields.length
    const completedFields = totalFields - missingFields.length
    const completeness = ((completedFields / totalFields) * 100).toFixed(0)
    console.log(`  ${completedFields}/${totalFields} fields complete (${completeness}%)`)

    if (missingFields.length > 0) {
      console.log('\n❌ Profile INCOMPLETE!')
      console.log(`   Missing fields: ${missingFields.join(', ')}`)
      console.log('\n💡 Solution:')
      console.log(`   User needs to complete profile via /lengkapi-profile`)
      console.log(`   Missing: ${missingFields.join(', ')}`)
    } else {
      console.log('\n✅ Profile COMPLETE!')
      console.log('   User can submit pendaftaran')
    }

    // Check if user has auth record
    console.log('\n🔐 Checking Supabase Auth...')
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id)

    if (authError) {
      console.log('❌ User NOT found in Supabase Auth!')
    } else {
      console.log('✅ User found in Supabase Auth')
      console.log(`   Email: ${authUser.user.email}`)
      console.log(`   Email Confirmed: ${authUser.user.email_confirmed_at ? 'Yes' : 'No'}`)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Main
const identifier = process.argv[2]

if (!identifier) {
  console.error('❌ Please provide user ID or email')
  console.log('\nUsage:')
  console.log('  npx ts-node scripts/check-user-profile.ts <user_id>')
  console.log('  npx ts-node scripts/check-user-profile.ts user@example.com')
  process.exit(1)
}

checkUserProfile(identifier).then(() => {
  console.log('\n✅ Check complete!\n')
  process.exit(0)
})

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUser() {
  const email = process.argv[2] || 'dewifebriani@tazkia.ac.id';

  console.log(`\n🔍 Checking user: ${email}\n`);

  try {
    // Check if user exists in users table
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    if (!user) {
      console.log('❌ User NOT found in database');
      console.log('\n💡 This user needs to register first');
      return;
    }

    console.log('✅ User found in database:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Full Name:', user.full_name || 'NOT SET');
    console.log('   Phone:', user.phone || 'NOT SET');
    console.log('   Role:', user.role);
    console.log('   Is Active:', user.is_active);
    console.log('   Created At:', user.created_at);

    // Check registration completeness
    const hasRequiredFields = !!(user.full_name && user.phone);
    const isAdmin = user.role === 'admin';
    const isComplete = isAdmin ? !!user.full_name : hasRequiredFields;

    console.log('\n📋 Registration Status:');
    console.log('   Required Fields Complete:', hasRequiredFields);
    console.log('   Is Admin:', isAdmin);
    console.log('   Can Login:', isComplete);

    if (!isComplete) {
      console.log('\n⚠️  User cannot login because:');
      if (!user.full_name) console.log('   - Full name is missing');
      if (!user.phone && !isAdmin) console.log('   - Phone number is missing');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUser();
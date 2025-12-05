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

async function updateUserPhone() {
  const email = process.argv[2] || 'dewifebriani@tazkia.ac.id';
  const phone = process.argv[3];

  if (!phone) {
    console.log('\n❌ Please provide phone number');
    console.log('Usage: node update_user_phone.js email@example.com +62812345678\n');
    process.exit(1);
  }

  console.log(`\n📝 Updating phone for: ${email}`);
  console.log(`📱 New phone: ${phone}\n`);

  try {
    // Update user phone
    const { data, error } = await supabase
      .from('users')
      .update({
        phone: phone,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating user:', error);
      return;
    }

    console.log('✅ User updated successfully:');
    console.log('   ID:', data.id);
    console.log('   Email:', data.email);
    console.log('   Name:', data.full_name);
    console.log('   Phone:', data.phone);
    console.log('   Role:', data.role);

    // Check if user can now login
    const hasRequiredFields = !!(data.full_name && data.phone);
    const isAdmin = data.role === 'admin';
    const canLogin = isAdmin ? !!data.full_name : hasRequiredFields;

    console.log('\n🔐 Login Status:');
    console.log('   Can login:', canLogin ? '✅ YES' : '❌ NO');

    if (!canLogin) {
      console.log('\n⚠️  Still missing:');
      if (!data.full_name) console.log('   - Full name');
      if (!data.phone) console.log('   - Phone number');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateUserPhone();
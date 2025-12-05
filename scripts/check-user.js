const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser(email) {
  console.log('Checking user:', email);
  console.log('---');

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, full_name, whatsapp, provinsi, kota, alamat, zona_waktu, role, telegram')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!user) {
    console.log('❌ User NOT FOUND in database');
    return;
  }

  console.log('✅ User found in database:');
  console.log(JSON.stringify(user, null, 2));
  console.log('---');
  console.log('Field validation:');
  console.log('- full_name:', user.full_name ? '✅' : '❌ MISSING');
  console.log('- provinsi:', user.provinsi ? '✅' : '❌ MISSING');
  console.log('- kota:', user.kota ? '✅' : '❌ MISSING');
  console.log('- alamat:', user.alamat ? '✅' : '❌ MISSING');
  console.log('- whatsapp:', user.whatsapp ? '✅' : '❌ MISSING');
  console.log('- zona_waktu:', user.zona_waktu ? '✅' : '❌ MISSING');
  console.log('- role:', user.role || '(none)');

  const isComplete = !!(
    user.full_name &&
    user.provinsi &&
    user.kota &&
    user.alamat &&
    user.whatsapp &&
    user.zona_waktu
  );

  console.log('---');
  console.log('Registration complete:', isComplete ? '✅ YES' : '❌ NO');

  if (!isComplete) {
    const missing = [];
    if (!user.full_name) missing.push('full_name');
    if (!user.provinsi) missing.push('provinsi');
    if (!user.kota) missing.push('kota');
    if (!user.alamat) missing.push('alamat');
    if (!user.whatsapp) missing.push('whatsapp');
    if (!user.zona_waktu) missing.push('zona_waktu');
    console.log('Missing fields:', missing.join(', '));
  }
}

const email = process.argv[2] || 'dewifebriani0284@gmail.com';
checkUser(email).then(() => process.exit(0));

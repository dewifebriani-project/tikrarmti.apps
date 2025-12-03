// Simple auth debug untuk Dewi Febriani
const { createClient } = require('@supabase/supabase-js');

// Gunakan ANON_KEY yang benar
const supabaseUrl = 'https://nmbvklixthlqtkkgqnjl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYnZrliB1LKZSI6ImlhdWI6MjcyODI5fQ.PVvANGhrqKOvqdOSuNQyC4fDMypJCiMBwxuDm_2aMIs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUser() {
  try {
    console.log('🔍 Checking user with ANON key...');

    // 1. Login dengan ANON key (untuk testing)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'dewifebriani@gmail.com',
      password: 'Dewi123' // Ganti dengan password yang benar
    });

    if (error) {
      console.error('❌ Login error:', error);
      return;
    }

    console.log('✅ Login successful!');
    console.log('User data:', data.user);

    // 2. Get user profile dengan ANON key
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id);

    if (profileError) {
      console.error('❌ Profile error:', profileError);
    } else {
      console.log('✅ Profile found:', {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        phone: profile.phone,
        role: profile.role,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      });

      // 3. Check if user has pendaftaran
      if (profile.role === 'calon_thalibah') {
        const { data: pendaftaran, error: pendaftaranError } = await supabase
          .from('pendaftaran_batch2')
          .select('status')
          .eq('userId', profile.id)
          .eq('status', 'approved');

        if (pendaftaranError) {
          console.log('❌ Error checking pendaftaran:', pendaftaranError);
        } else if (pendaftaran.length === 0) {
          console.log('⚠️  Status: calon_thalibah - Pendaftaran NOT APPROVED');
          console.log('❌ LOGIN SEHARUSNYA DITOLAK karena pendaftaran belum disetujui!');
        } else {
          console.log('✅ Status: calon_thalibah - Pendaftaran APPROVED');
          console.log('✅ Login seharusnya BERHASIL!');
        }
      } else if (profile.role === 'thalibah') {
        console.log('✅ Status: thalibah (approved)');
        console.log('✅ Login seharusnya BERHASIL!');
      }
    }

    // 4. Logout
    await supabase.auth.signOut();
    console.log('🔓 Logged out');

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

checkUser();
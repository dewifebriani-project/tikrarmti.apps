const { createClient } = require('@supabase/supabase-js');

// Configuration from .env.local
const supabaseUrl = 'https://nmbvklixthlqtkkgqnjl.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYnZrbGl4dGhscXRra2dxbmpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYyNTgyOSwiZXhwIjoyMDgwMjAxODI5fQ.PVvANGhrqKOvqdOSuNQyC4fDMypJCiMBwxuDm_2aMIs';

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixUserRoles() {
  try {
    console.log('🔧 Memperbaiki role user...');

    // Get all users with 'thalibah' role
    const { data: thalibahUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('role', 'thalibah');

    if (fetchError) {
      console.error('❌ Error mengambil data user:', fetchError);
      return false;
    }

    console.log(`📊 Ditemukan ${thalibahUsers.length} user dengan role 'thalibah'`);

    // Check if each user has approved pendaftaran
    let upgradedCount = 0;
    let unchangedCount = 0;

    for (const user of thalibahUsers) {
      // Check if user has approved pendaftaran
      const { data: pendaftaran, error: pendaftaranError } = await supabase
        .from('pendaftaran_batch2')
        .select('id, status')
        .eq('userId', user.id)
        .eq('status', 'approved')
        .single();

      if (pendaftaranError) {
        // User doesn't have approved pendaftaran, downgrade to calon_thalibah
        console.log(`⬇️  Downgrade ${user.email} dari 'thalibah' ke 'calon_thalibah' (belum ada pendaftaran disetujui)`);

        const { error: updateError } = await supabase
          .from('users')
          .update({
            role: 'calon_thalibah',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          console.error(`❌ Gagal downgrade ${user.email}:`, updateError);
        } else {
          upgradedCount++;
        }
      } else {
        console.log(`✅ ${user.email} tetap 'thalibah' (pendaftaran disetujui: ${pendaftaran.id})`);
        unchangedCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`⬇️  Di-downgrade ke 'calon_thalibah': ${upgradedCount} user`);
    console.log(`✅ Tetap 'thalibah': ${unchangedCount} user`);

    // Get current role statistics
    const { data: roleStats, error: roleError } = await supabase
      .from('users')
      .select('role')
      .then(({ data }) => {
        const stats = {};
        data.forEach(user => {
          stats[user.role] = (stats[user.role] || 0) + 1;
        });
        return { data: stats };
      });

    if (!roleError && roleStats.data) {
      console.log('\n📊 Role Statistics:');
      Object.entries(roleStats.data).forEach(([role, count]) => {
        console.log(`  ${role}: ${count} user`);
      });
    }

    return true;

  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Run the fix
fixUserRoles().then(success => {
  if (success) {
    console.log('\n🎉 Role user berhasil diperbaiki!');
    console.log('Sekarang user yang belum mendaftar program memiliki role "calon_thalibah"');
    console.log('User yang sudah disetujui tetap memiliki role "thalibah"');
  } else {
    console.log('\n⚠️  Terjadi kesalahan saat memperbaiki role user');
  }
  process.exit(0);
});
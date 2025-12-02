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

async function addPhoneField() {
  try {
    console.log('Adding phone field to users table...');

    // Execute raw SQL to add phone column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;'
    });

    if (error) {
      // Try direct SQL if RPC fails
      console.log('RPC method failed, trying direct approach...');

      // Test if phone column exists
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('id, email, full_name, phone')
        .limit(1);

      if (testError && testError.message.includes('column "phone" does not exist')) {
        console.error('❌ Phone field does not exist in database');
        console.log('Error details:', testError);

        console.log('\n📋 MANUAL FIX REQUIRED:');
        console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to SQL Editor');
        console.log('4. Run this SQL command:');
        console.log('   ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;');
        console.log('\nThen try logging in again.');

        return false;
      } else if (testError) {
        console.error('❌ Other database error:', testError);
        return false;
      } else {
        console.log('✅ Phone field exists in database!');

        // Check if user dewifebriani@gmail.com exists
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', 'dewifebriani@gmail.com')
          .single();

        if (userError) {
          console.error('❌ Error finding user:', userError);
          return false;
        }

        console.log('✅ User found:', userData);
        console.log(`Phone field status: ${userData.phone ? 'filled' : 'empty'}`);

        // If phone is empty, let's add a placeholder
        if (!userData.phone) {
          const { data: updateData, error: updateError } = await supabase
            .from('users')
            .update({ phone: '08123456789' }) // Placeholder phone
            .eq('email', 'dewifebriani@gmail.com');

          if (updateError) {
            console.error('❌ Error updating phone:', updateError);
          } else {
            console.log('✅ Phone field updated with placeholder value');
          }
        }

        return true;
      }
    } else {
      console.log('✅ Phone field added successfully!');
      return true;
    }

  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Run the fix
addPhoneField().then(success => {
  if (success) {
    console.log('\n🎉 Database fix completed!');
    console.log('Now you should be able to login successfully.');
  } else {
    console.log('\n⚠️  Manual intervention required');
  }
  process.exit(0);
});
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyDatabaseFix() {
  try {
    console.log('🔧 Applying database fix for authentication...');

    // Drop existing policies and triggers that might conflict
    console.log('\n1️⃣ Dropping existing policies and triggers...');

    // Drop trigger first
    await supabaseAdmin.rpc('exec_sql', {
      sql: 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;'
    }).catch(() => console.log('Trigger already dropped or not found'));

    // Drop existing policies on users table
    await supabaseAdmin.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Users can view own profile" ON users;
        DROP POLICY IF EXISTS "Users can update own profile" ON users;
        DROP POLICY IF EXISTS "Users can insert own profile" ON users;
        DROP POLICY IF EXISTS "Service role bypass RLS" ON users;
      `
    }).catch(() => console.log('Policies already dropped or not found'));

    // Recreate the trigger function without password_hash dependency
    console.log('\n2️⃣ Creating updated trigger function...');

    const { error: functionError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Create a user profile for the new authenticated user
            INSERT INTO public.users (id, email, full_name, role, password_hash)
            VALUES (
                new.id,
                new.email,
                COALESCE(new.raw_user_meta_data->>'full_name', new.email),
                COALESCE(new.raw_user_meta_data->>'role', 'thalibah'),
                'managed_by_auth_system'
            );
            RETURN new;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });

    if (functionError) {
      console.error('❌ Error creating function:', functionError);
      return;
    }

    // Recreate trigger
    console.log('\n3️⃣ Creating trigger...');

    const { error: triggerError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `
    });

    if (triggerError) {
      console.error('❌ Error creating trigger:', triggerError);
      return;
    }

    // Create simplified RLS policies
    console.log('\n4️⃣ Creating RLS policies...');

    const { error: policyError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Service role bypass for admin operations
        CREATE POLICY "Service role can bypass RLS" ON users
            FOR ALL USING (auth.role() = 'service_role');

        -- Enable read access for users based on user_id
        CREATE POLICY "Enable read access for all users based on user_id" ON users
            FOR SELECT USING (auth.uid() = id);

        -- Enable insert for authentication based users
        CREATE POLICY "Enable insert for authentication based users" ON users
            FOR INSERT WITH CHECK (auth.uid() = id);

        -- Enable update for users based on user_id
        CREATE POLICY "Enable update for users based on user_id" ON users
            FOR UPDATE USING (auth.uid() = id);
      `
    });

    if (policyError) {
      console.error('❌ Error creating policies:', policyError);
      return;
    }

    console.log('\n✅ Database fix applied successfully!');

    // Verify current state
    console.log('\n5️⃣ Verifying current policies...');
    const { data: policies, error: verifyError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'users');

    if (verifyError) {
      console.error('⚠️ Could not verify policies:', verifyError);
    } else {
      console.log('Current policies on users table:');
      policies?.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });
    }

  } catch (error) {
    console.error('❌ Error applying database fix:', error);
  }
}

applyDatabaseFix();
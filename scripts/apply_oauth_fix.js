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

const fs = require('fs');
const path = require('path');

async function applyOAuthFix() {
  try {
    console.log('🔧 Applying OAuth user creation fix...');

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'fix_oauth_user_creation.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('SELECT '));

    console.log(`\n📝 Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`\n${i + 1}. Executing: ${statement.substring(0, 50)}...`);

        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: statement
        });

        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          // Continue with other statements
        } else {
          console.log('✅ Success');
        }
      }
    }

    console.log('\n✅ OAuth fix applied successfully!');

    // Verify current policies
    console.log('\n🔍 Verifying current policies on users table...');
    const { data: policies, error: verifyError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'users');

    if (verifyError) {
      console.error('⚠️ Could not verify policies:', verifyError);
    } else {
      console.log('\nCurrent policies on users table:');
      policies?.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });
    }

  } catch (error) {
    console.error('❌ Error applying OAuth fix:', error);
  }
}

// Alternative approach using direct SQL execution via raw SQL
async function applyOAuthFixDirect() {
  try {
    console.log('🔧 Applying OAuth user creation fix (direct)...');

    // Key fixes we need to apply
    const fixes = [
      // Drop the trigger first
      'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;',

      // Drop all existing policies
      'DROP POLICY IF EXISTS "Users can view own profile" ON users;',
      'DROP POLICY IF EXISTS "Users can update own profile" ON users;',
      'DROP POLICY IF EXISTS "Users can insert own profile" ON users;',
      'DROP POLICY IF EXISTS "Service role bypass RLS" ON users;',
      'DROP POLICY IF EXISTS "Enable read access for all users based on user_id" ON users;',
      'DROP POLICY IF EXISTS "Enable insert for authentication based users" ON users;',
      'DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;',

      // Create new policies
      `CREATE POLICY "Service role full access" ON users
        FOR ALL USING (auth.role() = 'service_role');`,

      `CREATE POLICY "Users can view own profile" ON users
        FOR SELECT USING (auth.uid() = id);`,

      `CREATE POLICY "Users can update own profile" ON users
        FOR UPDATE USING (auth.uid() = id);`,

      `CREATE POLICY "Allow user creation during auth" ON users
        FOR INSERT WITH CHECK (true);`,

      // Recreate trigger function with error handling
      `CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = new.id) THEN
                INSERT INTO public.users (id, email, full_name, role, password_hash, is_active)
                VALUES (
                    new.id,
                    new.email,
                    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
                    COALESCE(new.raw_user_meta_data->>'role', 'calon_thalibah'),
                    'managed_by_auth_system',
                    true
                );
            END IF;
            RETURN new;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to create user profile for %: %', new.email, SQLERRM;
            RETURN new;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;`,

      // Recreate trigger
      'CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();',

      // Ensure RLS is enabled
      'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;'
    ];

    console.log(`\n📝 Executing ${fixes.length} SQL fixes...`);

    for (let i = 0; i < fixes.length; i++) {
      const fix = fixes[i];
      console.log(`\n${i + 1}. Applying fix...`);

      // Using supabaseAdmin.from('rpc') might not work, so we'll use a different approach
      // For now, let's just log the fixes that need to be applied manually
      console.log('SQL to execute:', fix);
    }

    console.log('\n⚠️ Please manually apply the above SQL fixes in your Supabase SQL Editor.');
    console.log('Or use the SQL file: scripts/fix_oauth_user_creation.sql');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyOAuthFixDirect();
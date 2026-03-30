import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = 'dewifebriani@gmail.com';

async function forceAdmin() {
  console.log(`Force-elevating ${ADMIN_EMAIL} to Admin...`);

  // 1. Get the user from Auth (Search by confirmed ID first)
  console.log('Searching for user...');
  const CONFIRMED_ID = 'eccdf0f7-e9e7-4284-bf8f-5b5816dcf682';
  let authUser = null;

  const { data: { user: foundUser }, error: getError } = await supabase.auth.admin.getUserById(CONFIRMED_ID);
  
  if (foundUser) {
    authUser = foundUser;
    console.log(`Found confirmed user by ID: ${authUser.id} (${authUser.email})`);
  } else {
    console.warn(`User ID ${CONFIRMED_ID} not found directly. Searching by email...`);
    // Fallback to searching by email if ID not found
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError.message);
      return;
    }
    authUser = users.find(u => u.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim());
  }

  if (!authUser) {
    console.error(`User ${ADMIN_EMAIL} / ${CONFIRMED_ID} NOT found in Supabase Auth!`);
    return;
  }

  console.log(`Found Auth User: ${authUser.id}`);

  // 2. Check in public.users
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('email', ADMIN_EMAIL)
    .maybeSingle();

  if (fetchError) {
    console.warn('Error fetching from public.users:', fetchError.message);
  }

  if (userData) {
    console.log(`Found existing record with ID: ${userData.id}. Updating...`);
    const { error: updateError } = await supabase
      .from('users')
      .update({
        id: authUser.id, // Sync ID
        role: 'admin',
        roles: ['admin'],
        is_active: true
      })
      .eq('email', ADMIN_EMAIL);

    if (updateError) {
      console.error('Update failed:', updateError.message);
    } else {
      console.log('Update successful! User is now Admin.');
    }
  } else {
    console.log('Record missing. Creating new admin record...');
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        email: ADMIN_EMAIL,
        full_name: authUser.user_metadata?.full_name || 'Dewi Febriani',
        role: 'admin',
        roles: ['admin'],
        is_active: true,
        pekerjaan: 'Administrator', // Fix the NOT NULL constraint
        alasan_daftar: 'Admin system access',
        negara: 'Indonesia',
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Insert failed:', insertError.message);
    } else {
      console.log('Insert successful! Admin record created.');
    }
  }

  // 3. Update App Metadata in Auth (for JWT detection)
  console.log('Updating Auth App Metadata...');
  const { error: metaError } = await supabase.auth.admin.updateUserById(authUser.id, {
    app_metadata: { role: 'admin', roles: ['admin'] }
  });

  if (metaError) {
    console.error('Auth Metadata update failed:', metaError.message);
  } else {
    console.log('Auth Metadata updated successfully!');
  }
}

forceAdmin();

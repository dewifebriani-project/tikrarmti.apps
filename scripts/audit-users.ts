
import { createSupabaseAdmin } from '../lib/supabase';
import { validate as isUuid } from 'uuid';

async function auditUsers() {
  const supabase = createSupabaseAdmin();
  console.log('--- STARTING USER AUDIT ---');

  // 1. Fetch all profiles from public.users
  const { data: profiles, error: profileError } = await supabase
    .from('users')
    .select('id, email, full_name');

  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }

  console.log(`Total profiles in public.users: ${profiles.length}`);

  // 2. Filter corrupted profiles
  const validProfiles = [];
  const corruptedProfiles = [];

  for (const profile of profiles) {
    const hasValidUuid = isUuid(profile.id);
    const hasValidEmail = profile.email && profile.email.includes('@');
    
    if (hasValidUuid && hasValidEmail) {
      validProfiles.push(profile);
    } else {
      corruptedProfiles.push(profile);
    }
  }

  console.log(`Valid profiles detected: ${validProfiles.length}`);
  console.log(`Corrupted/Garbage profiles detected: ${corruptedProfiles.length}`);

  if (corruptedProfiles.length > 0) {
    console.log('--- SAMPLE CORRUPTED PROFILES ---');
    console.log(JSON.stringify(corruptedProfiles.slice(0, 10), null, 2));

    // Ask to delete? Plan already says YES (approved).
    console.log('Attempting to delete corrupted profiles...');
    const corruptedIds = corruptedProfiles.map(p => p.id);
    
    // We can't easily delete by ID if the ID itself is not a UUID when the schema expects a UUID.
    // However, Supabase/PG might allow it? Let's try.
    // If it fails, we might need to delete using a raw query or email.
    
    // Actually, if the PK column is UUID type, trying to delete non-UUID strings will 100% fail at the DB level.
    // Let's check the schema.
  }

  // 3. Check against Auth
  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error listing auth users:', authError);
    return;
  }

  const authEmails = new Set(authUsers.map(u => u.email?.toLowerCase()));
  const missingInAuth = validProfiles.filter(p => !authEmails.has(p.email?.toLowerCase()));

  console.log(`Valid profiles missing in Auth: ${missingInAuth.length}`);
  if (missingInAuth.length > 0) {
    console.log('--- SAMPLE MISSING PROFILES ---');
    console.log(JSON.stringify(missingInAuth.slice(0, 5), null, 2));
  }
}

auditUsers().catch(console.error);

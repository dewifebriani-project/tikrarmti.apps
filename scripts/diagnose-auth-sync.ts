
import { createSupabaseAdmin } from '../lib/supabase';

async function diagnoseUserDiscrepancy() {
  const supabase = createSupabaseAdmin();
  
  console.log('--- DIAGNOSING USER DISCREPANCY ---');
  
  // 1. Get all users from public.users
  const { data: publicUsers, error: publicError } = await supabase
    .from('users')
    .select('id, email, full_name, roles');
    
  if (publicError) {
    console.error('Error fetching public users:', publicError);
    return;
  }
  
  console.log(`Total users in public.users: ${publicUsers.length}`);
  
  // 2. Get all users from auth.users (requires service role)
  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching auth users:', authError);
    return;
  }
  
  console.log(`Total users in auth.users: ${authUsers.length}`);
  
  // 3. Find Orphaned Profiles (exists in public, NOT in auth)
  const authEmailSet = new Set(authUsers.map(u => u.email?.toLowerCase()));
  const orphanedProfiles = publicUsers.filter(u => !authEmailSet.has(u.email?.toLowerCase()));
  
  console.log(`Orphaned profiles (in public, NOT in auth): ${orphanedProfiles.length}`);
  if (orphanedProfiles.length > 0) {
    console.log('Sample orphans:', orphanedProfiles.slice(0, 5).map(o => ({ email: o.email, id: o.id })));
  }
  
  // 4. Find Orphaned Auth (exists in auth, NOT in public)
  const publicEmailSet = new Set(publicUsers.map(u => u.email?.toLowerCase()));
  const orphanedAuth = authUsers.filter(u => !publicEmailSet.has(u.email?.toLowerCase()));
  
  console.log(`Orphaned auth (in auth, NOT in public): ${orphanedAuth.length}`);
  if (orphanedAuth.length > 0) {
    console.log('Sample orphaned auth:', orphanedAuth.slice(0, 5).map(o => ({ email: o.email, id: o.id })));
  }
  
  // 5. Check ID mismatches for matching emails
  const authMap = new Map(authUsers.map(u => [u.email?.toLowerCase(), u.id]));
  const idMismatches = publicUsers
    .filter(u => authMap.has(u.email?.toLowerCase()) && authMap.get(u.email?.toLowerCase()) !== u.id)
    .map(u => ({ email: u.email, publicId: u.id, authId: authMap.get(u.email?.toLowerCase()) }));
    
  console.log(`ID mismatches (same email, different UUID): ${idMismatches.length}`);
  if (idMismatches.length > 0) {
    console.log('Sample mismatches:', idMismatches.slice(0, 5));
  }
}

diagnoseUserDiscrepancy().catch(console.error);


import { createSupabaseAdmin } from '../lib/supabase';
import { validate as isUuid } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

const TEMP_PASSWORD = 'Tikrarmti2026!';
const LOG_FILE = path.join(process.cwd(), 'tmp', 'sync_progress.txt');

// Ensure tmp exists
if (!fs.existsSync(path.dirname(LOG_FILE))) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
}

function logProgress(msg: string) {
  const time = new Date().toLocaleTimeString();
  const fullMsg = `[${time}] ${msg}`;
  console.log(fullMsg);
  fs.appendFileSync(LOG_FILE, fullMsg + '\n');
}

async function syncAuthUsers() {
  fs.writeFileSync(LOG_FILE, '--- STARTING AUTH SYNCHRONIZATION ---\n');
  const supabase = createSupabaseAdmin();

  // 1. Fetch all profiles from public.users
  logProgress('Fetching profiles from public.users...');
  const { data: profiles, error: profileError } = await supabase
    .from('users')
    .select('id, email, full_name');

  if (profileError) {
    logProgress(`Critical Error fetching profiles: ${profileError.message}`);
    return;
  }

  logProgress(`Total profiles in public.users: ${profiles.length}`);

  // 2. Fetch all current Auth users
  logProgress('Fetching current Auth users...');
  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    logProgress(`Critical Error listing auth users: ${authError.message}`);
    return;
  }

  const authEmails = new Set(authUsers.map(u => u.email?.toLowerCase()));
  const authIds = new Set(authUsers.map(u => u.id));

  logProgress(`Current users in Supabase Auth: ${authUsers.length}`);

  // 3. Identify and Sync missing users
  let syncCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  let corruptedCount = 0;

  logProgress('Starting sync process user by user...');

  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    const email = profile.email?.toLowerCase();
    const id = profile.id;

    if (i % 20 === 0 && i > 0) {
      logProgress(`Progress: ${i}/${profiles.length} processed...`);
    }

    // Safety checks
    if (!isUuid(id) || !email || !email.includes('@')) {
      corruptedCount++;
      continue;
    }

    if (authEmails.has(email) || authIds.has(id)) {
      skipCount++;
      continue;
    }

    // Attempt to create in Auth
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      id: id,
      email: email,
      password: TEMP_PASSWORD,
      email_confirm: true,
      user_metadata: {
         full_name: profile.full_name,
         synced_at: new Date().toISOString()
      }
    });

    if (createError) {
      if (createError.message.toLowerCase().includes('already exists')) {
          skipCount++;
      } else {
          logProgress(`Error syncing ${email}: ${createError.message}`);
          errorCount++;
      }
    } else {
      syncCount++;
    }
  }

  logProgress('--- SYNC COMPLETED ---');
  logProgress(`Total Synced: ${syncCount}`);
  logProgress(`Skipped (Exists): ${skipCount}`);
  logProgress(`Garbage/Invalid: ${corruptedCount}`);
  logProgress(`Errors: ${errorCount}`);
}

syncAuthUsers().catch(err => {
  logProgress(`FATAL ERROR: ${err.message}`);
  process.exit(1);
});

/**
 * One-off admin data fix (run locally where you have network access to Supabase —
 * the sandboxed Cowork environment can't reach *.supabase.co, so this couldn't be
 * executed from there).
 *
 * Task 1: Ainun Mardhiyah — WhatsApp 081266892196 -> 085185448454
 * Task 2: Aisyah2020@gmail.com -> abdaish@gmail.com
 *
 * Usage:
 *   node scratch/fix-ainun-phone-aisyah-email.mjs            # dry run (default) — just prints what it found/would change
 *   node scratch/fix-ainun-phone-aisyah-email.mjs --apply    # actually performs the updates
 *
 * What this does, and why (see chat for full context):
 * - Phone (Ainun): updates public.users.whatsapp, plus wa_phone on any
 *   pendaftaran_tikrar_tahfidz rows that still hold the OLD number (so her
 *   registration record doesn't go stale/mismatched), plus confirmed_wa_phone on
 *   daftar_ulang_submissions if present.
 * - Email (Aisyah): updates the login credential via
 *   supabase.auth.admin.updateUserById(...) — NOT a raw UPDATE on public.users.email.
 *   auth.users is the source of truth; a DB trigger (on_auth_user_updated, see
 *   supabase/migrations/20260217_sync_auth_email_trigger.sql) automatically copies
 *   the new email into public.users.email afterwards. Editing public.users.email
 *   directly (which is what the admin panel's "Kelola User" edit form currently
 *   does) would NOT change her login credential — she'd still only be able to log
 *   in with the old email while the UI shows the new one. This script also updates
 *   the `email` column on any pendaftaran_tikrar_tahfidz rows that still hold the
 *   OLD address, for the same "stale registration snapshot" reason as above.
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const APPLY = process.argv.includes('--apply');

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

const OLD_PHONE_VARIANTS = ['081266892196', '6281266892196', '+6281266892196', '62812-6689-2196'];
const NEW_PHONE = '085185448454';

const OLD_EMAIL = 'aisyah2020@gmail.com';
const NEW_EMAIL = 'abdaish@gmail.com';

function log(...args) {
  console.log(...args);
}

async function fixAinunPhone() {
  log('\n========== TASK 1: Ainun Mardhiyah — nomor HP ==========');

  const { data: candidates, error } = await supabase
    .from('users')
    .select('id, full_name, email, whatsapp')
    .ilike('full_name', '%ainun%mardhiyah%');

  if (error) {
    log('ERROR mencari user:', error.message);
    return;
  }

  if (!candidates || candidates.length === 0) {
    log('Tidak ketemu user dengan nama mengandung "Ainun Mardhiyah". Cek ejaan nama atau cari manual.');
    return;
  }

  if (candidates.length > 1) {
    log('Ada lebih dari satu user cocok, ini butuh dipilih manual:');
    log(JSON.stringify(candidates, null, 2));
    return;
  }

  const ainun = candidates[0];
  log('Ketemu:', JSON.stringify(ainun, null, 2));

  const oldNumberMatches = OLD_PHONE_VARIANTS.includes((ainun.whatsapp || '').replace(/\s|-/g, ''));
  if (!oldNumberMatches) {
    log(`PERHATIAN: whatsapp saat ini di DB ("${ainun.whatsapp}") tidak persis cocok dengan nomor lama yang disebutkan (081266892196). Lanjut update ke nomor baru tetap dilakukan, tapi mohon dicek manual dulu kalau ragu.`);
  }

  if (APPLY) {
    const { error: upErr } = await supabase
      .from('users')
      .update({ whatsapp: NEW_PHONE, updated_at: new Date().toISOString() })
      .eq('id', ainun.id);
    log(upErr ? `GAGAL update users.whatsapp: ${upErr.message}` : `OK: users.whatsapp -> ${NEW_PHONE}`);
  } else {
    log(`[DRY RUN] Akan update users.whatsapp: "${ainun.whatsapp}" -> "${NEW_PHONE}"`);
  }

  // Update stale copies on registration rows
  const { data: regs } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('id, wa_phone, batch_id')
    .eq('user_id', ainun.id);

  for (const reg of regs || []) {
    const matchesOld = OLD_PHONE_VARIANTS.includes((reg.wa_phone || '').replace(/\s|-/g, ''));
    if (!matchesOld) {
      log(`  Registrasi ${reg.id} (batch ${reg.batch_id}): wa_phone = "${reg.wa_phone}" (tidak cocok nomor lama, dilewati — cek manual kalau perlu)`);
      continue;
    }
    if (APPLY) {
      const { error: regErr } = await supabase
        .from('pendaftaran_tikrar_tahfidz')
        .update({ wa_phone: NEW_PHONE })
        .eq('id', reg.id);
      log(regErr ? `  GAGAL update registrasi ${reg.id}: ${regErr.message}` : `  OK: registrasi ${reg.id}.wa_phone -> ${NEW_PHONE}`);
    } else {
      log(`  [DRY RUN] Registrasi ${reg.id} (batch ${reg.batch_id}): wa_phone "${reg.wa_phone}" -> "${NEW_PHONE}"`);
    }
  }

  const { data: daftarUlangRows } = await supabase
    .from('daftar_ulang_submissions')
    .select('id, confirmed_wa_phone')
    .eq('user_id', ainun.id);

  for (const row of daftarUlangRows || []) {
    const matchesOld = OLD_PHONE_VARIANTS.includes((row.confirmed_wa_phone || '').replace(/\s|-/g, ''));
    if (!matchesOld) continue;
    if (APPLY) {
      const { error: duErr } = await supabase
        .from('daftar_ulang_submissions')
        .update({ confirmed_wa_phone: NEW_PHONE })
        .eq('id', row.id);
      log(duErr ? `  GAGAL update daftar_ulang_submissions ${row.id}: ${duErr.message}` : `  OK: daftar_ulang_submissions ${row.id}.confirmed_wa_phone -> ${NEW_PHONE}`);
    } else {
      log(`  [DRY RUN] daftar_ulang_submissions ${row.id}: confirmed_wa_phone "${row.confirmed_wa_phone}" -> "${NEW_PHONE}"`);
    }
  }
}

async function fixAisyahEmail() {
  log('\n========== TASK 2: Aisyah2020@gmail.com -> abdaish@gmail.com ==========');

  // Find the auth user (source of truth for login email)
  const { data: authList, error: authErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (authErr) {
    log('ERROR listUsers:', authErr.message);
    return;
  }
  const authMatches = (authList?.users || []).filter(u => (u.email || '').toLowerCase() === OLD_EMAIL);

  if (authMatches.length === 0) {
    log(`Tidak ketemu auth user dengan email "${OLD_EMAIL}". Cek ejaan / mungkin sudah pernah diubah.`);
    return;
  }
  if (authMatches.length > 1) {
    log('Ada lebih dari satu match, butuh dipilih manual:', JSON.stringify(authMatches.map(u => ({ id: u.id, email: u.email })), null, 2));
    return;
  }
  const authUser = authMatches[0];
  log('Ketemu auth user:', authUser.id, authUser.email);

  const targetTaken = (authList?.users || []).some(u => (u.email || '').toLowerCase() === NEW_EMAIL);
  if (targetTaken) {
    log(`STOP: email tujuan "${NEW_EMAIL}" sudah dipakai user lain. Tidak melanjutkan.`);
    return;
  }

  if (APPLY) {
    const { error: updErr } = await supabase.auth.admin.updateUserById(authUser.id, {
      email: NEW_EMAIL,
      email_confirm: true,
    });
    log(updErr ? `GAGAL update auth email: ${updErr.message}` : `OK: auth.users.email -> ${NEW_EMAIL} (public.users.email akan ikut ter-sync lewat trigger on_auth_user_updated)`);
  } else {
    log(`[DRY RUN] Akan update auth.users.email (via admin API): "${OLD_EMAIL}" -> "${NEW_EMAIL}"`);
  }

  // Update stale copies on registration rows
  const { data: regs } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('id, email, batch_id')
    .eq('user_id', authUser.id);

  for (const reg of regs || []) {
    if ((reg.email || '').toLowerCase() !== OLD_EMAIL) {
      log(`  Registrasi ${reg.id} (batch ${reg.batch_id}): email = "${reg.email}" (tidak cocok email lama, dilewati)`);
      continue;
    }
    if (APPLY) {
      const { error: regErr } = await supabase
        .from('pendaftaran_tikrar_tahfidz')
        .update({ email: NEW_EMAIL })
        .eq('id', reg.id);
      log(regErr ? `  GAGAL update registrasi ${reg.id}: ${regErr.message}` : `  OK: registrasi ${reg.id}.email -> ${NEW_EMAIL}`);
    } else {
      log(`  [DRY RUN] Registrasi ${reg.id} (batch ${reg.batch_id}): email "${reg.email}" -> "${NEW_EMAIL}"`);
    }
  }
}

async function main() {
  log(APPLY ? '*** MODE: APPLY (akan benar-benar mengubah data) ***' : '*** MODE: DRY RUN (tidak mengubah apa pun, cuma menampilkan rencana) ***');
  await fixAinunPhone();
  await fixAisyahEmail();
  log('\nSelesai.');
}

main().catch(console.error);

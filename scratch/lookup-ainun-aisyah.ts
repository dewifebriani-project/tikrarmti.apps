import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function main() {
  console.log('=== 1. Cari Ainun Mardhiyah (users table) ===');
  const { data: ainunUsers, error: e1 } = await supabase
    .from('users')
    .select('id, full_name, email, whatsapp, roles')
    .ilike('full_name', '%ainun%mardhiyah%');
  console.log(JSON.stringify(ainunUsers, null, 2), e1);

  console.log('\n=== 2. Cari nomor lama 081266892196 di users.whatsapp ===');
  const { data: byPhone } = await supabase
    .from('users')
    .select('id, full_name, email, whatsapp')
    .or('whatsapp.eq.081266892196,whatsapp.eq.6281266892196,whatsapp.eq.+6281266892196');
  console.log(JSON.stringify(byPhone, null, 2));

  console.log('\n=== 3. Cari di pendaftaran_tikrar_tahfidz (wa_phone) untuk Ainun ===');
  if (ainunUsers && ainunUsers.length > 0) {
    for (const u of ainunUsers) {
      const { data: regs } = await supabase
        .from('pendaftaran_tikrar_tahfidz')
        .select('id, user_id, full_name, wa_phone, telegram_phone, email, batch_id, status, selection_status, created_at')
        .eq('user_id', u.id);
      console.log(`Registrations for ${u.full_name} (${u.id}):`, JSON.stringify(regs, null, 2));

      const { data: daftarUlang } = await supabase
        .from('daftar_ulang_submissions')
        .select('id, user_id, confirmed_wa_phone, confirmed_full_name, partner_wa_phone')
        .eq('user_id', u.id);
      console.log(`Daftar Ulang for ${u.full_name}:`, JSON.stringify(daftarUlang, null, 2));
    }
  }

  console.log('\n=== 4. Cari Aisyah (Aisyah2020@gmail.com) di users table ===');
  const { data: aisyahUsers, error: e2 } = await supabase
    .from('users')
    .select('id, full_name, email, whatsapp, roles')
    .ilike('email', '%aisyah2020%');
  console.log(JSON.stringify(aisyahUsers, null, 2), e2);

  console.log('\n=== 5. Cari Aisyah di auth.users (via admin API listUsers, filter by email) ===');
  const { data: authList, error: e3 } = await supabase.auth.admin.listUsers();
  const matchAuth = authList?.users?.filter((u: any) => (u.email || '').toLowerCase().includes('aisyah2020'));
  console.log(JSON.stringify(matchAuth?.map(u => ({ id: u.id, email: u.email, confirmed: u.email_confirmed_at })), null, 2), e3);

  console.log('\n=== 6. Cek apakah abdaish@gmail.com sudah dipakai user lain ===');
  const { data: targetEmailUsers } = await supabase
    .from('users')
    .select('id, full_name, email')
    .ilike('email', '%abdaish%');
  console.log(JSON.stringify(targetEmailUsers, null, 2));
  const matchAuthTarget = authList?.users?.filter((u: any) => (u.email || '').toLowerCase().includes('abdaish'));
  console.log('auth.users match for abdaish:', JSON.stringify(matchAuthTarget?.map(u => ({ id: u.id, email: u.email })), null, 2));

  console.log('\n=== 7. Cari registrasi terkait Aisyah (jika user ketemu) ===');
  if (aisyahUsers && aisyahUsers.length > 0) {
    for (const u of aisyahUsers) {
      const { data: regs } = await supabase
        .from('pendaftaran_tikrar_tahfidz')
        .select('id, user_id, full_name, email, wa_phone, batch_id, status, selection_status, created_at')
        .eq('user_id', u.id);
      console.log(`Registrations for ${u.full_name} (${u.id}):`, JSON.stringify(regs, null, 2));
    }
  }
}
main().catch(console.error);

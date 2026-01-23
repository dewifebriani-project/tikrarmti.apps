import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();

    // 1. Cek daftar_ulang_submissions - ALL statuses
    const { data: daftarUlangUsers, error: daftarUlangError } = await supabase
      .from('daftar_ulang_submissions')
      .select('user_id, status');

    // 1b. Cek hanya approved/submitted
    const { data: daftarUlangApproved, error: approvedError } = await supabase
      .from('daftar_ulang_submissions')
      .select('user_id, status')
      .in('status', ['approved', 'submitted']);

    // 2. Cek jurnal_records
    const { data: jurnalRecords, error: jurnalError } = await supabase
      .from('jurnal_records')
      .select('id, user_id, blok, created_at')
      .order('created_at', { ascending: false });

    // 3. Cek apakah user jurnal ada di daftar_ulang (any status)
    const jurnalUserIds = jurnalRecords?.map((j: any) => j.user_id) || [];

    // 4. Cek public.users untuk jurnal user
    const { data: jurnalUsers, error: jurnalUsersError } = await supabase
      .from('users')
      .select('id, full_name, nama_kunyah, whatsapp, roles')
      .in('id', jurnalUserIds);

    // 5. Cek daftar_ulang untuk jurnal users specifically
    const { data: jurnalUserDaftarUlang, error: jurnalDaftarUlangError } = await supabase
      .from('daftar_ulang_submissions')
      .select('user_id, status')
      .in('user_id', jurnalUserIds);

    // Create map for quick lookup
    const daftarUlangMap = new Map();
    jurnalUserDaftarUlang?.forEach((d: any) => {
      daftarUlangMap.set(d.user_id, d.status);
    });

    return NextResponse.json({
      success: true,
      debug: {
        daftar_ulang_all: {
          count: daftarUlangUsers?.length || 0,
          statuses: daftarUlangUsers?.reduce((acc: any, d: any) => {
            acc[d.status] = (acc[d.status] || 0) + 1;
            return acc;
          }, {}) || {},
        },
        daftar_ulang_approved_submitted: {
          count: daftarUlangApproved?.length || 0,
          error: approvedError?.message
        },
        jurnal_records: {
          count: jurnalRecords?.length || 0,
          sample: jurnalRecords?.map((j: any) => ({ id: j.id, user_id: j.user_id, blok: j.blok })) || [],
          error: jurnalError?.message
        },
        jurnal_users_in_public: {
          count: jurnalUsers?.length || 0,
          users: jurnalUsers?.map((u: any) => ({
            id: u.id,
            full_name: u.full_name,
            nama_kunyah: u.nama_kunyah,
            whatsapp: u.whatsapp,
            roles: u.roles,
          })) || [],
        },
        jurnal_users_daftar_ulang_status: jurnalUserIds.map((uid: string) => ({
          user_id: uid,
          daftar_ulang_status: daftarUlangMap.get(uid) || 'NOT_FOUND',
          has_daftar_ulang: daftarUlangMap.has(uid),
        })),
        jurnal_user_ids_not_in_daftar_ulang: jurnalRecords
          ?.filter((j: any) => !daftarUlangMap.has(j.user_id))
          .map((j: any) => ({ id: j.id, user_id: j.user_id })) || [],
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

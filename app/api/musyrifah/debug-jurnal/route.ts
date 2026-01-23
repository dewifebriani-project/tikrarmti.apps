import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();

    // 1. Cek daftar_ulang_submissions
    const { data: daftarUlangUsers, error: daftarUlangError } = await supabase
      .from('daftar_ulang_submissions')
      .select('user_id, status')
      .in('status', ['approved', 'submitted']);

    // 2. Cek jurnal_records
    const { data: jurnalRecords, error: jurnalError } = await supabase
      .from('jurnal_records')
      .select('id, user_id, blok, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // 3. Cek public.users
    const { data: publicUsers, error: publicUsersError } = await supabase
      .from('users')
      .select('id, full_name')
      .limit(5);

    // 4. Cek auth.users (gunakan auth.getUser() untuk sampling)
    const authUserIds = jurnalRecords?.map((j: any) => j.user_id).slice(0, 3) || [];

    return NextResponse.json({
      success: true,
      debug: {
        daftar_ulang_users: {
          count: daftarUlangUsers?.length || 0,
          user_ids: daftarUlangUsers?.map((d: any) => d.user_id) || [],
          error: daftarUlangError?.message
        },
        jurnal_records: {
          count: jurnalRecords?.length || 0,
          sample: jurnalRecords?.map((j: any) => ({ id: j.id, user_id: j.user_id, blok: j.blok })) || [],
          error: jurnalError?.message
        },
        public_users: {
          count: publicUsers?.length || 0,
          sample_ids: publicUsers?.map((u: any) => u.id) || [],
          error: publicUsersError?.message
        },
        jurnal_user_ids_not_in_daftar_ulang: jurnalRecords
          ?.filter((j: any) => !daftarUlangUsers?.some((d: any) => d.user_id === j.user_id))
          .map((j: any) => ({ id: j.id, user_id: j.user_id })) || [],
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

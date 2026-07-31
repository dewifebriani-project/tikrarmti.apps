import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { data: batches } = await supabaseAdmin.from('batches').select('id, name').order('created_at', { ascending: false }).limit(1);
    const id = batches?.[0]?.id;

    const { data: thalibahs } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id')
      .eq('batch_id', id);

    const { data: muallimahs } = await supabaseAdmin
      .from('muallimah_akads')
      .select('id, status, preferred_max_thalibah, user_id, exclude_from_capacity, preferred_schedule, backup_schedule, paid_class_scheme')
      .eq('batch_id', id);

    return NextResponse.json({
      batchId: id,
      muallimahsCount: muallimahs?.length,
      thalibahsCount: thalibahs?.length,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

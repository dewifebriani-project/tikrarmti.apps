import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { hasRequiredRank, ROLE_RANKS } from '@/lib/roles';

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('roles').eq('id', user.id).single();
  if (!hasRequiredRank(profile?.roles || [], ROLE_RANKS.admin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createSupabaseAdmin();
  let originalStatus: string | null = null;

  try {
    const { data: source, error: sourceError } = await admin
      .from('halaqah')
      .select('id, name, status, program:programs!inner(id, name, batch_id, class_type)')
      .eq('id', params.id)
      .single();
    if (sourceError || !source) return NextResponse.json({ error: 'Halaqah tidak ditemukan.' }, { status: 404 });

    const sourceProgram = Array.isArray(source.program) ? source.program[0] : source.program;
    if (!sourceProgram || sourceProgram.class_type !== 'tikrar_tahfidz') {
      return NextResponse.json({ error: 'Hanya halaqah Tikrar Tahfidz yang dapat dipindahkan.' }, { status: 400 });
    }

    originalStatus = source.status;
    const { error: closeError } = await admin
      .from('halaqah')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', source.id);
    if (closeError) throw closeError;

    const [{ data: students, error: studentsError }, { data: reservations, error: reservationsError }] = await Promise.all([
      admin.from('halaqah_students').select('thalibah_id').eq('halaqah_id', source.id).eq('status', 'active'),
      admin.from('daftar_ulang_submissions').select('user_id')
        .eq('batch_id', sourceProgram.batch_id)
        .or(`ujian_halaqah_id.eq.${source.id},tashih_halaqah_id.eq.${source.id}`)
        .or('partner_status.in.(submitted,approved),status.in.(submitted,approved)')
    ]);
    if (studentsError) throw studentsError;
    if (reservationsError) throw reservationsError;

    const occupied = new Set([...(students || []).map(row => row.thalibah_id), ...(reservations || []).map(row => row.user_id)]);
    if (occupied.size > 0) {
      await admin.from('halaqah').update({ status: originalStatus }).eq('id', source.id);
      return NextResponse.json({ error: `Masih ada ${occupied.size} thalibah/reservasi. Halaqah tidak dapat dipindahkan.` }, { status: 409 });
    }

    const { data: targets, error: targetError } = await admin.from('programs').select('id, name')
      .eq('batch_id', sourceProgram.batch_id).eq('class_type', 'pra_tahfidz')
      .in('status', ['open', 'ongoing']).order('created_at').limit(1);
    if (targetError) throw targetError;
    const target = targets?.[0];
    if (!target) {
      await admin.from('halaqah').update({ status: originalStatus }).eq('id', source.id);
      return NextResponse.json({ error: 'Program Pra Tikrar pada batch yang sama belum tersedia.' }, { status: 400 });
    }

    const name = source.name.includes(sourceProgram.name)
      ? source.name.replace(sourceProgram.name, target.name)
      : `${target.name} - ${source.name}`;
    const { data: updated, error: updateError } = await admin.from('halaqah').update({
      program_id: target.id, name, status: originalStatus, updated_at: new Date().toISOString()
    }).eq('id', source.id).select('id, name, program_id, status').single();
    if (updateError) throw updateError;

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (originalStatus) await admin.from('halaqah').update({ status: originalStatus }).eq('id', params.id);
    console.error('[Move Halaqah to Pra Tikrar]', error);
    return NextResponse.json({ error: 'Gagal memindahkan halaqah.', details: error?.message }, { status: 500 });
  }
}

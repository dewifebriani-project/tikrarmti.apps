import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/rbac';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const batchId = params.id;

    // Fetch all juz options
    const { data: allJuz, error: juzError } = await supabaseAdmin
      .from('juz_options')
      .select('*')
      .order('sort_order', { ascending: true });

    if (juzError) {
      return NextResponse.json({ error: 'Gagal mengambil master juz' }, { status: 500 });
    }

    // Fetch mapped juz for this batch
    const { data: mappedJuz, error: mapError } = await supabaseAdmin
      .from('batch_juz_options')
      .select('juz_code')
      .eq('batch_id', batchId)
      .eq('is_active', true);

    if (mapError) {
      // If table doesn't exist yet, we just assume empty mapped list.
      // This is to prevent hard crashes before migration is run.
      console.warn('batch_juz_options fetch error:', mapError);
    }

    const activeCodes = new Set(mappedJuz?.map(m => m.juz_code) || []);

    const enrichedJuz = allJuz?.map(juz => ({
      ...juz,
      is_mapped_to_batch: activeCodes.has(juz.code)
    }));

    return NextResponse.json({
      success: true,
      data: enrichedJuz
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const batchId = params.id;
    const { juz_codes } = await request.json();

    if (!Array.isArray(juz_codes)) {
      return NextResponse.json({ error: 'juz_codes must be an array' }, { status: 400 });
    }

    // Delete all existing mappings for this batch
    const { error: delError } = await supabaseAdmin
      .from('batch_juz_options')
      .delete()
      .eq('batch_id', batchId);

    if (delError) {
      return NextResponse.json({ error: 'Gagal menghapus relasi juz lama', details: delError }, { status: 500 });
    }

    // Insert new mappings
    if (juz_codes.length > 0) {
      const inserts = juz_codes.map(code => ({
        batch_id: batchId,
        juz_code: code,
        is_active: true
      }));

      const { error: insError } = await supabaseAdmin
        .from('batch_juz_options')
        .insert(inserts);

      if (insError) {
        return NextResponse.json({ error: 'Gagal menyimpan relasi juz baru', details: insError }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Berhasil mengupdate juz untuk batch ini' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

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

    const { data: zoomLinks, error } = await supabaseAdmin
      .from('batch_zoom_links')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('batch_zoom_links fetch error:', error);
      // If table doesn't exist yet, return empty array instead of failing
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({
      success: true,
      data: zoomLinks || []
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
    const { zoom_links } = await request.json();

    if (!Array.isArray(zoom_links)) {
      return NextResponse.json({ error: 'zoom_links must be an array' }, { status: 400 });
    }

    // Delete existing zoom links for this batch
    const { error: delError } = await supabaseAdmin
      .from('batch_zoom_links')
      .delete()
      .eq('batch_id', batchId);

    if (delError) {
      return NextResponse.json({ error: 'Gagal menghapus relasi zoom lama', details: delError }, { status: 500 });
    }

    // Insert new zoom links
    if (zoom_links.length > 0) {
      const inserts = zoom_links.map((link: any) => ({
        batch_id: batchId,
        name: link.name,
        url: link.url,
        meeting_id: link.meeting_id || null,
        passcode: link.passcode || null,
        claim_host: link.claim_host || null,
        is_active: true
      }));

      const { error: insError } = await supabaseAdmin
        .from('batch_zoom_links')
        .insert(inserts);

      if (insError) {
        return NextResponse.json({ error: 'Gagal menyimpan relasi zoom baru', details: insError }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Berhasil mengupdate link zoom untuk batch ini' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

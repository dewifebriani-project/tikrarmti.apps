import { createSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createSupabaseAdmin();

/**
 * GET /api/admin/testimonials
 * Fetch all testimonials with user details
 */
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const approvedOnly = searchParams.get('approved_only') === 'true';

    let query = supabaseAdmin
      .from('testimonials')
      .select(`
        *,
        user:users (
          id,
          full_name,
          email,
          kota
        )
      `)
      .order('created_at', { ascending: false });

    if (approvedOnly) {
      query = query.eq('is_approved', true);
    }

    const { data: testimonials, error } = await query;

    if (error) {
      console.error('[Admin Testimonials API GET] Database error:', error);
      return ApiResponses.databaseError(error);
    }

    return ApiResponses.success(testimonials);
  } catch (error: any) {
    console.error('[Admin Testimonials API GET] Server error:', error);
    return ApiResponses.handleUnknown(error);
  }
}

/**
 * PUT /api/admin/testimonials
 * Update testimonial approval status
 */
export async function PUT(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const { id, is_approved } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing testimonial ID' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .update({
        is_approved: !!is_approved,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Admin Testimonials API PUT] Database error:', error);
      return ApiResponses.databaseError(error);
    }

    return ApiResponses.success(data, 'Status persetujuan testimoni berhasil diperbarui');
  } catch (error: any) {
    console.error('[Admin Testimonials API PUT] Server error:', error);
    return ApiResponses.handleUnknown(error);
  }
}

/**
 * DELETE /api/admin/testimonials
 * Delete a testimonial
 */
export async function DELETE(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing testimonial ID' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('testimonials')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Admin Testimonials API DELETE] Database error:', error);
      return ApiResponses.databaseError(error);
    }

    return ApiResponses.success(null, 'Testimoni berhasil dihapus');
  } catch (error: any) {
    console.error('[Admin Testimonials API DELETE] Server error:', error);
    return ApiResponses.handleUnknown(error);
  }
}

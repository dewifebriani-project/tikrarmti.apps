import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getClientIp, getUserAgent, logAudit } from '@/lib/audit-log';

const supabaseAdmin = createSupabaseAdmin();

/**
 * GET /api/daftar-ulang/akad?batch_id={batch_id}
 *
 * Get the akad commitment for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');

    if (!batchId) {
      return NextResponse.json(
        { error: 'batch_id is required' },
        { status: 400 }
      );
    }

    // Get user's akad commitment
    const { data: akad } = await supabaseAdmin
      .from('akad_commitments')
      .select('*')
      .eq('user_id', user.id)
      .eq('batch_id', batchId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      data: akad
    });

  } catch (error: any) {
    console.error('[Akad API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/daftar-ulang/akad
 *
 * Save or update akad commitment
 * Body: {
 *   batch_id: string,
 *   akad_content: object (commitment details),
 *   agreed: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    const body = await request.json();
    const { batch_id, akad_content, agreed } = body;

    // Validate required fields
    if (!batch_id || !akad_content) {
      return NextResponse.json(
        { error: 'batch_id and akad_content are required' },
        { status: 400 }
      );
    }

    // Verify user is a selected thalibah
    const { data: registration } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, selection_status')
      .eq('user_id', user.id)
      .eq('batch_id', batch_id)
      .single();

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    if (registration.selection_status !== 'selected') {
      return NextResponse.json(
        { error: 'Only selected thalibah can sign akad' },
        { status: 403 }
      );
    }

    // Check for existing akad
    const { data: existing } = await supabaseAdmin
      .from('akad_commitments')
      .select('*')
      .eq('user_id', user.id)
      .eq('batch_id', batch_id)
      .maybeSingle();

    let result;
    const clientIp = getClientIp(request);

    if (existing) {
      // Update existing akad
      const updateData: any = {
        akad_content,
        updated_at: new Date().toISOString()
      };

      // Update agreement status and timestamp if agreed is true
      if (agreed && !existing.agreed) {
        updateData.agreed = true;
        updateData.signed_at = new Date().toISOString();
        updateData.signature_ip = clientIp;
      } else if (agreed === false) {
        updateData.agreed = false;
        updateData.signed_at = null;
        updateData.signature_ip = null;
      }

      const { data, error } = await supabaseAdmin
        .from('akad_commitments')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Audit log
      await logAudit({
        userId: user.id,
        action: 'UPDATE',
        resource: 'akad_commitments',
        details: {
          batch_id,
          agreed,
          previously_agreed: existing.agreed
        },
        ipAddress: clientIp,
        userAgent: getUserAgent(request),
        level: 'INFO'
      });
    } else {
      // Create new akad
      const insertData: any = {
        registration_id: registration.id,
        user_id: user.id,
        batch_id: batch_id,
        akad_content
      };

      if (agreed) {
        insertData.agreed = true;
        insertData.signed_at = new Date().toISOString();
        insertData.signature_ip = clientIp;
      }

      const { data, error } = await supabaseAdmin
        .from('akad_commitments')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Audit log
      await logAudit({
        userId: user.id,
        action: 'CREATE',
        resource: 'akad_commitments',
        details: {
          batch_id,
          agreed
        },
        ipAddress: clientIp,
        userAgent: getUserAgent(request),
        level: 'INFO'
      });
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('[Akad API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

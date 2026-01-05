import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getClientIp, getUserAgent, logAudit } from '@/lib/audit-log';

const supabaseAdmin = createSupabaseAdmin();

/**
 * GET /api/daftar-ulang/partners?batch_id={batch_id}
 *
 * Get compatible study partners for the current user based on:
 * - Matching juz number
 * - Matching time slot
 * - Both are selected thalibah
 * - Not already partnered
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

    // Get user's registration data
    const { data: registration } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, chosen_juz, main_time_slot, selection_status')
      .eq('user_id', user.id)
      .eq('batch_id', batchId)
      .single();

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    if (registration.selection_status !== 'selected') {
      return NextResponse.json(
        { error: 'Only selected thalibah can choose study partners' },
        { status: 403 }
      );
    }

    // Use the database function to find compatible partners
    // If function doesn't exist yet, return empty array
    let compatiblePartners: any[] = [];
    try {
      const { data: partners, error: partnersError } = await supabaseAdmin
        .rpc('find_compatible_study_partners', {
          p_user_id: user.id,
          p_batch_id: batchId,
          p_time_slot: registration.main_time_slot,
          p_juz: registration.chosen_juz
        });

      if (!partnersError && partners) {
        compatiblePartners = partners;
      } else if (partnersError) {
        console.warn('[Partners API] Function not available or error:', partnersError);
        // Continue with empty partners - don't fail the request
      }
    } catch (err) {
      console.warn('[Partners API] Exception calling find_compatible_study_partners:', err);
      // Continue with empty partners
    }

    // Get existing partner preferences for the user
    const { data: existingPreference } = await supabaseAdmin
      .from('study_partner_preferences')
      .select('*')
      .eq('user_id', user.id)
      .eq('batch_id', batchId)
      .maybeSingle();

    // Get pending requests from others (where they selected this user)
    let pendingRequests: any[] = [];
    try {
      const { data: requests } = await supabaseAdmin
        .from('study_partner_preferences')
        .select('*, users!study_partner_preferences_user_id_fkey(full_name), registrations:pendaftaran_tikrar_tahfidz(chosen_juz, main_time_slot)')
        .eq('batch_id', batchId)
        .eq('preferred_partner_id', user.id)
        .eq('partner_status', 'pending')
        .eq('partner_type', 'thalibah');

      if (requests) {
        pendingRequests = requests;
      }
    } catch (err) {
      console.warn('[Partners API] Error fetching pending requests:', err);
      // Continue with empty requests
    }

    return NextResponse.json({
      success: true,
      data: {
        user_registration: {
          chosen_juz: registration.chosen_juz,
          main_time_slot: registration.main_time_slot
        },
        compatible_partners: compatiblePartners || [],
        existing_preference: existingPreference,
        pending_requests: pendingRequests || []
      }
    });

  } catch (error: any) {
    console.error('[Partners API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/daftar-ulang/partners
 *
 * Save or update study partner preference
 * Body: {
 *   batch_id: string,
 *   partner_type: 'thalibah' | 'family' | 'tarteel',
 *   preferred_partner_id?: string,
 *   family_member_name?: string,
 *   family_member_relationship?: string,
 *   tarteel_commitment?: boolean,
 *   daily_proof_method?: string
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
    const {
      batch_id,
      partner_type,
      preferred_partner_id,
      family_member_name,
      family_member_relationship,
      tarteel_commitment,
      daily_proof_method
    } = body;

    // Validate required fields
    if (!batch_id || !partner_type) {
      return NextResponse.json(
        { error: 'batch_id and partner_type are required' },
        { status: 400 }
      );
    }

    if (!['thalibah', 'family', 'tarteel'].includes(partner_type)) {
      return NextResponse.json(
        { error: 'partner_type must be one of: thalibah, family, tarteel' },
        { status: 400 }
      );
    }

    // Validate based on partner_type
    if (partner_type === 'thalibah' && !preferred_partner_id) {
      return NextResponse.json(
        { error: 'preferred_partner_id is required when partner_type is thalibah' },
        { status: 400 }
      );
    }

    if (partner_type === 'family' && !family_member_name) {
      return NextResponse.json(
        { error: 'family_member_name is required when partner_type is family' },
        { status: 400 }
      );
    }

    if (partner_type === 'tarteel' && !tarteel_commitment) {
      return NextResponse.json(
        { error: 'tarteel_commitment is required when partner_type is tarteel' },
        { status: 400 }
      );
    }

    // Verify user is a selected thalibah
    const { data: registration } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, chosen_juz, main_time_slot, selection_status')
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
        { error: 'Only selected thalibah can choose study partners' },
        { status: 403 }
      );
    }

    // Check for existing preference
    const { data: existing } = await supabaseAdmin
      .from('study_partner_preferences')
      .select('*')
      .eq('user_id', user.id)
      .eq('batch_id', batch_id)
      .maybeSingle();

    let result;

    if (existing) {
      // Update existing preference
      const updateData: any = {
        partner_type,
        preferred_time_slot: registration.main_time_slot,
        preferred_juz: registration.chosen_juz,
        updated_at: new Date().toISOString()
      };

      if (partner_type === 'thalibah') {
        updateData.preferred_partner_id = preferred_partner_id;
        updateData.partner_status = 'pending'; // Reset to pending when changing
      }
      if (partner_type === 'family') {
        updateData.family_member_name = family_member_name;
        updateData.family_member_relationship = family_member_relationship;
        updateData.preferred_partner_id = null;
        updateData.partner_status = null;
      }
      if (partner_type === 'tarteel') {
        updateData.tarteel_commitment = tarteel_commitment;
        updateData.daily_proof_method = daily_proof_method;
        updateData.preferred_partner_id = null;
        updateData.partner_status = null;
      }

      const { data, error } = await supabaseAdmin
        .from('study_partner_preferences')
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
        resource: 'study_partner_preferences',
        details: {
          batch_id,
          partner_type,
          previous_partner_type: existing.partner_type
        },
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        level: 'INFO'
      });
    } else {
      // Create new preference
      const insertData: any = {
        registration_id: registration.id,
        user_id: user.id,
        batch_id: batch_id,
        partner_type,
        preferred_time_slot: registration.main_time_slot,
        preferred_juz: registration.chosen_juz
      };

      if (partner_type === 'thalibah') {
        insertData.preferred_partner_id = preferred_partner_id;
        insertData.partner_status = 'pending';
      }
      if (partner_type === 'family') {
        insertData.family_member_name = family_member_name;
        insertData.family_member_relationship = family_member_relationship;
      }
      if (partner_type === 'tarteel') {
        insertData.tarteel_commitment = tarteel_commitment;
        insertData.daily_proof_method = daily_proof_method;
      }

      const { data, error } = await supabaseAdmin
        .from('study_partner_preferences')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Audit log
      await logAudit({
        userId: user.id,
        action: 'CREATE',
        resource: 'study_partner_preferences',
        details: {
          batch_id,
          partner_type
        },
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        level: 'INFO'
      });
    }

    // Check for mutual partnership (if selecting thalibah)
    let mutualPartnership = null;
    if (partner_type === 'thalibah' && preferred_partner_id) {
      const { data: reciprocal } = await supabaseAdmin
        .from('study_partner_preferences')
        .select('*')
        .eq('user_id', preferred_partner_id)
        .eq('preferred_partner_id', user.id)
        .eq('batch_id', batch_id)
        .eq('partner_type', 'thalibah')
        .maybeSingle();

      if (reciprocal) {
        // Update both to mutual
        await supabaseAdmin
          .from('study_partner_preferences')
          .update({ partner_status: 'mutual', updated_at: new Date().toISOString() })
          .or(`id.eq.${result.id},id.eq.${reciprocal.id}`);

        mutualPartnership = {
          partner_id: preferred_partner_id,
          status: 'mutual'
        };

        // Audit log for mutual partnership
        await logAudit({
          userId: user.id,
          action: 'UPDATE',
          resource: 'study_partner_preferences',
          details: {
            event: 'mutual_partnership_established',
            partner_id: preferred_partner_id,
            batch_id
          },
          ipAddress: getClientIp(request),
          userAgent: getUserAgent(request),
          level: 'INFO'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        preference: result,
        mutual_partnership: mutualPartnership
      }
    });

  } catch (error: any) {
    console.error('[Partners API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/daftar-ulang/partners
 *
 * Cancel partner preference
 */
export async function DELETE(request: NextRequest) {
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

    // Delete the preference
    const { error } = await supabaseAdmin
      .from('study_partner_preferences')
      .delete()
      .eq('user_id', user.id)
      .eq('batch_id', batchId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to cancel partner preference' },
        { status: 500 }
      );
    }

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'DELETE',
      resource: 'study_partner_preferences',
      details: { batch_id: batchId },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

    return NextResponse.json({
      success: true,
      message: 'Partner preference cancelled'
    });

  } catch (error: any) {
    console.error('[Partners API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

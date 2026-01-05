import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/daftar-ulang/schedules
 * Fetch available halaqah schedules for tashih and ujian
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const searchParams = request.nextUrl.searchParams;
    const batchId = searchParams.get('batch_id');

    if (!batchId) {
      return NextResponse.json(
        { error: 'batch_id is required' },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's registration to find their time slot
    const { data: registration, error: regError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, chosen_juz, main_time_slot, backup_time_slot')
      .eq('batch_id', batchId)
      .eq('user_id', userId)
      .eq('selection_status', 'selected')
      .single();

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Get available halaqah schedules
    // For now, we'll return generic time slots that can be used for scheduling
    // In the future, this could be more sophisticated based on muallimah availability
    const availableSchedules = {
      tashih_schedules: [
        { id: 'senin-0800', day: 'Senin', time: '08:00 - 10:00', label: 'Senin Pagi' },
        { id: 'senin-1000', day: 'Senin', time: '10:00 - 12:00', label: 'Senin Siang' },
        { id: 'selasa-0800', day: 'Selasa', time: '08:00 - 10:00', label: 'Selasa Pagi' },
        { id: 'selasa-1000', day: 'Selasa', time: '10:00 - 12:00', label: 'Selasa Siang' },
        { id: 'rabu-0800', day: 'Rabu', time: '08:00 - 10:00', label: 'Rabu Pagi' },
        { id: 'rabu-1000', day: 'Rabu', time: '10:00 - 12:00', label: 'Rabu Siang' },
        { id: 'kamis-0800', day: 'Kamis', time: '08:00 - 10:00', label: 'Kamis Pagi' },
        { id: 'kamis-1000', day: 'Kamis', time: '10:00 - 12:00', label: 'Kamis Siang' },
        { id: 'jumat-0800', day: 'Jumat', time: '08:00 - 10:00', label: 'Jumat Pagi' },
        { id: 'jumat-1000', day: 'Jumat', time: '10:00 - 12:00', label: 'Jumat Siang' },
      ],
      ujian_schedules: [
        { id: 'sabtu-0800', day: 'Sabtu', time: '08:00 - 10:00', label: 'Sabtu Pagi' },
        { id: 'sabtu-1000', day: 'Sabtu', time: '10:00 - 12:00', label: 'Sabtu Siang' },
        { id: 'sabtu-1400', day: 'Sabtu', time: '14:00 - 16:00', label: 'Sabtu Sore' },
        { id: 'ahad-0800', day: 'Ahad', time: '08:00 - 10:00', label: 'Ahad Pagi' },
        { id: 'ahad-1000', day: 'Ahad', time: '10:00 - 12:00', label: 'Ahad Siang' },
        { id: 'ahad-1400', day: 'Ahad', time: '14:00 - 16:00', label: 'Ahad Sore' },
      ],
    };

    // Check if user already has schedule preferences
    const { data: existingPreference, error: prefError } = await supabase
      .from('ustadzah_preferences')
      .select('*')
      .eq('registration_id', registration.id)
      .eq('user_id', userId)
      .single();

    if (prefError && prefError.code !== 'PGRST116') {
      console.error('Error fetching preferences:', prefError);
    }

    return NextResponse.json({
      success: true,
      data: {
        available_schedules: availableSchedules,
        existing_preference: existingPreference || null,
        user_registration: {
          chosen_juz: registration.chosen_juz,
          main_time_slot: registration.main_time_slot,
        },
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/daftar-ulang/schedules:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/daftar-ulang/schedules
 * Save user's schedule preferences for tashih and ujian
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();

    const { batch_id, tashih_schedule_id, ujian_schedule_id, notes } = body;

    if (!batch_id || !tashih_schedule_id || !ujian_schedule_id) {
      return NextResponse.json(
        { error: 'batch_id, tashih_schedule_id, and ujian_schedule_id are required' },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's registration
    const { data: registration, error: regError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('id')
      .eq('batch_id', batch_id)
      .eq('user_id', userId)
      .eq('selection_status', 'selected')
      .single();

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Check if preference already exists
    const { data: existingPref } = await supabase
      .from('ustadzah_preferences')
      .select('id')
      .eq('registration_id', registration.id)
      .single();

    let result;
    if (existingPref) {
      // Update existing preference
      const { data, error } = await supabase
        .from('ustadzah_preferences')
        .update({
          preferred_muallimah_tashih: tashih_schedule_id,
          preferred_muallimah_ujian: ujian_schedule_id,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPref.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new preference
      const { data, error } = await supabase
        .from('ustadzah_preferences')
        .insert({
          registration_id: registration.id,
          user_id: userId,
          batch_id: batch_id,
          preferred_muallimah_tashih: tashih_schedule_id,
          preferred_muallimah_ujian: ujian_schedule_id,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Log to audit
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: existingPref ? 'update_schedule_preference' : 'create_schedule_preference',
      table_name: 'ustadzah_preferences',
      record_id: result.id,
      new_values: {
        tashih_schedule: tashih_schedule_id,
        ujian_schedule: ujian_schedule_id,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Preferensi jadwal berhasil disimpan',
    });
  } catch (error: any) {
    console.error('Error in POST /api/daftar-ulang/schedules:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

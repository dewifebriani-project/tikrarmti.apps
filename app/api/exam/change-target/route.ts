import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger-secure';

const supabaseAdmin = createSupabaseAdmin();

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetJuz, skipExam } = body;

    // Get user's registration
    const { data: registration, error: registrationError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, batch_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (registrationError || !registration) {
      return NextResponse.json({
        error: 'No registration found'
      }, { status: 404 });
    }

    if (skipExam) {
      // User chose to skip the exam and downgrade to 30A
      const { error: updateError } = await supabaseAdmin
        .from('pendaftaran_tikrar_tahfidz')
        .update({
          chosen_juz: '30A',
          exam_status: 'completed',
          exam_juz_number: null,
          exam_score: 0,
        })
        .eq('id', registration.id);

      if (updateError) {
        logger.error('Error skipping exam and downgrading', { error: updateError });
        return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Exam skipped successfully, downgraded to 30A',
        newJuz: '30A'
      });
    }

    if (targetJuz) {
      // User just wants to change their target juz before exam
      const { error: updateError } = await supabaseAdmin
        .from('pendaftaran_tikrar_tahfidz')
        .update({
          chosen_juz: targetJuz,
        })
        .eq('id', registration.id);

      if (updateError) {
        logger.error('Error updating target juz', { error: updateError });
        return NextResponse.json({ error: 'Failed to update target juz' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Target juz updated successfully',
        newJuz: targetJuz
      });
    }

    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });

  } catch (error) {
    logger.error('Error in POST /api/exam/change-target', { error: error as Error });
    return NextResponse.json({
      error: 'Internal server error',
    }, { status: 500 });
  }
}

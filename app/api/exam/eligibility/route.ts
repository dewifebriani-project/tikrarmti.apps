// API Route: /api/exam/eligibility
// Check if user is eligible to take exam

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger-secure';
import { getRequiredExamJuz } from '@/lib/exam-utils';
import { ExamEligibility } from '@/types/exam';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tikrar registration
    const { data: registrations, error: regError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (regError) {
      logger.error('Error fetching registration', { error: regError });
      return NextResponse.json({ error: 'Failed to check eligibility' }, { status: 500 });
    }

    if (!registrations || registrations.length === 0) {
      const eligibility: ExamEligibility = {
        isEligible: false,
        requiredJuz: null,
        reason: 'No approved registration found. Please register first.',
        hasCompleted: false
      };
      return NextResponse.json({ data: eligibility });
    }

    const registration = registrations[0];

    // Check if oral submission is completed
    if (!registration.oral_submitted_at || !registration.oral_submission_url) {
      const eligibility: ExamEligibility = {
        isEligible: false,
        requiredJuz: null,
        reason: 'Please complete voice recording submission first',
        hasCompleted: false
      };
      return NextResponse.json({ data: eligibility });
    }

    // Determine required exam juz
    const requiredJuz = getRequiredExamJuz(registration.chosen_juz);

    if (!requiredJuz) {
      const eligibility: ExamEligibility = {
        isEligible: false,
        requiredJuz: null,
        reason: `No exam required for ${registration.chosen_juz}`,
        hasCompleted: false
      };
      return NextResponse.json({ data: eligibility });
    }

    // Check if exam already completed
    const { data: attempts, error: attemptError } = await supabaseAdmin
      .from('exam_attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('registration_id', registration.id)
      .eq('juz_number', requiredJuz)
      .eq('status', 'submitted');

    if (attemptError) {
      logger.error('Error checking exam attempts', { error: attemptError });
      return NextResponse.json({ error: 'Failed to check eligibility' }, { status: 500 });
    }

    if (attempts && attempts.length > 0) {
      const attempt = attempts[0];
      const eligibility: ExamEligibility = {
        isEligible: false,
        requiredJuz,
        reason: `Exam already completed with score ${attempt.score}%`,
        hasCompleted: true,
        attemptId: attempt.id,
        score: attempt.score
      };
      return NextResponse.json({ data: eligibility });
    }

    // User is eligible
    const eligibility: ExamEligibility = {
      isEligible: true,
      requiredJuz,
      hasCompleted: false
    };

    return NextResponse.json({ data: eligibility });

  } catch (error) {
    logger.error('Error in GET /api/exam/eligibility', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

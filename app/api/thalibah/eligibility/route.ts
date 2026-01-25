import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/thalibah/eligibility - Check thalibah graduation eligibility and available programs
const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const { searchParams } = new URL(request.url);
    let thalibahId = searchParams.get('thalibah_id');

    if (!thalibahId) {
      // Use current user if not specified
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      thalibahId = user.id;
    }

    // Get user's latest tikrar registration to check graduation status
    const { data: registration, error: regError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        *,
        batch:batches(*)
      `)
      .eq('user_id', thalibahId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (regError || !registration) {
      return NextResponse.json({
        error: 'No registration found',
        is_graduated: false,
        eligible_programs: []
      }, { status: 404 });
    }

    // Check graduation criteria
    const oralPassed = registration.oral_assessment_status === 'pass';
    const examCompleted = registration.exam_status === 'completed';
    const examJuz = registration.exam_juz_number;

    // Juz 30 exception: doesn't require exam
    const isJuz30Exception = examJuz === 30;

    // Determine graduation status
    const isGraduated = oralPassed && (examCompleted || isJuz30Exception);

    // Determine eligible programs based on graduation status
    let eligiblePrograms: string[];

    if (isGraduated) {
      // Graduated thalibah can join regular programs
      eligiblePrograms = ['tashih_ujian', 'tashih_only', 'ujian_only'];
    } else {
      // Not graduated - only Pra-Tahfidz available
      // But they must have passed oral assessment
      if (oralPassed) {
        eligiblePrograms = ['pra_tahfidz'];
      } else {
        // Failed oral too - no programs available
        eligiblePrograms = [];
      }
    }

    return NextResponse.json({
      thalibah_id: thalibahId,
      registration_id: registration.id,
      is_graduated: isGraduated,
      oral_status: registration.oral_assessment_status,
      exam_status: registration.exam_status,
      exam_juz: examJuz,
      batch: registration.batch,
      eligible_programs: eligiblePrograms,
      can_enroll: eligiblePrograms.length > 0
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

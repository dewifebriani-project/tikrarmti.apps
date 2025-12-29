import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

// GET: Fetch exam questions for user based on their chosen_juz
// Logic:
// - Juz 28A or 28B -> Exam Juz 29
// - Juz 29A or 29B -> Exam Juz 30
// - Juz 1A or 1B -> Exam Juz 30
// - Juz 30A or 30B -> No exam (return empty)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's registration with chosen_juz
    const { data: registration, error: registrationError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, chosen_juz, exam_status, exam_attempt_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (registrationError || !registration) {
      return NextResponse.json({
        error: 'No registration found',
        details: 'Silakan daftar tikrar terlebih dahulu'
      }, { status: 404 });
    }

    // Check if exam is already completed
    if (registration.exam_status === 'completed') {
      return NextResponse.json({
        error: 'Exam already completed',
        details: 'Ujian sudah dikerjakan'
      }, { status: 400 });
    }

    // Determine required exam juz based on chosen_juz
    const chosenJuz = registration.chosen_juz;
    let requiredJuzNumber: number | null = null;

    if (chosenJuz?.startsWith('28')) {
      requiredJuzNumber = 29;
    } else if (chosenJuz?.startsWith('29')) {
      requiredJuzNumber = 30;
    } else if (chosenJuz?.startsWith('1')) {
      requiredJuzNumber = 30;
    } else if (chosenJuz?.startsWith('30')) {
      // No exam required for Juz 30
      return NextResponse.json({
        data: [],
        total: 0,
        message: 'Tidak ada ujian untuk juz 30',
        noExamRequired: true
      });
    } else {
      return NextResponse.json({
        error: 'Invalid chosen_juz',
        details: `chosen_juz "${chosenJuz}" tidak valid`
      }, { status: 400 });
    }

    // Fetch active questions for the required juz
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('exam_questions')
      .select('*')
      .eq('juz_number', requiredJuzNumber)
      .eq('is_active', true)
      .order('section_number', { ascending: true })
      .order('question_number', { ascending: true });

    if (questionsError) {
      console.error('Error fetching exam questions:', questionsError);
      return NextResponse.json({
        error: 'Failed to fetch questions',
        details: questionsError.message
      }, { status: 500 });
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({
        error: 'No questions available',
        details: `Belum ada soal untuk juz ${requiredJuzNumber}`
      }, { status: 404 });
    }

    return NextResponse.json({
      data: questions,
      total: questions.length,
      examJuzNumber: requiredJuzNumber,
      registrationId: registration.id,
      existingAttemptId: registration.exam_attempt_id
    });

  } catch (error) {
    console.error('Error in GET /api/exam/questions/for-user:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 });
  }
}

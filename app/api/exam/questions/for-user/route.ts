import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

// Helper function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

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

    // Get exam configuration
    const { data: config, error: configError } = await supabaseAdmin
      .from('exam_configurations')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (configError || !config) {
      console.error('Error fetching exam config:', configError);
      // Use default config if not found
    }

    // Check if user has reached max attempts
    // Only count submitted attempts, not in-progress ones
    if (config && config.max_attempts) {
      const { data: existingAttempts, error: attemptsError } = await supabaseAdmin
        .from('exam_attempts')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('registration_id', registration.id)
        .eq('status', 'submitted');

      const submittedCount = existingAttempts?.length || 0;

      if (!attemptsError && submittedCount >= config.max_attempts) {
        return NextResponse.json({
          error: 'Max attempts reached',
          details: `Ukhti sudah mencoba ${config.max_attempts} kali. Tidak bisa mencoba lagi.`,
          maxAttempts: config.max_attempts
        }, { status: 400 });
      }
    }

    // Fetch active questions for the required juz
    let questionsQuery = supabaseAdmin
      .from('exam_questions')
      .select('*')
      .eq('juz_number', requiredJuzNumber)
      .eq('is_active', true);

    // Limit questions if specified in config
    if (config?.questions_per_attempt) {
      questionsQuery = questionsQuery.limit(config.questions_per_attempt);
    }

    const { data: questions, error: questionsError } = await questionsQuery
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

    // Shuffle questions if configured
    let processedQuestions = questions;
    if (config?.shuffle_questions) {
      processedQuestions = shuffleArray(questions);
    }

    // Shuffle options within each question if configured
    if (config?.randomize_order) {
      processedQuestions = processedQuestions.map(q => ({
        ...q,
        options: shuffleArray(q.options || [])
      }));
    }

    return NextResponse.json({
      data: processedQuestions,
      total: processedQuestions.length,
      examJuzNumber: requiredJuzNumber,
      registrationId: registration.id,
      existingAttemptId: registration.exam_attempt_id,
      config: config ? {
        durationMinutes: config.duration_minutes,
        maxAttempts: config.max_attempts,
        passingScore: config.passing_score,
        autoSubmitOnTimeout: config.auto_submit_on_timeout,
        allowReview: config.allow_review,
        showResults: config.show_results
      } : null
    });

  } catch (error) {
    console.error('Error in GET /api/exam/questions/for-user:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 });
  }
}

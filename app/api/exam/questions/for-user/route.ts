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

// Helper: distribute N questions evenly across sections
function distributeQuestionsBySection(allQuestions: any[], totalNeeded: number): any[] {
  // Group by section_number
  const bySection: Record<number, any[]> = {};
  for (const q of allQuestions) {
    const sec = q.section_number || 1;
    if (!bySection[sec]) bySection[sec] = [];
    bySection[sec].push(q);
  }

  const sectionKeys = Object.keys(bySection).map(Number).sort();
  const numSections = sectionKeys.length;
  if (numSections === 0) return [];

  const basePerSection = Math.floor(totalNeeded / numSections);
  let remainder = totalNeeded % numSections;

  const selected: any[] = [];
  const overflow: any[] = [];

  for (const sec of sectionKeys) {
    const pool = shuffleArray(bySection[sec]);
    let needed = basePerSection + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;

    if (pool.length >= needed) {
      selected.push(...pool.slice(0, needed));
      overflow.push(...pool.slice(needed));
    } else {
      selected.push(...pool);
      // deficit will be filled from overflow later
    }
  }

  // Fill any deficit from overflow
  const deficit = totalNeeded - selected.length;
  if (deficit > 0 && overflow.length > 0) {
    const extra = shuffleArray(overflow).slice(0, deficit);
    selected.push(...extra);
  }

  return shuffleArray(selected);
}

// GET: Fetch exam questions for user based on their chosen_juz
// Logic:
// - Juz 28A or 28B -> Exam Juz 29
// - Juz 29A or 29B -> Exam Juz 30
// - Juz 1A or 1B -> Exam Juz 30
// - Juz 30A or 30B -> No exam (return empty)
// - Only available during selection dates of active open batch
// - source=final-exam: uses chosen_juz directly, 100 questions distributed per category
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's registration with chosen_juz and batch
    const { data: registration, error: registrationError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, chosen_juz, exam_status, exam_attempt_id, batch_id, program_id')
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

    // Get batch to check selection dates and status
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('batches')
      .select('id, name, status, registration_start_date, registration_end_date, min_final_exam_score')
      .eq('id', registration.batch_id)
      .single();

    if (batchError || !batch) {
      return NextResponse.json({
        error: 'Batch not found',
        details: 'Batch pendaftaran tidak ditemukan'
      }, { status: 404 });
    }

    // Detect source mode
    const source = request.nextUrl.searchParams.get('source') || 'selection';
    const isFinalExam = source === 'final-exam';

    // For selection mode: check batch open + selection dates
    if (!isFinalExam) {
      // Check if batch is open
      if (batch.status !== 'open') {
        return NextResponse.json({
          error: 'Exam not available',
          details: `Batch "${batch.name}" belum dibuka. Status: ${batch.status}`
        }, { status: 400 });
      }

      // Check if today is within selection period
      const today = new Date();
      const todayDateOnly = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

      if (batch.registration_start_date && batch.registration_end_date) {
        const startDateStr = batch.registration_start_date.substring(0, 10);
        const endDateStr = batch.registration_end_date.substring(0, 10);
        const startDateNum = parseInt(startDateStr.replace(/-/g, ''), 10);
        const endDateNum = parseInt(endDateStr.replace(/-/g, ''), 10);

        if (todayDateOnly < startDateNum || todayDateOnly > endDateNum) {
          const formatDate = (dateStr: string) => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
          };
          return NextResponse.json({
            error: 'Exam period closed',
            details: `Ujian pilihan ganda hanya tersedia dari ${formatDate(startDateStr)} sampai ${formatDate(endDateStr)}`
          }, { status: 400 });
        }
      } else {
        return NextResponse.json({
          error: 'Selection dates not set',
          details: 'Tanggal seleksi belum ditentukan untuk batch ini. Silakan hubungi admin.'
        }, { status: 400 });
      }
    } else {
      // For final-exam mode: verify user has a registered final exam
      const { data: finalExamReg } = await supabaseAdmin
        .from('final_exam_registrations')
        .select('id, status, schedule:final_exam_schedules(exam_type)')
        .eq('user_id', user.id)
        .limit(10);

      const writtenReg = finalExamReg?.find((r: any) => r.schedule?.exam_type === 'written');
      if (!writtenReg) {
        return NextResponse.json({
          error: 'Belum terdaftar ujian akhir tulisan',
          details: 'Silakan daftar jadwal ujian akhir tulisan terlebih dahulu melalui menu Ujian Akhir.'
        }, { status: 400 });
      }
    }

    // Determine required exam juz based on chosen_juz
    const chosenJuz = registration.chosen_juz;
    let requiredJuzNumber: number | null = null;

    if (isFinalExam) {
      // Final exam: use the thalibah's own chosen juz directly
      const juzNum = parseInt(chosenJuz?.replace(/[AB]/g, '') || '0');
      if (juzNum >= 1 && juzNum <= 30) {
        requiredJuzNumber = juzNum;
      } else {
        return NextResponse.json({
          error: 'Invalid chosen_juz',
          details: `chosen_juz "${chosenJuz}" tidak valid`
        }, { status: 400 });
      }
    } else {
      // Selection exam: map to the next juz
      if (chosenJuz?.startsWith('28')) {
        requiredJuzNumber = 29;
      } else if (chosenJuz?.startsWith('29')) {
        requiredJuzNumber = 30;
      } else if (chosenJuz?.startsWith('1')) {
        requiredJuzNumber = 30;
      } else if (chosenJuz?.startsWith('30')) {
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
          error: 'Kesempatan Ujian Habis',
          details: `Mohon maaf ukhti, kesempatan ujian telah habis (${config.max_attempts}x percobaan). Tetap semangat dan terus berikhtiar, Allah Maha Mengetahui yang terbaik untuk hamba-Nya.`,
          maxAttempts: config.max_attempts
        }, { status: 400 });
      }
    }

    // Fetch ALL active questions for the required juz (we'll limit after shuffle if needed)
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

    let processedQuestions: any[];

    if (isFinalExam) {
      // Final exam: distribute 100 questions evenly across sections/categories
      const FINAL_EXAM_TOTAL = 100;
      processedQuestions = distributeQuestionsBySection(questions, FINAL_EXAM_TOTAL);
    } else {
      // Selection exam: use existing logic
      processedQuestions = questions;
      if (config?.shuffle_questions) {
        processedQuestions = shuffleArray(questions);
      }
      if (config?.questions_per_attempt && config.questions_per_attempt < processedQuestions.length) {
        processedQuestions = processedQuestions.slice(0, config.questions_per_attempt);
      }
    }

    // Shuffle options within each question
    if (isFinalExam || config?.randomize_order) {
      processedQuestions = processedQuestions.map(q => ({
        ...q,
        options: shuffleArray(q.options || [])
      }));
    }

    // Final exam defaults: 120 min, passing threshold, 1 attempt
    const getFinalPassingScore = (b?: { name?: string; min_final_exam_score?: number | null } | null): number => {
      if (!b) return 70;
      if (b.min_final_exam_score !== undefined && b.min_final_exam_score !== null) return b.min_final_exam_score;
      if (b.name) {
        const match = b.name.match(/Batch\s*(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num >= 3) return 80;
        }
      }
      return 70;
    };

    const finalPassingScore = getFinalPassingScore(batch);

    const finalExamConfig = isFinalExam ? {
      durationMinutes: 120,
      maxAttempts: 1,
      passingScore: finalPassingScore,
      autoSubmitOnTimeout: true,
      allowReview: false,
      showResults: true
    } : null;

    return NextResponse.json({
      data: processedQuestions,
      total: processedQuestions.length,
      examJuzNumber: requiredJuzNumber,
      registrationId: registration.id,
      existingAttemptId: registration.exam_attempt_id,
      source,
      config: isFinalExam ? finalExamConfig : (config ? {
        durationMinutes: config.duration_minutes,
        maxAttempts: config.max_attempts,
        passingScore: config.passing_score,
        autoSubmitOnTimeout: config.auto_submit_on_timeout,
        allowReview: config.allow_review,
        showResults: config.show_results
      } : null)
    });

  } catch (error) {
    console.error('Error in GET /api/exam/questions/for-user:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger-secure';

const supabaseAdmin = createSupabaseAdmin();

// POST: Create or update exam attempt
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    logger.info('POST /api/exam/attempts', {
      userId: user.id,
      hasAnswers: !!body.answers,
      answersCount: Array.isArray(body.answers) ? body.answers.length : 0
    });

    // Get user's registration with batch info
    const { data: registration, error: registrationError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, chosen_juz, exam_status, exam_attempt_id, batch_id')
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
      .select('id, name, status, selection_start_date, selection_end_date')
      .eq('id', registration.batch_id)
      .single();

    if (batchError || !batch) {
      logger.error('Batch not found', { batchError, registrationId: registration.id, batchId: registration.batch_id });
      return NextResponse.json({
        error: 'Batch not found',
        details: 'Batch pendaftaran tidak ditemukan'
      }, { status: 404 });
    }

    logger.info('Batch info', {
      batchId: batch.id,
      batchName: batch.name,
      batchStatus: batch.status,
      selectionStart: batch.selection_start_date,
      selectionEnd: batch.selection_end_date
    });

    // Check if batch is open
    if (batch.status !== 'open') {
      logger.warn('Batch not open', { batchStatus: batch.status });
      return NextResponse.json({
        error: 'Exam not available',
        details: `Batch "${batch.name}" belum dibuka. Status: ${batch.status}`
      }, { status: 400 });
    }

    // Check if today is within selection period
    // Use date-only comparison to avoid timezone issues
    const today = new Date();
    const todayDateOnly = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    logger.info('Date check', {
      todayDateOnly,
      selectionStart: batch.selection_start_date,
      selectionEnd: batch.selection_end_date,
      todayISO: today.toISOString()
    });

    if (batch.selection_start_date && batch.selection_end_date) {
      // Parse dates as YYYY-MM-DD and convert to comparable numbers
      const startDateStr = batch.selection_start_date.substring(0, 10);
      const endDateStr = batch.selection_end_date.substring(0, 10);

      const startDateNum = parseInt(startDateStr.replace(/-/g, ''), 10);
      const endDateNum = parseInt(endDateStr.replace(/-/g, ''), 10);

      logger.info('Date comparison', {
        todayDateOnly,
        startDateNum,
        endDateNum,
        todayBeforeStart: todayDateOnly < startDateNum,
        todayAfterEnd: todayDateOnly > endDateNum
      });

      if (todayDateOnly < startDateNum || todayDateOnly > endDateNum) {
        const formatDate = (dateStr: string) => {
          const date = new Date(dateStr);
          return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
        };

        logger.warn('Exam period closed', {
          todayDateOnly,
          startDateNum,
          endDateNum
        });

        return NextResponse.json({
          error: 'Exam period closed',
          details: `Ujian pilihan ganda hanya tersedia dari ${formatDate(startDateStr)} sampai ${formatDate(endDateStr)}`
        }, { status: 400 });
      }
    }

    // Check if exam is already completed
    logger.info('Exam status check', { examStatus: registration.exam_status });
    if (registration.exam_status === 'completed') {
      logger.warn('Exam already completed', { userId: user.id });
      return NextResponse.json({
        error: 'Exam already completed',
        details: 'Ukhti sudah menyelesaikan ujian ini'
      }, { status: 400 });
    }

    // Determine exam juz number from chosen_juz
    const chosenJuz = registration.chosen_juz;
    let examJuzNumber: number | null = null;

    if (chosenJuz?.startsWith('28')) {
      examJuzNumber = 29;
    } else if (chosenJuz?.startsWith('29')) {
      examJuzNumber = 30;
    } else if (chosenJuz?.startsWith('1')) {
      examJuzNumber = 30;
    } else if (chosenJuz?.startsWith('30')) {
      return NextResponse.json({
        error: 'No exam required for Juz 30',
        details: 'Tidak ada ujian untuk juz 30'
      }, { status: 400 });
    }

    if (!examJuzNumber) {
      return NextResponse.json({
        error: 'Invalid chosen_juz',
        details: `chosen_juz "${chosenJuz}" tidak valid`
      }, { status: 400 });
    }

    // Fetch correct answers to calculate score
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('exam_questions')
      .select('id, correct_answer, points')
      .eq('juz_number', examJuzNumber)
      .eq('is_active', true);

    if (questionsError || !questions) {
      return NextResponse.json({
        error: 'Failed to fetch questions for grading'
      }, { status: 500 });
    }

    // Calculate score
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    const processedAnswers = body.answers.map((answer: any) => {
      const question = questions.find((q: any) => q.id === answer.questionId);
      const isCorrect = question && answer.answer === question.correct_answer;

      if (isCorrect) {
        correctAnswers++;
        earnedPoints += question?.points || 1;
      }
      totalPoints += question?.points || 1;

      return {
        questionId: answer.questionId,
        answer: answer.answer,
        isCorrect
      };
    });

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    // Create or update exam attempt
    let attemptId = registration.exam_attempt_id;

    // Verify if the existing attempt actually exists
    if (attemptId) {
      const { data: existingAttempt, error: checkError } = await supabaseAdmin
        .from('exam_attempts')
        .select('id')
        .eq('id', attemptId)
        .single();

      if (checkError || !existingAttempt) {
        // Attempt doesn't exist, clear the reference and create new
        logger.warn('Existing exam attempt not found, clearing reference', { attemptId });
        await supabaseAdmin
          .from('pendaftaran_tikrar_tahfidz')
          .update({ exam_attempt_id: null })
          .eq('id', registration.id);
        attemptId = null;
      }
    }

    if (attemptId) {
      // Update existing attempt
      const { error: updateError } = await supabaseAdmin
        .from('exam_attempts')
        .update({
          answers: processedAnswers,
          total_questions: questions.length,
          correct_answers: correctAnswers,
          score: score,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', attemptId);

      if (updateError) {
        logger.error('Error updating exam attempt', { error: updateError });
        return NextResponse.json({
          error: 'Failed to update attempt',
          details: updateError.message
        }, { status: 500 });
      }
    } else {
      // Create new attempt
      const { data: newAttempt, error: createError } = await supabaseAdmin
        .from('exam_attempts')
        .insert({
          user_id: user.id,
          registration_id: registration.id,
          juz_number: examJuzNumber,
          answers: processedAnswers,
          total_questions: questions.length,
          correct_answers: correctAnswers,
          score: score,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError || !newAttempt) {
        logger.error('Error creating exam attempt', { error: createError });
        return NextResponse.json({
          error: 'Failed to create attempt',
          details: createError?.message || 'Unknown error'
        }, { status: 500 });
      }

      attemptId = newAttempt.id;
    }

    // Update registration with exam results
    const { error: updateRegError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .update({
        exam_juz_number: examJuzNumber,
        exam_attempt_id: attemptId,
        exam_score: score,
        exam_submitted_at: new Date().toISOString(),
        exam_status: 'completed'
      })
      .eq('id', registration.id);

    if (updateRegError) {
      logger.error('Error updating registration', { error: updateRegError });
    }

    logger.info('Exam submitted successfully', {
      userId: user.id,
      attemptId,
      score,
      correctAnswers,
      totalQuestions: questions.length
    });

    return NextResponse.json({
      message: 'Exam submitted successfully',
      attemptId,
      score,
      correctAnswers,
      totalQuestions: questions.length
    });

  } catch (error) {
    logger.error('Error in POST /api/exam/attempts', { error: error as Error });
    return NextResponse.json({
      error: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 });
  }
}

// GET: Fetch existing attempt for user
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's registration
    const { data: registration, error: registrationError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('exam_attempt_id, exam_status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (registrationError || !registration) {
      return NextResponse.json({
        error: 'No registration found'
      }, { status: 404 });
    }

    if (!registration.exam_attempt_id) {
      return NextResponse.json({
        attempt: null,
        message: 'No exam attempt found'
      });
    }

    // Fetch attempt details
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('exam_attempts')
      .select('*')
      .eq('id', registration.exam_attempt_id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({
        error: 'Failed to fetch attempt'
      }, { status: 500 });
    }

    return NextResponse.json({
      attempt,
      examStatus: registration.exam_status
    });

  } catch (error) {
    logger.error('Error in GET /api/exam/attempts', { error: error as Error });
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

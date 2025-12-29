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

    // Get user's registration
    const { data: registration, error: registrationError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, chosen_juz, exam_status, exam_attempt_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (registrationError || !registration) {
      return NextResponse.json({
        error: 'No registration found'
      }, { status: 404 });
    }

    // Check if exam is already completed
    if (registration.exam_status === 'completed') {
      return NextResponse.json({
        error: 'Exam already completed'
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
        error: 'No exam required for Juz 30'
      }, { status: 400 });
    }

    if (!examJuzNumber) {
      return NextResponse.json({
        error: 'Invalid chosen_juz'
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
          error: 'Failed to update attempt'
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
          error: 'Failed to create attempt'
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

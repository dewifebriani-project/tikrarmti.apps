// API Route: /api/exam/submit
// Submit exam answers and calculate score

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger-secure';
import { ExamSubmitRequest, ExamAnswer } from '@/types/exam';
import { calculateScore } from '@/lib/exam-utils';

const supabaseAdmin = createSupabaseAdmin();

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ExamSubmitRequest = await request.json();
    const { attemptId, answers, flaggedQuestions } = body;

    if (!attemptId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid submission data' }, { status: 400 });
    }

    // Get the exam attempt
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('exam_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Exam attempt not found' }, { status: 404 });
    }

    if (attempt.status === 'submitted') {
      return NextResponse.json({
        error: 'Exam already submitted',
        attempt
      }, { status: 400 });
    }

    // Get all questions for this juz
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('exam_questions')
      .select('*')
      .eq('juz_number', attempt.juz_number)
      .eq('is_active', true);

    if (questionsError || !questions) {
      logger.error('Error fetching questions for grading', { error: questionsError });
      return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
    }

    // Create a map for quick lookup
    const questionMap = new Map(questions.map(q => [q.id, q]));

    // Grade each answer
    const gradedAnswers: ExamAnswer[] = answers.map(answer => {
      const question = questionMap.get(answer.questionId);
      if (!question) {
        return { ...answer, isCorrect: false };
      }

      const isCorrect = answer.answer.trim() === question.correct_answer?.trim();
      return { ...answer, isCorrect };
    });

    // Calculate score
    const correctAnswers = gradedAnswers.filter(a => a.isCorrect).length;
    const totalQuestions = questions.length;
    const score = calculateScore(correctAnswers, totalQuestions);

    // Update exam attempt
    const { data: updatedAttempt, error: updateError } = await supabaseAdmin
      .from('exam_attempts')
      .update({
        answers: gradedAnswers,
        correct_answers: correctAnswers,
        score,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating exam attempt', { error: updateError });
      return NextResponse.json({ error: 'Failed to submit exam' }, { status: 500 });
    }

    // Update registration with exam results
    const { error: regUpdateError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .update({
        exam_score: score,
        exam_submitted_at: new Date().toISOString(),
        exam_status: 'completed'
      })
      .eq('id', attempt.registration_id);

    if (regUpdateError) {
      logger.error('Error updating registration exam score', { error: regUpdateError });
    }

    // Process flagged questions
    if (flaggedQuestions && flaggedQuestions.length > 0) {
      const flags = flaggedQuestions.map(flag => ({
        question_id: flag.questionId,
        user_id: user.id,
        attempt_id: attemptId,
        flag_type: flag.flagType,
        flag_message: flag.message || null,
        status: 'pending'
      }));

      const { error: flagError } = await supabaseAdmin
        .from('exam_question_flags')
        .insert(flags);

      if (flagError) {
        logger.error('Error creating question flags', { error: flagError });
        // Don't fail the submission if flags fail
      } else {
        logger.info('Question flags created', {
          attemptId,
          flagCount: flags.length,
          userId: user.id
        });
      }
    }

    // Calculate result summary by section
    const sectionResults = new Map<number, { total: number; correct: number; title: string }>();

    questions.forEach(q => {
      if (!sectionResults.has(q.section_number)) {
        sectionResults.set(q.section_number, {
          total: 0,
          correct: 0,
          title: q.section_title
        });
      }

      const section = sectionResults.get(q.section_number)!;
      section.total++;

      const answer = gradedAnswers.find(a => a.questionId === q.id);
      if (answer?.isCorrect) {
        section.correct++;
      }
    });

    const sections = Array.from(sectionResults.entries()).map(([section_number, data]) => ({
      section_number,
      section_title: data.title,
      total_questions: data.total,
      correct_answers: data.correct,
      percentage: calculateScore(data.correct, data.total)
    }));

    logger.info('Exam submitted successfully', {
      attemptId,
      userId: user.id,
      juzNumber: attempt.juz_number,
      score,
      correctAnswers,
      totalQuestions
    });

    return NextResponse.json({
      message: 'Exam submitted successfully',
      attempt: updatedAttempt,
      result: {
        attempt: updatedAttempt,
        sections,
        overall_percentage: score,
        passed: score >= 60 // Default passing grade
      }
    }, { status: 200 });

  } catch (error) {
    logger.error('Error in POST /api/exam/submit', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

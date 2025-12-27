// API Route: /api/exam/questions/bulk-import
// Bulk import exam questions from JSON (Admin only)

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

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { juz_number, questions, replace_existing } = body;

    if (!juz_number || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Invalid import data' }, { status: 400 });
    }

    // If replace_existing, delete all existing questions for this juz
    if (replace_existing) {
      const { error: deleteError } = await supabaseAdmin
        .from('exam_questions')
        .delete()
        .eq('juz_number', juz_number);

      if (deleteError) {
        logger.error('Error deleting existing questions', { error: deleteError });
        return NextResponse.json({ error: 'Failed to delete existing questions' }, { status: 500 });
      }

      logger.info('Deleted existing questions for bulk import', { juzNumber: juz_number, adminId: user.id });
    }

    // Prepare questions for insert
    const questionsToInsert = questions.map((q: any) => ({
      juz_number,
      section_number: q.section_number,
      section_title: q.section_title,
      question_number: q.question_number,
      question_text: q.question_text,
      question_type: q.question_type || 'multiple_choice',
      options: q.options || [],
      correct_answer: q.correct_answer || q.options?.find((opt: any) => opt.isCorrect)?.text || '',
      points: q.points || 1,
      is_active: q.is_active !== false,
      created_by: user.id
    }));

    // Insert in batches to avoid timeout (Supabase limit ~1000 rows)
    const batchSize = 100;
    const batches = [];

    for (let i = 0; i < questionsToInsert.length; i += batchSize) {
      batches.push(questionsToInsert.slice(i, i + batchSize));
    }

    let totalInserted = 0;
    const errors: any[] = [];

    for (const batch of batches) {
      const { data: insertedQuestions, error: insertError } = await supabaseAdmin
        .from('exam_questions')
        .insert(batch)
        .select();

      if (insertError) {
        logger.error('Error inserting question batch', { error: insertError });
        errors.push(insertError);
      } else {
        totalInserted += insertedQuestions?.length || 0;
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        message: `Partial import: ${totalInserted} questions imported, ${errors.length} batches failed`,
        imported: totalInserted,
        errors
      }, { status: 207 }); // Multi-Status
    }

    logger.info('Bulk import completed', {
      juzNumber: juz_number,
      totalQuestions: totalInserted,
      adminId: user.id
    });

    return NextResponse.json({
      message: `Successfully imported ${totalInserted} questions for Juz ${juz_number}`,
      imported: totalInserted,
      juz_number
    }, { status: 201 });

  } catch (error) {
    logger.error('Error in POST /api/exam/questions/bulk-import', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

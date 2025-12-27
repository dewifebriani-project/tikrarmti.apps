// API Route: /api/exam/questions
// CRUD operations for exam questions (Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger-secure';
import { JuzNumber, ExamQuestion, AdminQuestionEditForm } from '@/types/exam';

const supabaseAdmin = createSupabaseAdmin();

// GET: Fetch exam questions (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const juzNumber = searchParams.get('juz');
    const sectionNumber = searchParams.get('section');
    const isActive = searchParams.get('active');

    let query = supabaseAdmin
      .from('exam_questions')
      .select('*')
      .order('juz_number', { ascending: true })
      .order('section_number', { ascending: true })
      .order('question_number', { ascending: true });

    if (juzNumber) {
      query = query.eq('juz_number', parseInt(juzNumber));
    }

    if (sectionNumber) {
      query = query.eq('section_number', parseInt(sectionNumber));
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: questions, error: fetchError } = await query;

    if (fetchError) {
      logger.error('Error fetching exam questions', { error: fetchError });

      // If table doesn't exist yet, return empty array instead of error
      if (fetchError.code === 'PGRST116' || fetchError.message?.includes('relation') || fetchError.message?.includes('does not exist')) {
        logger.info('exam_questions table does not exist yet, returning empty array');
        return NextResponse.json({
          data: [],
          total: 0
        });
      }

      return NextResponse.json({ error: 'Failed to fetch questions', details: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: questions || [],
      total: questions?.length || 0
    });

  } catch (error) {
    logger.error('Error in GET /api/exam/questions', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create new exam question (Admin only)
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

    const body: AdminQuestionEditForm = await request.json();

    // Validate required fields
    if (!body.juz_number || !body.section_number || !body.question_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert question
    const { data: newQuestion, error: insertError } = await supabaseAdmin
      .from('exam_questions')
      .insert({
        juz_number: body.juz_number,
        section_number: body.section_number,
        section_title: body.section_title,
        question_number: body.question_number,
        question_text: body.question_text,
        question_type: body.question_type,
        options: body.options,
        correct_answer: body.options.find(opt => opt.isCorrect)?.text || '',
        points: body.points || 1,
        is_active: body.is_active !== false,
        created_by: user.id
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Error creating exam question', { error: insertError });
      return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
    }

    logger.info('Exam question created', { questionId: newQuestion.id, adminId: user.id });

    return NextResponse.json({
      data: newQuestion,
      message: 'Question created successfully'
    }, { status: 201 });

  } catch (error) {
    logger.error('Error in POST /api/exam/questions', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update exam question (Admin only)
export async function PUT(request: NextRequest) {
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Question ID required' }, { status: 400 });
    }

    // Update correct_answer based on options
    if (updateData.options) {
      updateData.correct_answer = updateData.options.find((opt: any) => opt.isCorrect)?.text || '';
    }

    const { data: updatedQuestion, error: updateError } = await supabaseAdmin
      .from('exam_questions')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating exam question', { error: updateError });
      return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
    }

    logger.info('Exam question updated', { questionId: id, adminId: user.id });

    return NextResponse.json({
      data: updatedQuestion,
      message: 'Question updated successfully'
    });

  } catch (error) {
    logger.error('Error in PUT /api/exam/questions', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete exam question (Admin only)
export async function DELETE(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Question ID required' }, { status: 400 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('exam_questions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      logger.error('Error deleting exam question', { error: deleteError });
      return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
    }

    logger.info('Exam question deleted', { questionId: id, adminId: user.id });

    return NextResponse.json({
      message: 'Question deleted successfully'
    });

  } catch (error) {
    logger.error('Error in DELETE /api/exam/questions', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// API Route: /api/exam/flags
// Handle question flags (reported errors/issues)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger-secure';

const supabaseAdmin = createSupabaseAdmin();

// GET: Fetch user's flags or all flags (admin)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role === 'admin';

    if (isAdmin) {
      // Admin can see all flags
      const { data: flags, error } = await supabaseAdmin
        .from('exam_question_flags')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching flags', { error });
        return NextResponse.json({ error: 'Failed to fetch flags' }, { status: 500 });
      }

      return NextResponse.json({ flags: flags || [] });
    } else {
      // Regular user can only see their own flags
      const { data: flags, error } = await supabaseAdmin
        .from('exam_question_flags')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching flags', { error });
        return NextResponse.json({ error: 'Failed to fetch flags' }, { status: 500 });
      }

      return NextResponse.json({ flags: flags || [] });
    }

  } catch (error) {
    logger.error('Error in GET /api/exam/flags', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new flag
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    logger.info('POST /api/exam/flags', {
      userId: user.id,
      questionId: body.questionId,
      flagType: body.flagType
    });

    // Validate required fields
    if (!body.questionId || !body.flagType) {
      return NextResponse.json({
        error: 'Missing required fields',
        required: { questionId: !!body.questionId, flagType: !!body.flagType }
      }, { status: 400 });
    }

    // Check if user already flagged this question
    const { data: existingFlag } = await supabaseAdmin
      .from('exam_question_flags')
      .select('id')
      .eq('question_id', body.questionId)
      .eq('user_id', user.id)
      .single();

    if (existingFlag) {
      return NextResponse.json({
        error: 'Anda sudah memberikan flag untuk soal ini'
      }, { status: 400 });
    }

    // Get user's exam attempt to associate with flag
    const { data: attempt } = await supabaseAdmin
      .from('exam_attempts')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    // Create flag
    const { data: newFlag, error: insertError } = await supabaseAdmin
      .from('exam_question_flags')
      .insert({
        question_id: body.questionId,
        user_id: user.id,
        attempt_id: attempt?.id || null,
        flag_type: body.flagType,
        flag_message: body.flagMessage || null,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Error creating flag', { error: insertError });
      return NextResponse.json({
        error: 'Failed to create flag',
        details: insertError.message
      }, { status: 500 });
    }

    logger.info('Flag created successfully', {
      flagId: newFlag.id,
      userId: user.id,
      questionId: body.questionId
    });

    return NextResponse.json({
      flag: newFlag,
      message: 'Flag berhasil dikirim'
    }, { status: 201 });

  } catch (error) {
    logger.error('Error in POST /api/exam/flags', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

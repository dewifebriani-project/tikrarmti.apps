import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger-secure';

const supabaseAdmin = createSupabaseAdmin();

// POST: Create a flag for a question
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, flagType, flagMessage } = body;

    if (!questionId || !flagType) {
      return NextResponse.json({
        error: 'Missing required fields',
        required: { questionId, flagType }
      }, { status: 400 });
    }

    // Validate flag_type
    const validFlagTypes = ['wrong_answer', 'typo', 'unclear', 'other'];
    if (!validFlagTypes.includes(flagType)) {
      return NextResponse.json({
        error: 'Invalid flag_type',
        validTypes: validFlagTypes
      }, { status: 400 });
    }

    // Check if user already flagged this question
    const { data: existingFlag } = await supabaseAdmin
      .from('exam_question_flags')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', user.id)
      .single();

    if (existingFlag) {
      return NextResponse.json({
        error: 'Already flagged',
        message: 'Ukhti sudah memberikan flag untuk soal ini'
      }, { status: 400 });
    }

    // Create flag
    const { data: newFlag, error: insertError } = await supabaseAdmin
      .from('exam_question_flags')
      .insert({
        question_id: questionId,
        user_id: user.id,
        flag_type: flagType,
        flag_message: flagMessage || null,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError || !newFlag) {
      logger.error('Error creating flag', { error: insertError });
      return NextResponse.json({
        error: 'Failed to create flag'
      }, { status: 500 });
    }

    logger.info('Question flag created', {
      flagId: newFlag.id,
      questionId,
      userId: user.id,
      flagType
    });

    return NextResponse.json({
      message: 'Flag berhasil dikirim. Terima kasih atas masukan ukhti.',
      flag: newFlag
    });

  } catch (error) {
    logger.error('Error in POST /api/exam/flags', { error: error as Error });
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET: Fetch flags for admin
export async function GET(request: NextRequest) {
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
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('exam_question_flags')
      .select('*, question:exam_questions(question_text, juz_number), user:users(full_name, email)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: flags, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json({
        error: 'Failed to fetch flags'
      }, { status: 500 });
    }

    return NextResponse.json({
      data: flags || [],
      total: flags?.length || 0
    });

  } catch (error) {
    logger.error('Error in GET /api/exam/flags', { error: error as Error });
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT: Update flag status (admin only)
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
    const { flagId, status, adminNotes } = body;

    if (!flagId || !status) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    const validStatuses = ['pending', 'reviewing', 'fixed', 'rejected', 'invalid'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        error: 'Invalid status',
        validStatuses: validStatuses
      }, { status: 400 });
    }

    const { data: updatedFlag, error: updateError } = await supabaseAdmin
      .from('exam_question_flags')
      .update({
        status,
        admin_notes: adminNotes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', flagId)
      .select()
      .single();

    if (updateError || !updatedFlag) {
      return NextResponse.json({
        error: 'Failed to update flag'
      }, { status: 500 });
    }

    logger.info('Question flag updated', {
      flagId,
      status,
      adminId: user.id
    });

    return NextResponse.json({
      message: 'Flag updated successfully',
      flag: updatedFlag
    });

  } catch (error) {
    logger.error('Error in PUT /api/exam/flags', { error: error as Error });
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

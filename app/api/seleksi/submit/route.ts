import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const contentType = request.headers.get('content-type');
    let submissionData: any = {};

    if (contentType?.includes('multipart/form-data')) {
      // Handle audio file upload
      const formData = await request.formData();
      const audioFile = formData.get('audio') as File;

      if (!audioFile) {
        return NextResponse.json(
          { error: 'No audio file provided' },
          { status: 400 }
        );
      }

      // Upload to Supabase Storage
      const fileName = `selection-${user.id}-${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('selection-audios')
        .upload(fileName, audioFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload audio' },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('selection-audios')
        .getPublicUrl(fileName);

      submissionData = {
        user_id: user.id,
        type: 'oral',
        audio_url: publicUrl,
        file_name: fileName,
        submission_date: new Date().toISOString()
      };
    } else {
      // Handle written quiz submission
      const body = await request.json();

      submissionData = {
        user_id: user.id,
        type: 'written',
        answers: body.answers,
        score: body.score,
        total_questions: body.totalQuestions,
        correct_answers: body.correctAnswers,
        submission_date: new Date().toISOString()
      };
    }

    // Check if user already exists in pendaftaran_tikrar_tahfidz
    const { data: existingRegistration, error: checkError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!existingRegistration) {
      return NextResponse.json(
        { error: 'Pendaftaran tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if already submitted this type of selection
    if (submissionData.type === 'oral' && existingRegistration.oral_submission_url) {
      return NextResponse.json(
        { error: 'Anda sudah menyerahkan rekaman suara' },
        { status: 400 }
      );
    }

    if (submissionData.type === 'written' && existingRegistration.written_quiz_answers) {
      return NextResponse.json(
        { error: 'Anda sudah menyelesaikan ujian tulisan' },
        { status: 400 }
      );
    }

    // Update pendaftaran_tikrar_tahfidz with selection data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (submissionData.type === 'oral') {
      updateData.oral_submission_url = submissionData.audio_url;
      updateData.oral_submission_file_name = submissionData.file_name;
      updateData.oral_submitted_at = new Date().toISOString();

      // Update selection_status if it's still pending
      if (existingRegistration.selection_status === 'pending') {
        updateData.selection_status = 'in_progress';
      }
    } else {
      updateData.written_quiz_answers = submissionData.answers;
      updateData.written_quiz_score = submissionData.score;
      updateData.written_quiz_total_questions = submissionData.total_questions;
      updateData.written_quiz_correct_answers = submissionData.correct_answers;
      updateData.written_quiz_submitted_at = new Date().toISOString();

      // Update selection_status if it's still pending
      if (existingRegistration.selection_status === 'pending') {
        updateData.selection_status = 'in_progress';
      }
    }

    const { data: submission, error: updateError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .update(updateData)
      .eq('id', existingRegistration.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      submission: submission,
      message: 'Seleksi berhasil dikirim'
    });

  } catch (error) {
    console.error('Selection submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's registration data
    const { data: registration, error } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch registration data' },
        { status: 500 }
      );
    }

    if (!registration) {
      return NextResponse.json({
        success: true,
        hasOral: false,
        hasWritten: false,
        registration: null
      });
    }

    // Check what types have been submitted
    const hasOral = !!registration.oral_submission_url;
    const hasWritten = !!registration.written_quiz_answers;

    return NextResponse.json({
      success: true,
      hasOral,
      hasWritten,
      registration: registration
    });

  } catch (error) {
    console.error('Get selection status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    console.log('🎵 Base64 API: Received audio submission request');

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Base64 API: No Bearer token found');
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Base64 API: Token length:', token.length);

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Base64 API: Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    console.log('✅ Base64 API: User authenticated:', user.id);

    // Parse request body
    const body = await request.json();
    const { audioBase64, fileName, mimeType, size } = body;

    console.log('📋 Base64 API: Request details:', {
      fileName,
      mimeType,
      size,
      base64Length: audioBase64?.length
    });

    if (!audioBase64 || !fileName) {
      console.error('❌ Base64 API: Missing required data');
      return NextResponse.json(
        { error: 'Missing audio data or filename' },
        { status: 400 }
      );
    }

    // Convert base64 back to blob
    console.log('🔄 Base64 API: Converting base64 to blob...');
    const byteCharacters = atob(audioBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType || 'audio/webm' });

    console.log('📊 Base64 API: Blob created:', {
      size: blob.size,
      type: blob.type
    });

    // Validate blob
    if (blob.size === 0) {
      console.error('❌ Base64 API: Converted blob is empty');
      return NextResponse.json(
        { error: 'Audio data is empty' },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const supabaseFileName = `selection-${user.id}-${Date.now()}-${fileName}`;
    console.log('📤 Base64 API: Uploading to storage:', supabaseFileName);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('selection-audios')
      .upload(supabaseFileName, blob, {
        contentType: mimeType || 'audio/webm',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('❌ Base64 API: Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload audio', details: uploadError.message },
        { status: 500 }
      );
    }

    console.log('✅ Base64 API: Upload successful:', uploadData);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('selection-audios')
      .getPublicUrl(supabaseFileName);

    console.log('🔗 Base64 API: Public URL:', publicUrl);

    // Check if user already exists in pendaftaran_tikrar_tahfidz
    const { data: existingRegistration, error: checkError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Base64 API: Check registration error:', checkError);
      return NextResponse.json(
        { error: 'Failed to check registration', details: checkError.message },
        { status: 500 }
      );
    }

    if (!existingRegistration) {
      console.error('❌ Base64 API: Registration not found for user:', user.id);
      return NextResponse.json(
        { error: 'Pendaftaran tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if already submitted oral
    if (existingRegistration.oral_submission_url) {
      return NextResponse.json(
        { error: 'Anda sudah menyerahkan rekaman suara' },
        { status: 400 }
      );
    }

    // Update registration
    const updateData = {
      oral_submission_url: publicUrl,
      oral_submission_file_name: supabaseFileName,
      oral_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('💾 Base64 API: Updating registration...');

    const { data: submission, error: updateError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .update(updateData)
      .eq('id', existingRegistration.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Base64 API: Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save submission', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ Base64 API: Update successful:', submission);

    return NextResponse.json({
      success: true,
      submission: submission,
      message: 'Seleksi berhasil dikirim (Base64)'
    });

  } catch (error: any) {
    console.error('❌ Base64 API: Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function POST(request: Request) {
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   '127.0.0.1';

  try {
    // Get authenticated user
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Please login first',
        step: 'auth',
        details: userError?.message
      });
    }

    const body = await request.json();

    // Debug info
    const debugInfo = {
      step: 'received',
      user: {
        id: user.id,
        email: user.email
      },
      body_keys: Object.keys(body),
      batch_id: body.batch_id,
      program_id: body.program_id,
      chosen_juz: body.chosen_juz,
      has_permission: body.has_permission
    };

    // Check if batch exists
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('batches')
      .select('*')
      .eq('id', body.batch_id)
      .single();

    if (batchError || !batch) {
      return NextResponse.json({
        success: false,
        error: 'Batch not found',
        step: 'batch_check',
        debug: debugInfo,
        batch_error: batchError?.message
      });
    }

    debugInfo.step = 'batch_found';
    debugInfo.batch_name = batch.name;

    // Check if program exists
    const { data: program, error: programError } = await supabaseAdmin
      .from('programs')
      .select('*')
      .eq('id', body.program_id)
      .single();

    if (programError || !program) {
      return NextResponse.json({
        success: false,
        error: 'Program not found',
        step: 'program_check',
        debug: debugInfo,
        program_error: programError?.message
      });
    }

    debugInfo.step = 'program_found';
    debugInfo.program_name = program.name;

    // Check if user exists in database
    const { data: dbUser, error: dbUserError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dbUserError) {
      return NextResponse.json({
        success: false,
        error: 'User not found in database',
        step: 'user_check',
        debug: debugInfo,
        user_error: dbUserError?.message
      });
    }

    debugInfo.step = 'user_found';
    debugInfo.db_user = {
      id: dbUser.id,
      full_name: dbUser.full_name,
      email: dbUser.email
    };

    // Test insert with minimal data
    const testData = {
      user_id: user.id,
      batch_id: body.batch_id,
      program_id: body.program_id,
      batch_name: batch.name,
      full_name: dbUser.full_name || 'Test',
      chosen_juz: body.chosen_juz || '1A',
      main_time_slot: body.main_time_slot || '06-09',
      backup_time_slot: body.backup_time_slot || '09-12',
      understands_commitment: true,
      tried_simulation: true,
      no_negotiation: true,
      has_telegram: true,
      saved_contact: true,
      has_permission: body.has_permission || 'yes',
      no_travel_plans: true,
      time_commitment: true,
      understands_program: true
    };

    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: 'Database insert failed',
        step: 'insert',
        debug: debugInfo,
        test_data: testData,
        insert_error: {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        }
      });
    }

    // Clean up test insert
    await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .delete()
      .eq('id', insertResult.id);

    return NextResponse.json({
      success: true,
      message: 'All checks passed! Submit should work.',
      debug: debugInfo
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      step: 'catch',
      error_message: error?.message || 'Unknown error',
      error_stack: error?.stack
    });
  }
}

// Also support GET for quick check
export async function GET(request: Request) {
  return NextResponse.json({
    message: 'Debug submit endpoint working. Use POST to test submission.',
    usage: 'POST with same body as /api/pendaftaran/submit'
  });
}

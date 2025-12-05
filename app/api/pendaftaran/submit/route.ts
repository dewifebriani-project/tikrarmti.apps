import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { PendaftaranData } from '@/lib/pendaftaran';

export async function POST(request: Request) {
  try {
    console.log('API: Starting form submission');

    const body = await request.json();
    console.log('API: Received body:', JSON.stringify(body, null, 2));

    // Validate required fields
    const requiredFields = ['user_id', 'batch_id', 'program_id'];
    for (const field of requiredFields) {
      if (!body[field]) {
        console.error(`API: Missing required field: ${field}`);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    console.log('API: Creating Supabase client...');
    const supabase = createServerClient();
    console.log('API: Supabase client created');

    // Prepare submission data
    const submissionData: PendaftaranData = {
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'pending',
      selection_status: 'pending',
      submission_date: new Date().toISOString()
    };

    console.log('API: Prepared submission data:', JSON.stringify(submissionData, null, 2));

    // Insert into tikrar_tahfidz table
    const { data: result, error } = await supabase
      .from('tikrar_tahfidz')
      .insert(submissionData)
      .select()
      .single();

    if (error) {
      console.error('API: Error inserting registration:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: `Failed to submit registration: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Registration submitted with ID:', result.id);

    return NextResponse.json({
      success: true,
      id: result.id,
      message: 'Registration submitted successfully'
    });

  } catch (error) {
    console.error('Error in submit registration API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
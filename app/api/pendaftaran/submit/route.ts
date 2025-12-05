import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { PendaftaranData } from '@/lib/pendaftaran';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['user_id', 'batch_id', 'program_id'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const supabase = createServerClient();

    // Prepare submission data
    const submissionData: PendaftaranData = {
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'pending',
      selection_status: 'pending',
      submission_date: new Date().toISOString()
    };

    // Insert into tikrar_tahfidz table
    const { data: result, error } = await supabase
      .from('tikrar_tahfidz')
      .insert(submissionData)
      .select()
      .single();

    if (error) {
      console.error('Error inserting registration:', error);
      return NextResponse.json(
        { error: 'Failed to submit registration' },
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
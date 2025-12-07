import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PendaftaranData } from '@/lib/pendaftaran';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    console.log('API: Using Supabase client...');

    // Remove fields that don't exist in database schema or are undefined/null/empty
    const { birth_place, email, provider, ...cleanedBody } = body;

    // Remove optional fields that are empty/null/undefined to avoid DB errors
    const filteredBody = Object.entries(cleanedBody).reduce((acc, [key, value]) => {
      // Keep the value if it's not null, undefined, or empty string
      // But keep boolean false and number 0
      if (value !== null && value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    // Prepare submission data
    const submissionData: PendaftaranData = {
      ...filteredBody,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'pending',
      selection_status: 'pending',
      submission_date: new Date().toISOString()
    };

    console.log('API: Prepared submission data:', JSON.stringify(submissionData, null, 2));

    // CRITICAL: Always ensure user exists before submitting form
    console.log('API: Ensuring user exists in database before submission...');

    try {
      const ensureResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/ensure-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: body.user_id,
          email: body.email || '',
          full_name: body.full_name || '',
          provider: body.provider || 'unknown'
        })
      });

      if (ensureResponse.ok) {
        const ensureResult = await ensureResponse.json();
        console.log('API: User ensure result:', ensureResult);
      } else {
        console.error('API: Failed to ensure user exists:', await ensureResponse.text());
        // Continue anyway - the insert will fail if user truly doesn't exist
      }
    } catch (ensureError) {
      console.error('API: Error ensuring user:', ensureError);
      // Continue anyway - user might already exist
    }

    // Insert into pendaftaran_tikrar_tahfidz table
    console.log('API: Attempting to insert into pendaftaran_tikrar_tahfidz table...');
    console.log('API: Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('API: Using service role key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Yes' : 'No');

    const { data: result, error } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .insert(submissionData)
      .select()
      .single();

    if (error) {
      console.error('API: Error inserting registration:', JSON.stringify(error, null, 2));
      console.error('API: Error code:', error.code);
      console.error('API: Error details:', error.details);
      console.error('API: Error hint:', error.hint);
      console.error('API: Full error object:', JSON.stringify(error, null, 2));

      // If it's a foreign key constraint error, provide more helpful message
      if (error.code === '23503' || error.message.includes('foreign key constraint')) {
        return NextResponse.json(
          {
            error: 'User authentication error. Please try logging out and logging back in, then submit the form again.',
            details: error.message,
            code: 'FOREIGN_KEY_VIOLATION'
          },
          { status: 400 }
        );
      }

      // Check if table doesn't exist
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return NextResponse.json(
          {
            error: 'Database configuration error. The registration table does not exist.',
            details: `Table 'pendaftaran_tikrar_tahfidz' not found. Expected table name: 'pendaftaran_tikrar_tahfidz'`,
            code: 'TABLE_NOT_FOUND'
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: `Failed to submit registration: ${error.message}`,
          code: error.code,
          details: error.details
        },
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
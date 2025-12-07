import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Checking registration for user_id:', session.user.id);
    console.log('User email:', session.user.email);

    // First, let's check if there are any records at all in the table
    const { data: allRecords, error: allError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('user_id, email, full_name, created_at')
      .limit(5);

    console.log('Sample records from table:', allRecords);
    console.log('All records error:', allError);

    // Check if user has already registered in pendaftaran_tikrar_tahfidz table
    // Try to find by email as well as user_id
    const { data: registration, error } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('Registration query error:', error);

    // If not found by user_id, try searching by email as a fallback
    if (error && error.code === 'PGRST116') {
      console.log('Not found by user_id, trying email search...');
      const { data: emailRegistration, error: emailError } = await supabase
        .from('pendaftaran_tikrar_tahfidz')
        .select('*')
        .eq('email', session.user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('Email search result:', emailRegistration);
      console.log('Email search error:', emailError);

      if (emailRegistration) {
        return NextResponse.json({
          hasRegistered: true,
          registration: {
            id: emailRegistration.id,
            status: emailRegistration.status,
            selection_status: emailRegistration.selection_status,
            submission_date: emailRegistration.submission_date,
            chosen_juz: emailRegistration.chosen_juz,
            batch_name: emailRegistration.batch_name,
            full_name: emailRegistration.full_name
          }
        });
      }

      if (emailError && emailError.code !== 'PGRST116') {
        console.error('Error checking email registration:', emailError);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        hasRegistered: false
      });
    }

    if (error) {
      console.error('Error checking registration:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    if (registration) {
      return NextResponse.json({
        hasRegistered: true,
        registration: {
          id: registration.id,
          status: registration.status,
          selection_status: registration.selection_status,
          submission_date: registration.submission_date,
          chosen_juz: registration.chosen_juz,
          batch_name: registration.batch_name,
          full_name: registration.full_name
        }
      });
    }

    return NextResponse.json({
      hasRegistered: false
    });

  } catch (error) {
    console.error('Error checking registration status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
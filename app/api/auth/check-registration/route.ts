import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Create a Supabase client with cookie handling
const createServerSupabaseClient = () => {
  const cookieStore = cookies();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          // Forward cookies to Supabase
          cookie: cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
        }
      }
    } as any
  );
};

export async function GET(request: Request) {
  try {
    // Get Supabase client with cookie handling
    const supabase = createServerSupabaseClient();

    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Debug: Log the user ID
    console.log('Checking registration for user ID:', session.user.id);
    console.log('User email:', session.user.email);

    // Create service client for database operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user has already registered in pendaftaran_tikrar_tahfidz table
    console.log('Querying with user_id:', session.user.id);
    const { data: registration, error } = await serviceSupabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('Query result - registration:', registration);
    console.log('Query result - error:', error);

    // If there's an error, try searching by email as a fallback
    // This handles cases where user_id might not match due to auth provider changes
    if (error) {
      console.error('Error checking registration by user_id:', error);

      // Try to find by email if user_id search fails
      if (session.user.email) {
        const { data: emailRegistration, error: emailError } = await serviceSupabase
          .from('pendaftaran_tikrar_tahfidz')
          .select('*')
          .eq('email', session.user.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (emailError) {
          console.error('Error checking email registration:', emailError);
        }

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
      }

      // If both searches fail, return not registered (don't return error to avoid breaking the UI)
      return NextResponse.json({
        hasRegistered: false
      });
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
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

    // Try to get session from Authorization header first
    const authHeader = request.headers.get('authorization');
    let session, sessionError;

    if (authHeader?.startsWith('Bearer ')) {
      // Use the token from Authorization header
      const token = authHeader.substring(7);
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: user, error: userError } = await serviceSupabase.auth.getUser(token);

      if (!userError && user?.user) {
        session = { user: user.user };
        sessionError = null;
        console.log('Session found via Authorization header');
      } else {
        sessionError = userError;
        session = null;
        console.error('Error getting user from token:', userError);
      }
    } else {
      // Fallback to cookie-based session
      console.log('No Authorization header, checking cookies...');
      const cookieStore = cookies();
      const allCookies = cookieStore.getAll();
      console.log('Available cookies:', allCookies.map(c => c.name));

      const result = await supabase.auth.getSession();
      session = result.data.session;
      sessionError = result.error;
    }

    if (sessionError || !session?.user) {
      console.error('Session error or no session:', sessionError?.message);
      // Temporarily return success without auth check for debugging
      return NextResponse.json({
        hasRegistered: false,
        debug: {
          sessionError: sessionError?.message,
          hasSession: !!session,
          authHeader: !!authHeader
        }
      });
    }

    // Debug: Log the user ID
    console.log('Checking registration for user ID:', session.user.id);
    console.log('User email:', session.user.email);

    // Create service client for database operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First try to find by user_id
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

    // If we found registration by user_id, return it
    if (registration && !error) {
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

    // If no registration found by user_id, try searching by email as a fallback
    // This handles cases where user_id might not match due to auth provider changes
    if (session.user.email) {
      console.log('No registration found by user_id, trying email search...');
      const { data: emailRegistration, error: emailError } = await serviceSupabase
        .from('pendaftaran_tikrar_tahfidz')
        .select('*')
        .eq('email', session.user.email.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('Email search result - registration:', emailRegistration);
      console.log('Email search result - error:', emailError);

      if (emailRegistration && !emailError) {
        // Update the user_id if it's different to fix future queries
        if (emailRegistration.user_id !== session.user.id) {
          console.log('Updating user_id for registration:', emailRegistration.id);
          await serviceSupabase
            .from('pendaftaran_tikrar_tahfidz')
            .update({ user_id: session.user.id })
            .eq('id', emailRegistration.id);
        }

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

    // If no registration found by either method
    console.log('No registration found for user:', session.user.id, session.user.email);
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
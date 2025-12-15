import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Create a Supabase client with cookie handling
const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          // Forward cookies to Supabase
          cookie: allCookies.map(c => `${c.name}=${c.value}`).join('; ')
        }
      }
    } as any
  );
};

export async function GET(request: Request) {
  try {
    // Get Supabase client with cookie handling
    const supabase = await createServerSupabaseClient();

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
      } else {
        sessionError = userError;
        session = null;
      }
    } else {
      // Fallback to cookie-based session
      const result = await supabase.auth.getSession();
      session = result.data.session;
      sessionError = result.error;
    }

    if (sessionError || !session?.user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          sessionError: sessionError?.message,
          hasSession: !!session,
          authHeader: !!authHeader
        },
        { status: 200 } // Return 200 instead of 401 for debugging
      );
    }

    // Create service client for database operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all registrations for this user (by user_id)
    const { data: userIdRegistrations, error: userIdError } = await serviceSupabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .eq('user_id', session.user.id);

    // Get all registrations for this user (by email)
    const { data: emailRegistrations, error: emailError } = await serviceSupabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .ilike('email', session.user.email?.toLowerCase() || '');

    // Get total count in the table
    const { count: totalCount } = await serviceSupabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      userInfo: {
        id: session.user.id,
        email: session.user.email,
        app_metadata: session.user.app_metadata,
        user_metadata: session.user.user_metadata
      },
      registrationsByUserId: {
        data: userIdRegistrations,
        error: userIdError?.message,
        count: userIdRegistrations?.length || 0
      },
      registrationsByEmail: {
        data: emailRegistrations,
        error: emailError?.message,
        count: emailRegistrations?.length || 0
      },
      totalRegistrationsInTable: totalCount,
      sessionInfo: {
        hasSession: !!session,
        expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
      }
    });

  } catch (error) {
    console.error('Error in debug-registration:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
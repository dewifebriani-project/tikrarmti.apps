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
        {
          error: 'Unauthorized',
          sessionError: sessionError?.message,
          hasSession: !!session
        },
        { status: 401 }
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
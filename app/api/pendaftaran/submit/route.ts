import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PendaftaranData } from '@/lib/pendaftaran';
import { getCSRFTokenFromRequest, validateCSRFToken } from '@/lib/csrf';
import { logger } from '@/lib/logger-secure';
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  // Get client IP for logging
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   '127.0.0.1';

  try {
    // CSRF Protection - Skip in development for debugging
    if (process.env.NODE_ENV === 'production') {
      const csrfToken = getCSRFTokenFromRequest(request);
      const cookieToken = request.headers.get('cookie')?.split('; ')
        .find(c => c.startsWith('csrf-token='))?.split('=')[1];

      if (!csrfToken || !cookieToken || !validateCSRFToken(csrfToken, cookieToken)) {
        logger.warn('CSRF token validation failed', {
          ip: clientIP,
          endpoint: '/api/pendaftaran/submit'
        });

        return NextResponse.json(
          { error: 'Invalid CSRF token. Please refresh the page and try again.' },
          { status: 403 }
        );
      }
    }

    // Robust authentication check - try multiple methods
    let session, sessionError;

    // Method 1: Try Authorization header first (Bearer token)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      console.log('Trying Authorization header authentication');
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
        console.error('Error getting user from Authorization header:', userError);
      }
    }

    // Method 2: Fall back to cookie-based authentication if header method failed
    if (!session) {
      console.log('Trying cookie-based authentication');
      const supabase = await createServerSupabaseClient();
      const { data: { session: cookieSession }, error: cookieError } = await supabase.auth.getSession();

      if (!cookieError && cookieSession?.user) {
        session = cookieSession;
        sessionError = null;
        console.log('Session found via cookies');
      } else {
        sessionError = cookieError;
        session = null;
        console.error('Error getting session from cookies:', cookieError);
      }
    }

    // Method 3: Final fallback using setSession with cookies
    if (!session) {
      console.log('Trying setSession fallback');
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll();
      const accessTokenCookie = allCookies.find(c => c.name === 'sb-access-token');
      const refreshTokenCookie = allCookies.find(c => c.name === 'sb-refresh-token');
      const accessToken = accessTokenCookie?.value;
      const refreshToken = refreshTokenCookie?.value;
      console.log('All cookies:', allCookies.map(c => c.name));
      console.log('Access token exists:', !!accessToken);
      console.log('Refresh token exists:', !!refreshToken);

      if (accessToken) {
        const authClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: { session: fallbackSession }, error: fallbackError } = await authClient.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        });

        if (!fallbackError && fallbackSession?.user) {
          session = fallbackSession;
          sessionError = null;
          console.log('Session found via setSession fallback');
        } else {
          sessionError = fallbackError;
          session = null;
          console.error('Error getting session via setSession:', fallbackError);
        }
      }
    }

    if (sessionError || !session?.user) {
      const cookieStoreForLog = await cookies();
      logger.warn('Unauthorized form submission attempt', {
        ip: clientIP,
        endpoint: '/api/pendaftaran/submit',
        sessionError: sessionError?.message,
        hasAuthHeader: !!authHeader,
        availableCookies: cookieStoreForLog.getAll().map(c => c.name)
      });

      return NextResponse.json(
        { error: 'Authentication required. Please login to submit the form.' },
        { status: 401 }
      );
    }

    logger.info('Starting form submission', {
      ip: clientIP,
      endpoint: '/api/pendaftaran/submit',
      userId: session.user.id
    });

    const body = await request.json();
    // Don't log full body in production for security
    logger.debug('Received submission data', {
      userId: body.user_id ? body.user_id.substring(0, 8) + '...' : undefined,
      batchId: body.batch_id,
      programId: body.program_id
    });

    // Validate required fields
    const requiredFields = ['user_id', 'batch_id', 'program_id'];
    for (const field of requiredFields) {
      if (!body[field]) {
        logger.warn(`Missing required field: ${field}`, {
          field,
          ip: clientIP
        });
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Verify that the user_id in the request matches the authenticated user
    if (body.user_id !== session.user.id) {
      logger.warn('User ID mismatch in form submission', {
        requestUserId: body.user_id,
        sessionUserId: session.user.id,
        ip: clientIP
      });

      return NextResponse.json(
        { error: 'Invalid user session. Please login again.' },
        { status: 401 }
      );
    }

    // Remove fields that don't exist in database schema or are undefined/null/empty
    const { birth_place, email, provider, ...cleanedBody } = body;

    // Remove optional fields that are empty/null/undefined to avoid DB errors
    // But keep has_permission even if empty since it's required by DB constraint
    const filteredBody = Object.entries(cleanedBody).reduce((acc, [key, value]) => {
      // Keep has_permission even if empty (should be validated on frontend)
      if (key === 'has_permission') {
        acc[key] = value || '';
        return acc;
      }

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

    logger.debug('Prepared submission data', {
      userId: body.user_id ? body.user_id.substring(0, 8) + '...' : undefined,
      batchId: body.batch_id,
      programId: body.program_id
    });

    // CRITICAL: Always ensure user exists before submitting form
    logger.debug('Ensuring user exists in database before submission');

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
        logger.debug('User ensure result', {
          success: ensureResult.success || false
        });
      } else {
        logger.warn('Failed to ensure user exists', {
          status: ensureResponse.status,
          ip: clientIP
        });
        // Continue anyway - the insert will fail if user truly doesn't exist
      }
    } catch (ensureError) {
      logger.warn('Error ensuring user', {
        error: ensureError as Error,
        ip: clientIP
      });
      // Continue anyway - user might already exist
    }

    const { data: result, error } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .insert(submissionData)
      .select()
      .single();

    if (error) {
      logger.error('Error inserting registration', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        ip: clientIP
      });

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
          error: 'Failed to submit registration',
          code: error.code
        },
        { status: 500 }
      );
    }

    logger.info('Registration submitted successfully', {
      registrationId: result.id,
      ip: clientIP
    });

    return NextResponse.json({
      success: true,
      id: result.id,
      message: 'Registration submitted successfully'
    });

  } catch (error) {
    logger.error('Unhandled error in submit registration API', {
      error: error as Error,
      ip: clientIP
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    console.log('[ensure-user] API called');
    const body = await request.json();
    const { userId, email, full_name, provider } = body;

    console.log('[ensure-user] Received data:', { userId, email, provider });

    // CRITICAL: ALL users (including OAuth) must exist in database for foreign key constraints
    if (!userId || !email) {
      console.error('[ensure-user] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: userId and email' },
        { status: 400 }
      );
    }

    // Check if user already exists with a simple query
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[ensure-user] Error checking existing user:', fetchError);
      return NextResponse.json(
        { error: `Database error: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (existingUser) {
      console.log('[ensure-user] User already exists');
      return NextResponse.json({ success: true, created: false });
    }

    // Create new user with retry mechanism for all platforms
    let retries = 0;
    const maxRetries = 3;
    let insertError = null;

    while (retries < maxRetries) {
      const { error: err } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          full_name: full_name || email.split('@')[0],
          role: 'calon_thalibah',
          password_hash: 'managed_by_auth_system',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          auth_provider: provider || 'unknown'
        });

      if (!err) {
        break; // Success, exit retry loop
      }

      insertError = err;
      retries++;
      console.log(`[ensure-user] Retry ${retries}/${maxRetries} for user ${userId}`);

      // Wait before retry (longer for mobile/tablet)
      const waitTime = provider === 'google' ? 1000 : 500;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    if (insertError) {
      console.error('[ensure-user] Error inserting user after retries:', insertError);
      return NextResponse.json(
        { error: `Failed to create user: ${insertError.message}` },
        { status: 500 }
      );
    }

    console.log('[ensure-user] User created successfully');
    return NextResponse.json({ success: true, created: true });

  } catch (error: any) {
    console.error('[ensure-user] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

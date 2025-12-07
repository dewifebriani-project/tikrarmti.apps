import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email, full_name } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and email' },
        { status: 400 }
      );
    }

    console.log('[ensure-user] Ensuring user exists in database:', { userId, email });

    // Check if user already exists
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

    // Create new user
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        full_name: full_name || email.split('@')[0],
        role: 'calon_thalibah',
        password_hash: 'managed_by_auth_system',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('[ensure-user] Error inserting user:', insertError);
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

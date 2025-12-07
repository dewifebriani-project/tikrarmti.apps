import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Create Supabase client with cookie handling
    const cookieStore = cookies();

    const supabase = createClient(
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

    // Get session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Session error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    // Return user info
    return NextResponse.json({
      id: session.user.id,
      email: session.user.email,
      user_metadata: session.user.user_metadata,
      app_metadata: session.user.app_metadata
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
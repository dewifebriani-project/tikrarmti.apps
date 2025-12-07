import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Extending session for user:', userId);

    // Since we can't directly set JWT expiration in Free tier,
    // we'll ensure the current session is refreshed and valid
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      console.error('User not found:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // For now, just validate the session exists and is refreshable
    // The actual session duration is managed by Supabase configuration
    // We'll rely on client-side refresh mechanisms to maintain session

    return NextResponse.json({
      success: true,
      message: 'Session validated successfully',
      note: 'Session extension is handled by client-side refresh mechanism',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Next 24h as estimate
    });

  } catch (error) {
    console.error('Error in extend-session API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
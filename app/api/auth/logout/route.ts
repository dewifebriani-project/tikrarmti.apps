import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = createClient();

    // Use Supabase Auth to sign out - this clears cookies on server
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase signOut error:', error);
      return NextResponse.json(
        { error: 'Failed to sign out' },
        { status: 500 }
      );
    }

    console.log('Logout: User signed out successfully');

    // Return success response
    // The signOut() above has already cleared the cookies
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
      redirect: '/login'
    });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

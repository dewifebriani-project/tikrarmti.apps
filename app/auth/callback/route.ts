import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // "next" is the dynamic redirect path as standard in Supabase workflows.
  const next = searchParams.get('next') ?? '/dashboard';
  // "type" is typically sent when users do Password Recovery ('recovery').
  const type = searchParams.get('type');
  
  // Also check for error parameters from Google OAuth
  const errorMsg = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  
  if (errorMsg) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || errorMsg)}`);
  }

  if (code) {
    // Initial response to be populated with session cookies
    let response = NextResponse.next({ request: { headers: request.headers } });
    
    // Pass the response object to createClient so cookies are attached!
    const supabase = createClient({ response });
    
    // Server-side exchange of the OAuth / Recovery code for a session.
    console.log('[auth/callback] Exchanging code for session...');
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[auth/callback] Exchange code failed:', exchangeError.message, exchangeError.status);
      return NextResponse.redirect(`${origin}/login?error=Authentication+failed&reason=${encodeURIComponent(exchangeError.message)}`);
    }

    if (data.user) {
      // Automatic Profile Creation for Google OAuth Users
      try {
        const { error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (userError && userError.code === 'PGRST116') {
          console.log('[auth/callback] Creating new user profile for:', data.user.email);
          await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email || '',
              full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || '',
              role: data.user.user_metadata?.role || 'thalibah',
              created_at: new Date().toISOString(),
            } as any);
        }
      } catch (profileErr) {
        console.warn('[auth/callback] Non-blocking profile check/creation failed:', profileErr);
      }

      // Route handling depending on the workflow triggered
      if (type === 'recovery') {
        console.log('[auth/callback] Recovery detected, redirecting to reset-password');
        return NextResponse.redirect(`${origin}/reset-password`);
      }
      
      console.log('[auth/callback] Success, redirecting to:', next);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If no code is present or no user data
  console.warn('[auth/callback] No code present or data.user is missing');
  return NextResponse.redirect(`${origin}/login?error=Authentication+failed`);
}

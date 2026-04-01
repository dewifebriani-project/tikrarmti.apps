import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // GET SEARCH PARAMS
  const { searchParams, origin } = new URL(request.url);
  
  // PARAMS DEBUG LOGGING - Using console.error to ensure visibility in production/local terminal
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => { params[key] = value; });
  console.error('[auth/callback] PHASE 4 INCOMING URL:', request.url);
  console.error('[auth/callback] PHASE 4 PARAMS:', params);

  const code = searchParams.get('code');
  // Also check for error parameters from Google OAuth
  const errorMsg = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  
  if (errorMsg) {
    console.error('[auth/callback] Redirected from Auth server with error:', { errorMsg, errorDescription });
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
      const errorMsg = encodeURIComponent('Authentication failed');
      const reason = encodeURIComponent(exchangeError.message);
      return NextResponse.redirect(`${origin}/login?error=${errorMsg}&reason=${reason}`);
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
      // We check for type='recovery' or next='/reset-password' to prioritize the recovery UI
      const nextPathFromUrl = searchParams.get('next');
      const authTypeFromUrl = searchParams.get('type');
      
      const nextPath = nextPathFromUrl || '/dashboard';
      const authType = authTypeFromUrl;

      // EXTREMELY ROBUST RECOVERY DETECTION
      // We look for type=recovery OR next=/reset-password OR if the path contains reset-password
      const isRecoveryFlow = 
        authType === 'recovery' || 
        nextPath === '/reset-password' || 
        nextPath.includes('reset-password') ||
        request.url.includes('type=recovery');
      
      console.error('[auth/callback] PHASE 4 EVALUATION:', { 
        authType, 
        nextPath, 
        isRecoveryFlow,
        origin,
        codeProvided: !!code
      });

      if (isRecoveryFlow) {
        console.error('[auth/callback] RECOVERY CONFIRMED -> Redirecting to /reset-password');
        return NextResponse.redirect(`${origin}/reset-password`);
      }
      
      console.error('[auth/callback] FALLBACK REDIRECT ->', nextPath);
      return NextResponse.redirect(`${origin}${nextPath}`);
    }
  }

  // If no code is present or no user data
  console.warn('[auth/callback] Auth failed: No code present or data.user missing');
  const errorReason = !code ? 'missing_code' : 'no_user_session';
  return NextResponse.redirect(`${origin}/login?error=Authentication+failed&reason=${errorReason}`);
}

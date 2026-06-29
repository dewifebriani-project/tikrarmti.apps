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
    // 1. Determine the target path first
    const nextPathFromUrl = searchParams.get('next');
    const authTypeFromUrl = searchParams.get('type');
    const nextPath = nextPathFromUrl || '/dashboard';
    const authType = authTypeFromUrl;

    const isRecoveryFlow = 
      authType === 'recovery' || 
      nextPath === '/reset-password' || 
      nextPath.includes('reset-password') ||
      request.url.includes('type=recovery');

    const targetUrl = isRecoveryFlow ? `${origin}/reset-password` : `${origin}${nextPath}`;
    
    // 2. Create the redirect response EARLY
    let response = NextResponse.redirect(targetUrl);
    
    // 3. Pass the redirect response to createClient so cookies are attached to it!
    const supabase = createClient({ response });
    
    // 4. Server-side exchange of the OAuth / Recovery code for a session.
    console.log('[auth/callback] Exchanging code for session with target:', targetUrl);
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[auth/callback] Exchange code failed:', exchangeError.message);
      const errorMsg = encodeURIComponent('Authentication failed');
      return NextResponse.redirect(`${origin}/login?error=${errorMsg}&reason=${encodeURIComponent(exchangeError.message)}`);
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
          console.warn('[auth/callback] User not registered in public.users. Rejecting Google login for:', data.user.email);
          
          try {
            // Import admin client to delete the auto-created auth user
            const { createSupabaseAdmin } = await import('@/lib/supabase');
            const supabaseAdmin = createSupabaseAdmin();
            await (supabaseAdmin as any).auth.admin.deleteUser(data.user.id);
            console.log('[auth/callback] Deleted unwanted auth user:', data.user.id);
          } catch (delError) {
            console.error('[auth/callback] Failed to delete auth user:', delError);
          }
          
          // Sign out the session that was just created
          await supabase.auth.signOut();
          
          // Redirect to login with error message
          return NextResponse.redirect(`${origin}/login?message=not_registered&email=${encodeURIComponent(data.user.email || '')}`);
        }
      } catch (profileErr) {
        console.warn('[auth/callback] Error checking profile:', profileErr);
      }

      console.error('[auth/callback] SUCCESS -> Redirecting to:', targetUrl);
      return response;
    }
  }

  // If no code is present or no user data
  console.warn('[auth/callback] Auth failed: No code present or data.user missing');
  const errorReason = !code ? 'missing_code' : 'no_user_session';
  return NextResponse.redirect(`${origin}/login?error=Authentication+failed&reason=${errorReason}`);
}

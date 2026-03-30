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
    const supabase = createClient();
    
    // Server-side exchange of the OAuth / Recovery code for a session.
    // This allows @supabase/ssr to set the chunked cookies deterministically on the server response!
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      
      // Automatic Profile Creation for Google OAuth Users
      // When a new user logs in via Google, they bypass the manual registration,
      // so we must ensure they have a record in `public.users` to receive a role.
      try {
        // Query to see if they exist yet
        const { error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (userError && userError.code === 'PGRST116') {
          console.log('[auth/callback] Creating new user profile for:', data.user.email);
          // Insert missing user profile
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
        return NextResponse.redirect(`${origin}/reset-password`);
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If no code is present, or exchangeCodeForSession failed
  return NextResponse.redirect(`${origin}/login?error=Authentication+failed`);
}

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has muallimah role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roles = userData?.roles || [];
    if (!roles.includes('muallimah')) {
      return NextResponse.json({ error: 'Forbidden: Muallimah access required' }, { status: 403 });
    }

    // Get muallimah registration
    const { data: registration, error } = await supabase
      .from('muallimah_registrations')
      .select(`
        *,
        batch:batches(id, name, status)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No registration found
        return NextResponse.json({ success: true, data: null });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data: registration });
  } catch (error: any) {
    console.error('Error in muallimah registration API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

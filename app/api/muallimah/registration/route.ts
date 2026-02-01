import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has muallimah or admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roles = userData?.roles || [];
    const isAdmin = roles.includes('admin');
    const isMuallimah = roles.includes('muallimah');

    if (!isAdmin && !isMuallimah) {
      return NextResponse.json({ error: 'Forbidden: Muallimah or Admin access required' }, { status: 403 });
    }

    // Admin can view specific user's registration, muallimah can only view their own
    const targetUserId = isAdmin && userId ? userId : user.id;

    // Get muallimah registration
    let query = supabase
      .from('muallimah_registrations')
      .select(`
        *,
        batch:batches(id, name, status),
        user:users(id, full_name, nama_kunyah, email, whatsapp)
      `)
      .order('created_at', { ascending: false });

    if (isAdmin && !userId) {
      // Admin viewing all registrations
      const { data: registrations, error } = await query;
      if (error) throw error;
      return NextResponse.json({ success: true, data: registrations || [] });
    } else {
      // Viewing specific registration (muallimah own, or admin viewing specific user)
      const { data: registration, error } = await query
        .eq('user_id', targetUserId)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return NextResponse.json({ success: true, data: registration });
    }
  } catch (error: any) {
    console.error('Error in muallimah registration API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

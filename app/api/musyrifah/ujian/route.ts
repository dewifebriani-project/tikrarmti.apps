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

    // Verify user has musyrifah role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roles = userData?.roles || [];
    if (!roles.includes('musyrifah')) {
      return NextResponse.json({ error: 'Forbidden: Musyrifah access required' }, { status: 403 });
    }

    // Get ujian results
    const { data: results, error } = await supabase
      .from('exam_attempts')
      .select(`
        id,
        thalibah_id,
        juz_number,
        score,
        status,
        submitted_at,
        thalibah:users(full_name)
      `)
      .order('submitted_at', { ascending: false })
      .limit(100);

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return NextResponse.json({ success: true, data: [] });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data: results || [] });
  } catch (error: any) {
    console.error('Error in musyrifah ujian API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    // Get statistics
    const stats = {
      totalThalibah: 0,
      activeHalaqah: 0,
      pendingJurnalReview: 0,
      pendingTashihReview: 0,
      pendingUjianReview: 0,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error in musyrifah stats API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

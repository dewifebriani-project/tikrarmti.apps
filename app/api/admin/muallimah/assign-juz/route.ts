import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Check if user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (!userData || !userData.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { muallimah_id, assigned_juz, batch_id } = body;

    if (!muallimah_id || !assigned_juz || !batch_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the final_assigned_juz in muallimah_akads
    const { error: updateError } = await supabaseAdmin
      .from('muallimah_akads')
      .update({ final_assigned_juz: assigned_juz })
      .eq('user_id', muallimah_id)
      .eq('batch_id', batch_id);

    if (updateError) {
      console.error('Error updating final_assigned_juz:', updateError);
      return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in assign-juz:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

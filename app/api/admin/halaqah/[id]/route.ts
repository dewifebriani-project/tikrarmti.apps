import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getRoleRank, ROLE_RANKS } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    const primaryRole = userProfile?.roles?.[0] || 'thalibah';
    if (getRoleRank(primaryRole) < ROLE_RANKS.admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { start_time, end_time, zoom_link_id } = body;

    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('halaqah')
      .update({
        start_time,
        end_time,
        zoom_link_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error updating halaqah:', error);
    return NextResponse.json(
      { error: 'Failed to update halaqah', details: error.message },
      { status: 500 }
    );
  }
}

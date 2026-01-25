import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/halaqah/[id]/promote-waitlist - Admin manually promotes waitlist student to active
const supabaseAdmin = createSupabaseAdmin();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const halaqahId = params.id;

  try {
    const body = await request.json();
    const { student_id } = body;

    // Validate required fields
    if (!student_id) {
      return NextResponse.json(
        { error: 'Missing required field: student_id' },
        { status: 400 }
      );
    }

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !userData.role?.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Get current enrollment
    const { data: enrollment, error: fetchError } = await supabase
      .from('halaqah_students')
      .select('*')
      .eq('id', student_id)
      .single();

    if (fetchError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    if (enrollment.status !== 'waitlist') {
      return NextResponse.json({
        error: 'Student is not on waitlist',
        current_status: enrollment.status
      }, { status: 400 });
    }

    // Check halaqah capacity before promoting
    const { count: activeCount } = await supabase
      .from('halaqah_students')
      .select('*', { count: 'exact', head: true })
      .eq('halaqah_id', halaqahId)
      .eq('status', 'active');

    const { data: halaqah } = await supabase
      .from('halaqah')
      .select('max_students')
      .eq('id', halaqahId)
      .single();

    if (!halaqah) {
      return NextResponse.json({ error: 'Halaqah not found' }, { status: 404 });
    }

    const maxCapacity = halaqah.max_students || 20;
    const currentActive = activeCount || 0;

    if (currentActive >= maxCapacity) {
      return NextResponse.json({
        error: 'Cannot promote - halaqah is at full capacity',
        current_active: currentActive,
        max_capacity: maxCapacity
      }, { status: 400 });
    }

    // Promote to active
    const { error: promoteError } = await supabase
      .from('halaqah_students')
      .update({
        status: 'active',
        promoted_from_waitlist_at: new Date().toISOString()
      })
      .eq('id', student_id);

    if (promoteError) {
      return NextResponse.json({ error: promoteError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Student promoted from waitlist to active'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

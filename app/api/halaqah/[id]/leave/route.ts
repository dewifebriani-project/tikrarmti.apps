import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface LeaveRequest {
  thalibah_id: string;
}

// POST /api/halaqah/[id]/leave - Thalibah leaves halaqah (auto-promotes waitlist)
const supabaseAdmin = createSupabaseAdmin();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const halaqahId = params.id;

  try {
    const body: LeaveRequest = await request.json();
    const { thalibah_id } = body;

    // Validate required fields
    if (!thalibah_id) {
      return NextResponse.json(
        { error: 'Missing required field: thalibah_id' },
        { status: 400 }
      );
    }

    // Get current enrollment
    const { data: enrollment, error: fetchError } = await supabase
      .from('halaqah_students')
      .select('*')
      .eq('halaqah_id', halaqahId)
      .eq('thalibah_id', thalibah_id)
      .single();

    if (fetchError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Update status to dropped
    const { error: updateError } = await supabase
      .from('halaqah_students')
      .update({ status: 'dropped' })
      .eq('id', enrollment.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Auto-promote first student from waitlist if exists
    const { data: waitlistStudents, error: waitlistError } = await supabase
      .from('halaqah_students')
      .select('*')
      .eq('halaqah_id', halaqahId)
      .eq('status', 'waitlist')
      .order('joined_waitlist_at', { ascending: true })
      .limit(1);

    let promotedStudent: any = null;

    if (!waitlistError && waitlistStudents && waitlistStudents.length > 0) {
      const firstWaitlist = waitlistStudents[0];

      // Promote to active
      const { error: promoteError } = await supabase
        .from('halaqah_students')
        .update({
          status: 'active',
          promoted_from_waitlist_at: new Date().toISOString()
        })
        .eq('id', firstWaitlist.id);

      if (!promoteError) {
        promotedStudent = {
          id: firstWaitlist.thalibah_id,
          previous_position: 1
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully left the halaqah',
      promoted_student: promotedStudent
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

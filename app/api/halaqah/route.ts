import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface HalaqahWithRelations {
  id: string;
  program_id: string;
  muallimah_id?: string;
  name: string;
  description?: string;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  location?: string;
  max_students?: number;
  waitlist_max?: number;
  preferred_juz?: number;
  status: string;
  program?: any;
  muallimah?: any;
  mentors?: Array<{ mentor_id: string; role: string; is_primary: boolean }>;
  students_count?: number;
  waitlist_count?: number;
}

// GET /api/halaqah - List all halaqah with filters
const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const batchId = searchParams.get('batch_id');
    const programId = searchParams.get('program_id');
    const muallimahId = searchParams.get('muallimah_id');
    const preferredJuz = searchParams.get('preferred_juz');

    let query = supabase
      .from('halaqah')
      .select(`
        *,
        program:programs(*, batch:batches(*)),
        muallimah:users!left(id, full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (batchId) {
      query = query.eq('program.batch_id', batchId);
    }
    if (programId) {
      query = query.eq('program_id', programId);
    }
    if (muallimahId) {
      query = query.eq('muallimah_id', muallimahId);
    }
    if (preferredJuz) {
      query = query.eq('preferred_juz', preferredJuz);
    }

    const { data: halaqah, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Count students for each halaqah
    const halaqahWithCounts = await Promise.all(
      (halaqah || []).map(async (h: any) => {
        // Count from halaqah_students table (actual joined students)
        const { data: activeStudents } = await supabase
          .from('halaqah_students')
          .select('student_id')
          .eq('halaqah_id', h.id)
          .eq('status', 'active');

        const uniqueActiveCount = activeStudents
          ? new Set(activeStudents.map(s => s.student_id)).size
          : 0;

        const { data: waitlistStudents } = await supabase
          .from('halaqah_students')
          .select('student_id')
          .eq('halaqah_id', h.id)
          .eq('status', 'waitlist');

        const uniqueWaitlistCount = waitlistStudents
          ? new Set(waitlistStudents.map(s => s.student_id)).size
          : 0;

        // Count from daftar_ulang_submissions (pending submissions)
        // This includes users who have submitted daftar ulang but not yet joined halaqah_students
        const { data: submissions } = await supabase
          .from('daftar_ulang_submissions')
          .select('user_id')
          .eq('status', 'submitted')
          .or(`ujian_halaqah_id.eq.${h.id},tashih_halaqah_id.eq.${h.id}`);

        // For tashih_ujian classes, a single user may select both ujian and tashih
        // We need to count unique users, not number of selections
        const uniqueSubmissionCount = submissions
          ? new Set(submissions.map(s => s.user_id)).size
          : 0;

        // Combine counts: avoid double-counting users who exist in both tables
        const allStudentIds = new Set([
          ...(activeStudents || []).map(s => s.student_id),
          ...(submissions || []).map(s => s.user_id)
        ]);

        const totalUniqueCount = allStudentIds.size;

        // Get mentors
        const { data: mentors } = await supabase
          .from('halaqah_mentors')
          .select('mentor_id, role, is_primary')
          .eq('halaqah_id', h.id);

        return {
          ...h,
          students_count: totalUniqueCount,
          waitlist_count: uniqueWaitlistCount,
          mentors: mentors || []
        } as HalaqahWithRelations;
      })
    );

    return NextResponse.json({ data: halaqahWithCounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/halaqah - Create new halaqah
export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const body = await request.json();
    const {
      program_id,
      muallimah_id,
      name,
      description,
      day_of_week,
      start_time,
      end_time,
      preferred_juz,
      max_students,
      max_thalibah_override,
      waitlist_max = 5,
      location,
      status = 'active'
    } = body;

    // Validate required fields
    if (!program_id || !muallimah_id || !name || !day_of_week || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields: program_id, muallimah_id, name, day_of_week, start_time, end_time' },
        { status: 400 }
      );
    }

    // Create halaqah
    const { data: newHalaqah, error } = await supabase
      .from('halaqah')
      .insert({
        program_id,
        muallimah_id,
        name,
        description,
        day_of_week,
        start_time,
        end_time,
        preferred_juz,
        max_students: max_thalibah_override || max_students,
        max_thalibah_override,
        waitlist_max,
        location,
        status
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Automatically assign muallimah as primary mentor
    const { error: mentorError } = await supabase
      .from('halaqah_mentors')
      .insert({
        halaqah_id: newHalaqah.id,
        mentor_id: muallimah_id,
        role: 'ustadzah',
        is_primary: true
      });

    if (mentorError) {
      console.error('Failed to assign muallimah as mentor:', mentorError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ data: newHalaqah }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

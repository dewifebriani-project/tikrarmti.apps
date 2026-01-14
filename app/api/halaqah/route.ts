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
  quota_details?: {
    submitted: number;
    approved: number;
    draft: number;
    active: number;
    waitlist: number;
    total_used: number;
  };
}

// GET /api/halaqah - List all halaqah with filters
const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const queryBatchId = searchParams.get('batch_id');
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
    if (queryBatchId) {
      query = query.eq('program.batch_id', queryBatchId);
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

    // Count students for each halaqah using admin client (bypasses RLS)
    // Only count: submitted status (NOT draft) + active status (NOT waitlist)
    const halaqahWithCounts = await Promise.all(
      (halaqah || []).map(async (h: any) => {
        // Store queryBatchId for use in muallimah_registrations query
        const batchIdParam = queryBatchId;
        // Count from halaqah_students table (actual joined students)
        // ONLY active status counts toward quota (waitlist does NOT reduce quota)
        const { data: activeStudents } = await supabaseAdmin
          .from('halaqah_students')
          .select('student_id')
          .eq('halaqah_id', h.id)
          .eq('status', 'active');

        const uniqueActiveCount = activeStudents
          ? new Set(activeStudents.map(s => s.student_id)).size
          : 0;

        const { data: waitlistStudents } = await supabaseAdmin
          .from('halaqah_students')
          .select('student_id')
          .eq('halaqah_id', h.id)
          .eq('status', 'waitlist');

        const uniqueWaitlistCount = waitlistStudents
          ? new Set(waitlistStudents.map(s => s.student_id)).size
          : 0;

        // Count from daftar_ulang_submissions (pending submissions)
        // BOTH submitted AND approved status count toward quota (draft does NOT reduce quota)
        const { data: submissions } = await supabaseAdmin
          .from('daftar_ulang_submissions')
          .select('user_id')
          .in('status', ['submitted', 'approved'])
          .or(`ujian_halaqah_id.eq.${h.id},tashih_halaqah_id.eq.${h.id}`);

        // For tashih_ujian classes, a single user may select both ujian and tashih
        // We need to count unique users, not number of selections
        const uniqueSubmissionCount = submissions
          ? new Set(submissions.map(s => s.user_id)).size
          : 0;

        // Count draft submissions (for display purposes, does NOT reduce quota)
        const { data: draftSubmissions } = await supabaseAdmin
          .from('daftar_ulang_submissions')
          .select('user_id')
          .eq('status', 'draft')
          .or(`ujian_halaqah_id.eq.${h.id},tashih_halaqah_id.eq.${h.id}`);

        const uniqueDraftIds = new Set(draftSubmissions?.map(s => s.user_id) || []);

        // Count approved submissions separately for display
        const { data: approvedSubmissions } = await supabaseAdmin
          .from('daftar_ulang_submissions')
          .select('user_id')
          .eq('status', 'approved')
          .or(`ujian_halaqah_id.eq.${h.id},tashih_halaqah_id.eq.${h.id}`);

        const uniqueApprovedCount = approvedSubmissions
          ? new Set(approvedSubmissions.map(s => s.user_id)).size
          : 0;

        // Combine counts: avoid double-counting users who exist in both tables
        const allStudentIds = new Set([
          ...(activeStudents || []).map(s => s.student_id),
          ...(submissions || []).map(s => s.user_id)
        ]);

        const totalUniqueCount = allStudentIds.size;

        // Get mentors
        const { data: mentors } = await supabaseAdmin
          .from('halaqah_mentors')
          .select('mentor_id, role, is_primary')
          .eq('halaqah_id', h.id);

        // Fetch program, muallimah, and muallimah_registration data using admin client
        // This ensures admin panel always has complete data
        let programData = h.program;
        let muallimahData = h.muallimah;
        let classType = h.class_type;
        let preferredSchedule = h.preferred_schedule;

        // Always fetch program with batch if program_id exists
        // This ensures we always have batch_id for muallimah_registrations query
        if (h.program_id && (!programData || !programData.batch)) {
          const { data: program } = await supabaseAdmin
            .from('programs')
            .select('*, batch:batches(*)')
            .eq('id', h.program_id)
            .single();
          programData = program;
        }

        if (!muallimahData && h.muallimah_id) {
          const { data: muallimah } = await supabaseAdmin
            .from('users')
            .select('id, full_name, email')
            .eq('id', h.muallimah_id)
            .single();
          muallimahData = muallimah;
        }

        // Fetch class_type and preferred_schedule from muallimah_registrations
        // Note: muallimah_registrations table uses 'user_id' and 'batch_id'
        // Try multiple strategies to get batch_id:

        let muallimahReg = null;
        let regError = null;

        // Strategy 1: Get batch_id from program
        let batchId = programData?.batch?.id || programData?.batch_id;

        // Strategy 2: Use batch_id from query parameter (if filtering by batch)
        if (!batchId && batchIdParam) {
          batchId = batchIdParam;
        }

        // Strategy 3: Fetch the active batch as last resort
        if (!batchId) {
          const { data: activeBatch } = await supabaseAdmin
            .from('batches')
            .select('id')
            .eq('status', 'active')
            .maybeSingle();
          batchId = activeBatch?.id;
        }

        if (h.muallimah_id && batchId) {
          console.log('[Halaqah API] Fetching muallimah_reg for halaqah:', h.id, 'muallimah_id:', h.muallimah_id, 'batch_id:', batchId);
          const result = await supabaseAdmin
            .from('muallimah_registrations')
            .select('class_type, preferred_schedule')
            .eq('user_id', h.muallimah_id)
            .eq('batch_id', batchId)
            .maybeSingle();

          muallimahReg = result.data;
          regError = result.error;

          console.log('[Halaqah API] muallimah_reg result:', muallimahReg, 'error:', regError);

          if (muallimahReg) {
            // Use muallimah_registrations data if halaqah doesn't have its own data
            if (!classType) classType = muallimahReg.class_type;
            if (!preferredSchedule) preferredSchedule = muallimahReg.preferred_schedule;
          }
        } else if (h.muallimah_id && !batchId) {
          // Fallback: If no batch_id, try to get any approved muallimah_registration for this user
          console.log('[Halaqah API] No batch_id, fetching any approved muallimah_reg for user:', h.muallimah_id);
          const result = await supabaseAdmin
            .from('muallimah_registrations')
            .select('class_type, preferred_schedule')
            .eq('user_id', h.muallimah_id)
            .eq('status', 'approved')
            .order('submitted_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          muallimahReg = result.data;
          regError = result.error;

          console.log('[Halaqah API] fallback muallimah_reg result:', muallimahReg, 'error:', regError);

          if (muallimahReg) {
            if (!classType) classType = muallimahReg.class_type;
            if (!preferredSchedule) preferredSchedule = muallimahReg.preferred_schedule;
          }
        }

        return {
          ...h,
          program: programData,
          muallimah: muallimahData,
          class_type: classType,
          preferred_schedule: preferredSchedule,
          students_count: totalUniqueCount,
          waitlist_count: uniqueWaitlistCount,
          quota_details: {
            submitted: uniqueSubmissionCount,
            approved: uniqueApprovedCount,
            draft: uniqueDraftIds.size,
            active: uniqueActiveCount,
            waitlist: uniqueWaitlistCount,
            total_used: totalUniqueCount
          },
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

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
        const { count: activeCount } = await supabase
          .from('halaqah_students')
          .select('*', { count: 'exact', head: true })
          .eq('halaqah_id', h.id)
          .eq('status', 'active');

        const { count: waitlistCount } = await supabase
          .from('halaqah_students')
          .select('*', { count: 'exact', head: true })
          .eq('halaqah_id', h.id)
          .eq('status', 'waitlist');

        // Get mentors
        const { data: mentors } = await supabase
          .from('halaqah_mentors')
          .select('mentor_id, role, is_primary')
          .eq('halaqah_id', h.id);

        return {
          ...h,
          students_count: activeCount || 0,
          waitlist_count: waitlistCount || 0,
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

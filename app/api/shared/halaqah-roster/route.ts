import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');

    if (!batchId) {
      return NextResponse.json({ error: 'batch_id is required' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin();

    const { data: halaqahData, error } = await supabaseAdmin
      .from('halaqah')
      .select(`
        id,
        name,
        day_of_week,
        start_time,
        end_time,
        preferred_juz,
        max_students,
        zoom_link,
        zoom_link_id,
        muallimah_id,
        zoom:batch_zoom_links!halaqah_zoom_link_id_fkey(name, url, meeting_id, passcode, claim_host),
        muallimah:users!halaqah_muallimah_id_fkey(full_name, whatsapp),
        program:programs!inner(class_type, batch_id, batch:batches(name)),
        students:halaqah_students(status, thalibah_id, thalibah:users!halaqah_students_thalibah_id_fkey(full_name, whatsapp)),
        mentors:halaqah_mentors(role, user:users!halaqah_mentors_mentor_id_fkey(full_name, whatsapp))
      `)
      .eq('program.batch_id', batchId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching halaqah roster:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ data: halaqahData });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

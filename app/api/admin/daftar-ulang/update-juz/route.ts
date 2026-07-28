import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseAdmin = createSupabaseAdmin();
    const { data: userData } = await supabaseAdmin.from('users').select('roles').eq('id', user.id).single();
    if (!userData?.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { submissionId, newJuz } = await request.json();
    if (!submissionId || !newJuz) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    const { data: submission } = await supabaseAdmin.from('daftar_ulang_submissions').select('registration_id').eq('id', submissionId).single();
    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

    // Update submission
    await supabaseAdmin.from('daftar_ulang_submissions').update({ confirmed_chosen_juz: newJuz }).eq('id', submissionId);
    
    // Update registration
    await supabaseAdmin.from('pendaftaran_tikrar_tahfidz').update({ chosen_juz: newJuz }).eq('id', submission.registration_id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

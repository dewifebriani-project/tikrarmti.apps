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
    if (!roles.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get thalibah from daftar_ulang_submissions (approved or submitted)
    // Joined with users table to get full details
    const { data: submissions, error } = await supabase
      .from('daftar_ulang_submissions')
      .select(`
        id,
        status,
        user:users(
          id,
          full_name,
          email,
          whatsapp,
          halaqah_assignments:halaqah_students(
            halaqah:halaqah(id, name)
          ),
          tikrar_registrations(
            id,
            batch_id,
            status,
            selection_status,
            batch:batches(name)
          )
        )
      `)
      .in('status', ['approved', 'submitted'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to match the expected structure
    const transformedData = submissions?.map((s: any) => ({
      id: s.user.id,
      full_name: s.user.full_name,
      email: s.user.email,
      whatsapp: s.user.whatsapp,
      submission_status: s.status,
      halaqah: s.user.halaqah_assignments?.[0]?.halaqah || null,
      tikrar_registrations: s.user.tikrar_registrations || [],
    })) || [];

    return NextResponse.json({ success: true, data: transformedData });

  } catch (error: any) {
    console.error('Error in musyrifah thalibah API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

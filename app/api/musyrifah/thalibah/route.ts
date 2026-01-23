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
    if (!roles.includes('musyrifah')) {
      return NextResponse.json({ error: 'Forbidden: Musyrifah access required' }, { status: 403 });
    }

    // Get thalibah assigned to this musyrifah
    const { data: thalibah, error } = await supabase
      .from('users')
      .select(`
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
      `)
      .contains('roles', ['thalibah'])
      .order('full_name', { ascending: true });

    if (error) throw error;

    // Transform the data to match the expected structure
    const transformedData = thalibah?.map((t: any) => ({
      id: t.id,
      full_name: t.full_name,
      email: t.email,
      whatsapp: t.whatsapp,
      halaqah: t.halaqah_assignments?.[0]?.halaqah || null,
      tikrar_registrations: t.tikrar_registrations || [],
    })) || [];

    return NextResponse.json({ success: true, data: transformedData });
  } catch (error: any) {
    console.error('Error in musyrifah thalibah API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

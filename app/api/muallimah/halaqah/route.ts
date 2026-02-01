import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const muallimahId = searchParams.get('muallimah_id');

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has muallimah or admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roles = userData?.roles || [];
    const isAdmin = roles.includes('admin');
    const isMuallimah = roles.includes('muallimah');

    if (!isAdmin && !isMuallimah) {
      return NextResponse.json({ error: 'Forbidden: Muallimah or Admin access required' }, { status: 403 });
    }

    // Admin can view specific muallimah's halaqah, muallimah can only view their own
    const targetMuallimahId = isAdmin && muallimahId ? muallimahId : user.id;

    // Get halaqah where muallimah is assigned
    const query = supabase
      .from('halaqah')
      .select(`
        *,
        program:programs(id, name, class_type),
        muallimah:users(id, full_name, nama_kunyah, email),
        students:halaqah_students(
          id,
          thalibah_id,
          status,
          assigned_at,
          thalibah:users(id, full_name, nama_kunyah, whatsapp, email)
        )
      `)
      .eq('muallimah_id', targetMuallimahId)
      .order('created_at', { ascending: false });

    const { data: halaqah, error } = await query;

    if (error) throw error;

    // For each halaqah, get thalibah progress data
    const halaqahWithProgress = await Promise.all(
      (halaqah || []).map(async (h) => {
        // Get thalibah IDs from this halaqah
        const thalibahIds = h.students?.map((s: any) => s.thalibah_id) || [];

        // Get jurnal progress for each thalibah
        const { data: jurnalData } = await supabase
          .from('jurnal_records')
          .select('user_id, blok, tanggal_setor')
          .in('user_id', thalibahIds);

        // Get tashih progress for each thalibah
        const { data: tashihData } = await supabase
          .from('tashih_records')
          .select('user_id, blok, waktu_tashih')
          .in('user_id', thalibahIds);

        // Calculate progress for each thalibah
        const studentsWithProgress = (h.students || []).map((student: any) => {
          const thalibahId = student.thalibah_id;

          // Count jurnal blocks completed
          const thalibahJurnal = jurnalData?.filter((j: any) => j.user_id === thalibahId) || [];
          const jurnalBlocks = thalibahJurnal.reduce((count: number, record: any) => {
            if (record.blok) {
              const blocks = typeof record.blok === 'string'
                ? record.blok.split(',').filter((b: string) => b.trim())
                : (Array.isArray(record.blok) ? record.blok : []);
              return count + blocks.length;
            }
            return count;
          }, 0);

          // Count tashih blocks completed
          const thalibahTashih = tashihData?.filter((t: any) => t.user_id === thalibahId) || [];
          const tashihBlocks = thalibahTashih.reduce((count: number, record: any) => {
            if (record.blok) {
              const blocks = typeof record.blok === 'string'
                ? record.blok.split(',').filter((b: string) => b.trim())
                : (Array.isArray(record.blok) ? record.blok : []);
              return count + blocks.length;
            }
            return count;
          }, 0);

          return {
            ...student,
            progress: {
              jurnal_blocks_completed: jurnalBlocks,
              tashih_blocks_completed: tashihBlocks,
              total_blocks: 40, // 40 blocks total (4 blocks/week * 10 weeks)
              jurnal_percentage: Math.round((jurnalBlocks / 40) * 100),
              tashih_percentage: Math.round((tashihBlocks / 40) * 100),
            },
          };
        });

        return {
          ...h,
          students: studentsWithProgress,
        };
      })
    );

    return NextResponse.json({ success: true, data: halaqahWithProgress || [] });
  } catch (error: any) {
    console.error('Error in muallimah halaqah API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

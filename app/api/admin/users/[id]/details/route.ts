import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch user basic info
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch tikrar registrations with batch and program info
    const { data: tikrarRegistrations, error: tikrarError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        *,
        batch:batches(id, name, start_date, end_date, status),
        program:programs(id, name, status)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (tikrarError) {
      console.error('Error fetching tikrar registrations:', tikrarError);
    }

    // Fetch halaqah student assignments
    const { data: halaqahAssignments, error: halaqahError } = await supabaseAdmin
      .from('halaqah_students')
      .select(`
        *,
        halaqah:halaqah(
          id,
          name,
          day_of_week,
          start_time,
          end_time,
          status,
          program:programs(
            id,
            name,
            batch:batches(id, name)
          )
        )
      `)
      .eq('thalibah_id', userId)
      .order('assigned_at', { ascending: false });

    if (halaqahError) {
      console.error('Error fetching halaqah assignments:', halaqahError);
    }

    // Fetch presensi (attendance) records
    const { data: presensiRecords, error: presensiError } = await supabaseAdmin
      .from('presensi')
      .select(`
        *,
        halaqah:halaqah(id, name)
      `)
      .eq('thalibah_id', userId)
      .order('date', { ascending: false })
      .limit(50);

    if (presensiError) {
      console.error('Error fetching presensi:', presensiError);
    }

    // Fetch activity logs
    const { data: activityLogs, error: activityError } = await supabaseAdmin
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (activityError) {
      console.error('Error fetching activity logs:', activityError);
    }

    // Fetch mentor assignments if user is a mentor
    const { data: mentorAssignments, error: mentorError } = await supabaseAdmin
      .from('halaqah_mentors')
      .select(`
        *,
        halaqah:halaqah(
          id,
          name,
          program:programs(
            id,
            name,
            batch:batches(id, name)
          )
        )
      `)
      .eq('mentor_id', userId)
      .order('assigned_at', { ascending: false });

    if (mentorError) {
      console.error('Error fetching mentor assignments:', mentorError);
    }

    // Calculate statistics
    const stats = {
      totalRegistrations: tikrarRegistrations?.length || 0,
      activeHalaqahs: halaqahAssignments?.filter((h: any) => h.status === 'active').length || 0,
      totalAttendance: presensiRecords?.length || 0,
      attendanceRate: presensiRecords && presensiRecords.length > 0
        ? Math.round((presensiRecords.filter((p: any) => p.status === 'hadir').length / presensiRecords.length) * 100)
        : 0,
      mentorRoles: mentorAssignments?.length || 0,
    };

    return NextResponse.json({
      user,
      tikrarRegistrations: tikrarRegistrations || [],
      halaqahAssignments: halaqahAssignments || [],
      presensiRecords: presensiRecords || [],
      activityLogs: activityLogs || [],
      mentorAssignments: mentorAssignments || [],
      stats,
    });
  } catch (error: any) {
    console.error('Error in user details API:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

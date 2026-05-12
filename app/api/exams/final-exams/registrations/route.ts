import { createClient } from '@/lib/supabase/server';
import { ApiResponses } from '@/lib/api-responses';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return ApiResponses.unauthorized();

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  let query = supabase
    .from('final_exam_registrations')
    .select(`
      *,
      schedule:final_exam_schedules (
        *,
        examiner:users!final_exam_schedules_examiner_id_fkey (full_name)
      )
    `)
    .eq('user_id', authUser.id);

  if (type) {
    query = query.eq('schedule.exam_type', type);
  }

  const { data, error } = await query;

  if (error) return ApiResponses.databaseError(error);
  
  // Filter manually because the RLS/Join might return null for schedule if type mismatch
  const registration = type ? data?.find(r => (r.schedule as any)?.exam_type === type) : data?.[0];

  return ApiResponses.success(registration || null);
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return ApiResponses.unauthorized();

  const body = await request.json();
  const { schedule_id } = body;

  // 1. Validate schedule existence and quota
  const { data: schedule, error: scheduleError } = await supabase
    .from('final_exam_schedules')
    .select('*')
    .eq('id', schedule_id)
    .single();

  if (scheduleError || !schedule) return ApiResponses.notFound('Jadwal tidak ditemukan');
  if (schedule.current_count >= schedule.max_quota) return ApiResponses.badRequest('Kuota sudah penuh');

  // 2. Check if user already registered for this exam type
  const { data: existingReg } = await supabase
    .from('final_exam_registrations')
    .select('*, schedule:final_exam_schedules(exam_type)')
    .eq('user_id', authUser.id);

  const alreadyRegistered = existingReg?.some(r => (r.schedule as any)?.exam_type === schedule.exam_type);
  if (alreadyRegistered) return ApiResponses.badRequest(`Ukhti sudah terdaftar untuk ${schedule.exam_type === 'oral' ? 'Ujian Lisan' : 'Ujian Tulisan'}`);

  // 3. Register
  const { data, error } = await supabase
    .from('final_exam_registrations')
    .insert({
      user_id: authUser.id,
      schedule_id: schedule_id
    })
    .select()
    .single();

  if (error) return ApiResponses.databaseError(error);
  return ApiResponses.success(data);
}

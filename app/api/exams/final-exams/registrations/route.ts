import { createClient } from '@/lib/supabase/server';
import { ApiResponses } from '@/lib/api-responses';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return ApiResponses.unauthorized();

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const batchId = searchParams.get('batch_id');

  let query = supabase
    .from('final_exam_registrations')
    .select(`
      *,
      schedule:final_exam_schedules!inner (
        *,
        examiner:users!final_exam_schedules_examiner_id_fkey (full_name)
      )
    `)
    .eq('user_id', authUser.id);

  if (type) {
    query = query.eq('final_exam_schedules.exam_type', type);
  }
  if (batchId) {
    query = query.eq('final_exam_schedules.batch_id', batchId);
  }

  const { data, error } = await query;

  if (error) return ApiResponses.databaseError(error);
  
  // If type is provided, return a single matching registration. Otherwise, return the array of registrations.
  if (type) {
    const registration = data?.find(r => (r.schedule as any)?.exam_type === type);
    return ApiResponses.success(registration || null);
  }

  return ApiResponses.success(data || []);
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return ApiResponses.unauthorized();

  const body = await request.json();
  const { schedule_id } = body;

  if (!schedule_id) return ApiResponses.badRequest('schedule_id wajib diisi');

  // Call the transactional register_final_exam RPC function
  const { data, error } = await supabase.rpc('register_final_exam', {
    p_user_id: authUser.id,
    p_schedule_id: schedule_id
  });

  if (error) {
    if (error.code === '23514' || error.message?.includes('check_quota_not_exceeded')) {
      return ApiResponses.badRequest('Maaf Ukhti, kuota jadwal ini baru saja penuh. Silakan pilih jadwal lain.');
    }
    return ApiResponses.databaseError(error);
  }

  // RPC returns JSON with { success: boolean, error?: string, message?: string }
  const result = data as any;
  if (!result.success) {
    if (result.error?.includes('check_quota_not_exceeded') || result.error === 'Kuota sudah penuh') {
      return ApiResponses.badRequest('Maaf Ukhti, kuota jadwal ini baru saja penuh. Silakan pilih jadwal lain.');
    }
    return ApiResponses.badRequest(result.error || 'Gagal mendaftar');
  }

  return ApiResponses.success({ success: true, message: result.message });
}

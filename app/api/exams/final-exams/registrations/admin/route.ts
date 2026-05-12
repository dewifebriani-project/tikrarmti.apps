import { createClient } from '@/lib/supabase/server';
import { ApiResponses } from '@/lib/api-responses';
import { requireAdmin } from '@/lib/rbac';

export async function GET(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('final_exam_registrations')
    .select(`
      *,
      user:users!final_exam_registrations_user_id_fkey (full_name, whatsapp),
      schedule:final_exam_schedules (
        *,
        examiner:users!final_exam_schedules_examiner_id_fkey (full_name)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) return ApiResponses.databaseError(error);
  return ApiResponses.success(data);
}

import { createClient } from '@/lib/supabase/server';
import { ApiResponses } from '@/lib/api-responses';
import { isStaff } from '@/lib/roles';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) return ApiResponses.unauthorized();
  
  // Check if staff (admin/muallimah/musyrifah)
  // We need to fetch user profile to check roles
  const { data: profile } = await supabase.from('users').select('roles').eq('id', authUser.id).single();
  if (!profile || !isStaff(profile.roles || [])) {
    return ApiResponses.forbidden('Hanya staf yang dapat memberikan nilai');
  }

  const body = await request.json();
  const { registration_id, score_lisan, feedback } = body;

  if (!registration_id) return ApiResponses.badRequest('Missing registration ID');

  const { data, error } = await supabase
    .from('final_exam_registrations')
    .update({
      score_lisan: score_lisan,
      feedback: feedback,
      status: 'graded',
      graded_at: new Date().toISOString(),
      graded_by: authUser.id
    })
    .eq('id', registration_id)
    .select()
    .single();

  if (error) return ApiResponses.databaseError(error);
  return ApiResponses.success(data);
}

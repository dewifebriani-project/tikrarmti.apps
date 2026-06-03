import { createClient } from '@/lib/supabase/server';
import { ApiResponses } from '@/lib/api-responses';
import { requireAdmin } from '@/lib/rbac';

import { getAuthorizationContext } from '@/lib/rbac';

export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  let batchId = searchParams.get('batch_id');

  // Jika tidak ada batch_id eksplisit, coba ambil dari konteks user (untuk Thalibah)
  if (!batchId) {
    const context = await getAuthorizationContext();
    if (context && !context.roles.includes('admin') && !context.roles.includes('muallimah')) {
      const { data: userReg } = await supabase
        .from('pendaftaran_tikrar_tahfidz')
        .select('batch_id')
        .eq('user_id', context.userId)
        .eq('status', 'approved')
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();
      
      if (userReg?.batch_id) {
        batchId = userReg.batch_id;
      }
    }
  }

  let query = supabase
    .from('final_exam_schedules')
    .select(`
      *,
      examiner:users!final_exam_schedules_examiner_id_fkey (full_name)
    `)
    .order('exam_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (type) {
    query = query.eq('exam_type', type);
  }
  
  if (batchId) {
    query = query.eq('batch_id', batchId);
  }

  const { data, error } = await query;

  if (error) return ApiResponses.databaseError(error);
  return ApiResponses.success(data);
}

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('final_exam_schedules')
    .insert({
      batch_id: body.batch_id,
      exam_type: body.exam_type,
      exam_date: body.exam_date,
      start_time: body.start_time,
      end_time: body.end_time,
      examiner_id: body.examiner_id,
      max_quota: body.max_quota,
      location_link: body.location_link
    })
    .select()
    .single();

  if (error) return ApiResponses.databaseError(error);
  return ApiResponses.success(data);
}

export async function DELETE(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return ApiResponses.badRequest('Missing schedule ID');

  const { error } = await supabase
    .from('final_exam_schedules')
    .delete()
    .eq('id', id);

  if (error) return ApiResponses.databaseError(error);
  return ApiResponses.success({ message: 'Schedule deleted' });
}

export async function PUT(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const body = await request.json();
  const { id, ...updateData } = body;

  if (!id) return ApiResponses.badRequest('Missing schedule ID');

  const { data, error } = await supabase
    .from('final_exam_schedules')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return ApiResponses.databaseError(error);
  return ApiResponses.success(data);
}

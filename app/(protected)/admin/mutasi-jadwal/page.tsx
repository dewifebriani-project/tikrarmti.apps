import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/rbac';
import { redirect } from 'next/navigation';
import { MutasiJadwalClient } from './MutasiJadwalClient';

export const metadata = {
  title: 'Mutasi Jadwal Halaqah - Admin Tikrar MTI',
  description: 'Kelola pengajuan pindah jadwal halaqah',
};

export default async function MutasiJadwalPage() {
  const authError = await requireAdmin();
  if (authError) redirect('/');

  const supabase = createClient();

  // Fetch batches for filter
  const { data: batches } = await supabase
    .from('batches')
    .select('id, name')
    .order('start_date', { ascending: false });

  // Fetch pending requests by default
  const { data: requests, error } = await supabase
    .from('transfer_schedule_requests')
    .select(`
      id, status, created_at, notes,
      user:users!transfer_schedule_requests_user_id_fkey(id, full_name, email, whatsapp),
      batch:batches!transfer_schedule_requests_batch_id_fkey(id, name),
      program:programs!transfer_schedule_requests_program_id_fkey(id, class_type),
      from_halaqah:halaqah!transfer_schedule_requests_from_halaqah_id_fkey(id, name, day_of_week, start_time),
      to_halaqah:halaqah!transfer_schedule_requests_to_halaqah_id_fkey(id, name, day_of_week, start_time, max_students)
    `)
    .in('status', ['pending', 'approved'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[MutasiJadwal] Query error:', error);
  }

  // Fetch Sit In requests
  const { data: sitInLogs } = await supabase
    .from('system_logs')
    .select(`
      id, created_at, details,
      user:users!system_logs_user_id_fkey(id, full_name, email, whatsapp)
    `)
    .eq('resource', 'halaqah')
    .contains('details', { action_type: 'SIT_IN' })
    .order('created_at', { ascending: false })
    .limit(100);

  // Add current active count to target halaqah to prevent overfilling
  const enrichedRequests = await Promise.all((requests || []).map(async (req: any) => {
    if (req.to_halaqah) {
      const { count } = await supabase
        .from('halaqah_students')
        .select('*', { count: 'exact', head: true })
        .eq('halaqah_id', req.to_halaqah.id)
        .eq('status', 'active');
      req.to_halaqah.current_students = count || 0;
    }
    return req;
  }));

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <MutasiJadwalClient 
        initialRequests={enrichedRequests} 
        initialSitIns={sitInLogs || []}
        batches={batches || []} 
      />
    </div>
  );
}

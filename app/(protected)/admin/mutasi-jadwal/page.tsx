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

  // Get Monday of current week for active sit-in filter
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  // Fetch Sit In requests from activity_logs (SIT_IN action, current week only)
  // Select user_id directly to avoid FK join name mismatch
  const { data: sitInLogs } = await supabase
    .from('activity_logs')
    .select('id, user_id, timestamp, details')
    .eq('resource', 'halaqah')
    .gte('timestamp', startOfWeek.toISOString())
    .order('timestamp', { ascending: false });

  // Post-process: keep only the latest log per user, and only if it's SIT_IN (not CANCEL_SIT_IN)
  const userLatestMap = new Map<string, any>();
  for (const log of (sitInLogs || [])) {
    const userId = (log as any).user_id;
    const actionType = (log.details as any)?.action_type;
    // Skip logs without action_type (e.g. admin edits)
    if (!userId || !actionType) continue;
    // Map already has user's latest (since ordered desc), skip if already set
    if (!userLatestMap.has(userId)) {
      userLatestMap.set(userId, log);
    }
  }
  // Only include users whose latest halaqah action is SIT_IN
  const activeSitInLogs = Array.from(userLatestMap.values()).filter(
    (log: any) => log.details?.action_type === 'SIT_IN'
  );

  // Fetch user details for the active sit-ins
  const sitInUserIds = activeSitInLogs.map((log: any) => log.user_id);
  const { data: sitInUsers } = sitInUserIds.length > 0
    ? await supabase
        .from('users')
        .select('id, full_name, email, whatsapp')
        .in('id', sitInUserIds)
    : { data: [] };

  const sitInUserMap = new Map((sitInUsers || []).map((u: any) => [u.id, u]));
  const activeSitIns = activeSitInLogs.map((log: any) => ({
    ...log,
    user: sitInUserMap.get(log.user_id) || null,
  }));

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
        initialSitIns={activeSitIns}
        batches={batches || []} 
      />
    </div>
  );
}

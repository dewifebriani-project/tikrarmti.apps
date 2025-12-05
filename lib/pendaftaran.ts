import { supabase, supabaseAdmin } from './supabase'

export interface PendaftaranData {
  user_id: string
  batch_id: string
  program_id: string
  // Section 1 fields
  understands_commitment: boolean
  tried_simulation: boolean
  no_negotiation: boolean
  has_telegram: boolean
  saved_contact: boolean
  // Section 2 fields
  has_permission: boolean
  permission_name: string
  permission_phone: string
  chosen_juz: string
  no_travel_plans: boolean
  motivation: string
  ready_for_team: string
  // Section 3 fields (additional data not in users table)
  telegram_phone?: string
  age: number
  main_time_slot: string
  backup_time_slot: string
  time_commitment: boolean
  // Section 4 fields
  understands_program: boolean
  questions?: string
  // System fields
  status?: 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'completed'
  selection_status?: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  submission_date?: string
  created_at?: string
  updated_at?: string
}

export const submitPendaftaran = async (data: PendaftaranData): Promise<string> => {
  try {
    const { data: result, error } = await supabaseAdmin
      .from('tikrar_tahfidz')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    console.log('Record created with ID: ', result.id);
    return result.id;
  } catch (error) {
    console.error('Error adding record: ', error);
    throw new Error('Gagal mengirim formulir pendaftaran');
  }
}

export const updateSelectionStatus = async (
  docId: string,
  status: 'passed' | 'failed',
  notes?: string
): Promise<void> => {
  try {
    const { error } = await supabaseAdmin
      .from('tikrar_tahfidz')
      .update({
        selection_status: status,
        selection_notes: notes,
        selection_date: new Date().toISOString()
      })
      .eq('id', docId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating selection status: ', error);
    throw new Error('Gagal update status seleksi');
  }
}

export const upgradeUserRoleToThalibah = async (user_id: string): Promise<void> => {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        role: 'thalibah',
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id);

    if (error) throw error;
    console.log(`User ${user_id} role upgraded from calon_thalibah to thalibah`);
  } catch (error) {
    console.error('Error upgrading user role: ', error);
    throw new Error('Gagal mengupgrade role user');
  }
};

export const updateApprovalStatus = async (
  docId: string,
  status: 'approved' | 'rejected',
  user_id?: string,
  notes?: string
): Promise<void> => {
  try {
    const { error } = await supabaseAdmin
      .from('tikrar_tahfidz')
      .update({
        status,
        approval_notes: notes,
        approval_date: new Date().toISOString()
      })
      .eq('id', docId);

    if (error) throw error;

    // If approved and user_id is provided, upgrade user role to thalibah
    if (status === 'approved' && user_id) {
      await upgradeUserRoleToThalibah(user_id);
    }
  } catch (error) {
    console.error('Error updating approval status: ', error);
    throw new Error('Gagal update status persetujuan');
  }
}

export const getAllPendaftaran = async () => {
  try {
    const { data, error } = await supabase
      .from('tikrar_tahfidz')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching pendaftaran data: ', error);
    throw new Error('Gagal mengambil data pendaftaran');
  }
}

export const getPendaftaranById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('tikrar_tahfidz')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching pendaftaran by ID: ', error);
    throw new Error('Gagal mengambil data pendaftaran');
  }
}

export const getPendaftaranByUserId = async (user_id: string) => {
  try {
    const { data, error } = await supabase
      .from('tikrar_tahfidz')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching pendaftaran by user ID: ', error);
    throw new Error('Gagal mengambil data pendaftaran');
  }
}

// Data batch settings
export const BATCH_SETTINGS = {
  name: 'Tikrar MTI Batch 2',
  duration: '13 Pekan',
  start_date: '2025-01-05',
  end_date: '2025-04-18',
  libur_lebaran: {
    start: '2025-03-15',
    end: '2025-03-29'
  },
  target_hafalan: '1/2 juz',
  metode: 'Tikrar 40 kali',
  available_juz: [
    { id: '30a', name: 'Juz 30A (An-Naba\'- Al-A\'la)' },
    { id: '30b', name: 'Juz 30B (Al-A\'la - An-Naas)' },
    { id: '29a', name: 'Juz 29A (Al-Mulk - Nuh)' },
    { id: '29b', name: 'Juz 29B (Al-Jinn- Al-Mursalat)' },
    { id: '28a', name: 'Juz 28A (Al-Mujadila - Ash-Shaf)' },
    { id: '28b', name: 'Juz 28B (As-Shaf- At-Tahrim)' }
  ],
  contact_person: {
    name: 'Kak Mara',
    phone: '081313650842'
  }
}
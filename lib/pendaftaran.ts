import { createClient } from './supabase/client'
import { createSupabaseAdmin } from './supabase'

const supabaseAdmin = createSupabaseAdmin()

/**
 * PendaftaranData interface for pendaftaran_tikrar_tahfidz table
 *
 * IMPORTANT: This interface MUST match the database schema exactly.
 * Reference: docs/DATABASE_SCHEMA.md lines 234-287
 *
 * Fields NOT in database (DO NOT ADD):
 * - birth_place: Only exists in users table, NOT in pendaftaran_tikrar_tahfidz
 * - gender: Only exists in users table (jenis_kelamin), NOT in pendaftaran_tikrar_tahfidz
 * - education: NOT in pendaftaran_tikrar_tahfidz
 * - work: NOT in pendaftaran_tikrar_tahfidz
 * - emergency_contact: NOT in pendaftaran_tikrar_tahfidz
 */
export interface PendaftaranData {
  // Required identifiers (NOT NULL in DB)
  user_id: string
  batch_id: string
  program_id: string

  // Section 1 fields (NOT NULL in DB with default false)
  understands_commitment: boolean
  tried_simulation: boolean
  no_negotiation: boolean
  has_telegram: boolean
  saved_contact: boolean

  // Section 2 fields
  has_permission: 'yes' | 'janda' | ''
  permission_name: string
  permission_phone: string
  chosen_juz: string // NOT NULL in DB
  no_travel_plans: boolean
  motivation: string
  ready_for_team: 'ready' | 'not_ready' | 'considering' | 'infaq'

  // Section 3 fields (NOT NULL in DB)
  main_time_slot: string
  backup_time_slot: string
  time_commitment: boolean

  // Section 4 fields
  understands_program: boolean
  questions?: string

  // Personal data fields (from users table, nullable in DB)
  email?: string
  full_name?: string
  address?: string
  wa_phone?: string
  telegram_phone?: string
  birth_date?: string // NOTE: birth_place is NOT in this table!
  age?: number
  domicile?: string
  timezone?: string

  // Batch info (NOT NULL in DB)
  batch_name: string

  // System fields
  status?: 'pending' | 'approved' | 'rejected' | 'withdrawn'
  selection_status?: 'pending' | 'selected' | 'not_selected' | 'waitlist'
  approved_by?: string
  approved_at?: string
  submission_date?: string
  created_at?: string
  updated_at?: string

  // Optional fields for oral/written submission
  oral_submission_url?: string
  oral_submission_file_name?: string
  oral_submitted_at?: string
  written_quiz_answers?: Record<string, any>
  written_quiz_score?: number
  written_quiz_total_questions?: number
  written_quiz_correct_answers?: number
  written_submitted_at?: string
  written_quiz_submitted_at?: string
}

export const submitPendaftaran = async (data: PendaftaranData): Promise<string> => {
  try {
    const { data: result, error } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
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
      .from('pendaftaran_tikrar_tahfidz')
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
      .from('pendaftaran_tikrar_tahfidz')
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
    const supabase = createClient();
    const { data, error } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
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
    const supabase = createClient();
    const { data, error } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
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
    const supabase = createClient();
    const { data, error } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
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
    { id: '1A', name: 'Juz 1A (Halaman 1-11)', pages: '1-11' },
    { id: '1B', name: 'Juz 1B (Halaman 12-21)', pages: '12-21' },
    { id: '28A', name: 'Juz 28A (Halaman 542-551)', pages: '542-551' },
    { id: '28B', name: 'Juz 28B (Halaman 552-561)', pages: '552-561' },
    { id: '29A', name: 'Juz 29A (Halaman 562-571)', pages: '562-571' },
    { id: '29B', name: 'Juz 29B (Halaman 572-581)', pages: '572-581' },
    { id: '30A', name: 'Juz 30A (Halaman 582-591)', pages: '582-591' },
    { id: '30B', name: 'Juz 30B (Halaman 592-604)', pages: '592-604' }
  ],
  contact_person: {
    name: 'Kak Mara',
    phone: '0813-1365-0842'
  }
}
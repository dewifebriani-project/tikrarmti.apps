export type DaftarUlangSubTab = 'submissions' | 'halaqah' | 'per_juz';
export type SortField = 'name' | 'juz' | 'halaqah' | 'status' | 'submitted_at';
export type SortOrder = 'asc' | 'desc';

export interface DaftarUlangSubmission {
  id: string;
  user_id: string;
  batch_id: string;
  registration_id: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';

  // Confirmed data
  confirmed_full_name?: string;
  confirmed_chosen_juz?: string;
  confirmed_main_time_slot?: string;
  confirmed_backup_time_slot?: string;

  // Partner
  partner_type?: 'self_match' | 'system_match' | 'family' | 'tarteel';
  partner_user_id?: string;
  partner_name?: string;
  partner_relationship?: string;
  partner_wa_phone?: string;
  partner_notes?: string;

  // Halaqah
  ujian_halaqah_id?: string;
  tashih_halaqah_id?: string;
  is_tashih_umum?: boolean;

  // Akad
  akad_files?: Array<{ url: string; name: string }>;
  akad_submitted_at?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  reviewed_at?: string;

  // Relations
  user?: {
    id: string;
    full_name: string;
    email: string;
    whatsapp?: string;
  };
  partner_user?: {
    id: string;
    full_name: string;
    email: string;
    whatsapp?: string;
  };
  ujian_halaqah?: {
    id: string;
    name: string;
    day_of_week?: number;
    start_time?: string;
    end_time?: string;
  };
  tashih_halaqah?: {
    id: string;
    name: string;
    day_of_week?: number;
    start_time?: string;
    end_time?: string;
  };
  registration?: any;
}

export interface DaftarUlangStatsData {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
  withHalaqah: number;
  withAkad: number;
  juzCount: Record<string, number>;
}

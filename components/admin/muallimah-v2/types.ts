import { AdminUser as User } from '../users/types';

export interface MuallimahV2Type {
  // From muallimah_akads
  id: string;
  user_id: string;
  batch_id: string;
  class_type: string;
  preferred_juz: string;
  preferred_max_thalibah: number;
  preferred_schedule: any;
  backup_schedule: any;
  understands_commitment: boolean;
  akad_signed_at: string;
  status: string;
  review_notes?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
  paid_class_scheme: string;
  exclude_from_capacity?: boolean;

  // From muallimah_registrations (mapped)
  profile_id?: string;
  full_name?: string;
  birth_date?: string;
  birth_place?: string;
  address?: string;
  whatsapp?: string;
  email?: string;
  education?: string;
  occupation?: string;
  memorization_level?: string;
  memorized_juz?: string;
  teaching_experience?: string;
  teaching_years?: string;
  teaching_institutions?: string;
  timezone?: string;
  motivation?: string;
  special_skills?: string;
  health_condition?: string;
  submitted_at?: string;
  tajweed_institution?: string;
  quran_institution?: string;
  teaching_communities?: string;
  memorized_tajweed_matan?: string;
  studied_matan_exegesis?: string;
  examined_juz?: string;
  certified_juz?: string;
  paid_class_interest?: boolean;
  age?: number;

  // Relations
  user?: User;
  batch?: { name: string };
}

export interface MuallimahV2StatsData {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

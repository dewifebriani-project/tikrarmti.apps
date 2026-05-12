import { Batch } from '@/types/database';

export interface MuallimahRegistration {
  id: string;
  user_id: string;
  batch_id?: string;
  full_name: string;
  email: string;
  whatsapp?: string;
  education: string;
  occupation: string;
  memorization_level: string;
  memorized_juz?: string;
  examined_juz?: string;
  certified_juz?: string;
  preferred_juz: string;
  preferred_schedule: string;
  backup_schedule?: string;
  class_type: string;
  preferred_max_thalibah?: number;
  status: 'pending' | 'review' | 'approved' | 'rejected' | 'waitlist';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  batch?: {
    name: string;
  };
}

export interface MuallimahAkad {
  id: string;
  user_id: string;
  batch_id: string;
  preferred_juz: string;
  preferred_schedule: string;
  backup_schedule?: string;
  max_thalibah?: number;
  wants_paid_class: boolean;
  paid_class_details?: string;
  status: 'pending' | 'review' | 'approved' | 'rejected' | 'waitlist';
  understands_commitment: boolean;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  user?: {
    full_name: string;
    email: string;
    whatsapp?: string;
  };
  batch?: {
    name: string;
  };
}

export interface MuallimahStats {
  total: number;
  pending: number;
  review: number;
  approved: number;
  rejected: number;
  waitlist: number;
}

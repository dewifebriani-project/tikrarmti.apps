export interface Batch {
  id: string;
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  registration_start_date?: string | null;
  registration_end_date?: string | null;
  duration_weeks?: number | null;
  status: string;
  created_at?: string;

  program_type?: string | null;
  total_quota?: number | null;
  is_free?: boolean | null;
  price?: number | null;
  registered_count?: number | null;
  program_count?: number;

  selection_start_date?: string | null;
  selection_end_date?: string | null;
  selection_result_date?: string | null;
  re_enrollment_date?: string | null;
  opening_class_date?: string | null;
  first_week_start_date?: string | null;
  first_week_end_date?: string | null;
  review_week_start_date?: string | null;
  review_week_end_date?: string | null;
  final_exam_start_date?: string | null;
  final_exam_end_date?: string | null;
  graduation_start_date?: string | null;
  graduation_end_date?: string | null;
  holiday_dates?: string[] | null;
}

export interface Program {
  id: string;
  batch_id: string;
  name: string;
  description?: string | null;
  target_level?: string | null;
  duration_weeks?: number | null;
  max_thalibah?: number | null;
  status: string;
  is_free?: boolean | null;
  price?: number | null;
  batch?: { id?: string; name: string; start_date?: string; end_date?: string; status?: string } | null;
  registration_count?: number;
  tikrar_count?: number;
  muallimah_count?: number;
  musyrifah_count?: number;
  enrollment_percentage?: number | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const BATCH_STATUSES = ['draft', 'open', 'ongoing', 'closed', 'archived'] as const;
export const PROGRAM_STATUSES = ['draft', 'open', 'ongoing', 'completed', 'cancelled'] as const;

export type BatchStatus = typeof BATCH_STATUSES[number];
export type ProgramStatus = typeof PROGRAM_STATUSES[number];

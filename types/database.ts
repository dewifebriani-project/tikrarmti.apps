// Database Types untuk Tikrar MTI Apps
// Generated from database schema

export type UserRole = 'calon_thalibah' | 'thalibah' | 'musyrifah' | 'muallimah' | 'admin';
export type BatchStatus = 'draft' | 'open' | 'closed' | 'archived';
export type ProgramStatus = 'draft' | 'open' | 'ongoing' | 'completed' | 'cancelled';
export type HalaqahStatus = 'active' | 'inactive' | 'suspended';
export type PendaftaranStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'completed';
export type MentorRole = 'ustadzah' | 'musyrifah';
export type HalaqahStudentStatus = 'active' | 'transferred' | 'graduated' | 'dropped';
export type PresensiStatus = 'hadir' | 'izin' | 'sakit' | 'alpha';
export type JuzPart = 'A' | 'B';

export interface JuzOption {
  id: string;
  code: string;
  name: string;
  juz_number: number;
  part: JuzPart;
  start_page: number;
  end_page: number;
  total_pages: number;
  is_active: boolean;
  sort_order: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  current_tikrar_batch_id?: string;
  current_tikrar_batch?: Batch;
}

export interface Batch {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  registration_start_date?: string;
  registration_end_date?: string;
  status: BatchStatus;
  created_at: string;
  updated_at: string;
  is_free?: boolean;
  price?: number;
  total_quota?: number;
  registered_count?: number;
  duration_weeks?: number;

  // Timeline phase dates for perjalanan-saya
  selection_start_date?: string;
  selection_end_date?: string;
  selection_result_date?: string;
  re_enrollment_date?: string;
  opening_class_date?: string;
  first_week_start_date?: string;
  first_week_end_date?: string;
  review_week_start_date?: string;
  review_week_end_date?: string;
  final_exam_start_date?: string;
  final_exam_end_date?: string;
  graduation_start_date?: string;
  graduation_end_date?: string;
}

export interface Program {
  id: string;
  batch_id: string;
  name: string;
  description?: string;
  target_level?: string;
  duration_weeks?: number;
  max_thalibah?: number;
  status: ProgramStatus;
  created_at: string;
  updated_at: string;
  price?: number;
  is_free?: boolean;
  currency?: string;
}

export interface Halaqah {
  id: string;
  program_id: string;
  name: string;
  description?: string;
  day_of_week?: number; // 1-7 (Senin-Minggu)
  start_time?: string; // HH:MM format
  end_time?: string; // HH:MM format
  location?: string;
  max_students?: number;
  status: HalaqahStatus;
  created_at: string;
  updated_at: string;
}

export interface Pendaftaran {
  id: string;
  thalibah_id?: string;
  user_id?: string;
  program_id?: string;
  batch_id: string;
  batch_name?: string;
  registration_date?: string;
  status: PendaftaranStatus;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at?: string;
  submitted_at?: string;
  // Multi-role support fields
  registration_type?: 'calon_thalibah' | 'muallimah' | 'musyrifah';
  role?: 'calon_thalibah' | 'muallimah' | 'musyrifah' | 'thalibah' | 'admin';
  // Nested relations
  program?: Program;
  batch?: Batch;
}

export interface HalaqahMentor {
  id: string;
  halaqah_id: string;
  mentor_id: string;
  role: MentorRole;
  is_primary: boolean;
  assigned_at: string;
}

export interface HalaqahStudent {
  id: string;
  halaqah_id: string;
  thalibah_id: string;
  assigned_at: string;
  assigned_by?: string;
  status: HalaqahStudentStatus;
}

export interface Presensi {
  id: string;
  halaqah_id: string;
  thalibah_id: string;
  date: string;
  status: PresensiStatus;
  notes?: string;
  recorded_by?: string;
  recorded_at: string;
}

// Joined types untuk queries dengan relations
export interface BatchWithPrograms extends Batch {
  programs: Program[];
}

export interface ProgramWithBatch extends Program {
  batch: Batch;
  halaqah: Halaqah[];
}

export interface HalaqahWithProgram extends Halaqah {
  program: Program;
  mentors: (HalaqahMentor & { user: User })[];
  students: (HalaqahStudent & { user: User })[];
}

export interface ProgramWithHalaqah extends Program {
  batch: Batch;
  halaqah: Halaqah[];
  pendaftaran_count?: number;
}

export interface UserWithPendaftaran extends User {
  pendaftaran: (Pendaftaran & { program: Program & { batch: Batch } })[];
}

export interface PendaftaranWithDetails extends Pendaftaran {
  thalibah: User;
  program: Program & { batch: Batch };
  halaqah?: (HalaqahStudent & { halaqah: Halaqah })[];
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: UserRole;
}

export interface BatchForm {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  registration_start_date?: string;
  registration_end_date?: string;
}

export interface ProgramForm {
  batch_id: string;
  name: string;
  description?: string;
  target_level?: string;
  duration_weeks?: number;
  max_thalibah?: number;
  price?: number;
  is_free?: boolean;
  currency?: string;
}

export interface HalaqahForm {
  program_id: string;
  name: string;
  description?: string;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  location?: string;
  max_students?: number;
}

export interface PendaftaranForm {
  program_id: string;
  notes?: string;
}

export interface PresensiForm {
  thalibah_id: string;
  status: PresensiStatus;
  notes?: string;
}

// Dashboard types
export interface DashboardStats {
  total_thalibah: number;
  total_programs: number;
  total_halaqah: number;
  active_batches: number;
}

export interface ThalibahDashboard {
  user: User;
  active_pendaftaran: (Pendaftaran & { program: Program & { batch: Batch } })[];
  halaqah: (HalaqahStudent & { halaqah: Halaqah & { program: Program } })[];
  presensi_summary: {
    total_hadir: number;
    total_izin: number;
    total_sakit: number;
    total_alpha: number;
  };
}

export interface MentorDashboard {
  user: User;
  halaqah_mentors: (HalaqahMentor & {
    halaqah: Halaqah & {
      program: Program & { batch: Batch };
      students: (HalaqahStudent & { user: User })[];
    };
  })[];
  presensi_pending: Presensi[];
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Filter types
export interface BatchFilter {
  status?: BatchStatus[];
  search?: string;
}

export interface ProgramFilter {
  batch_id?: string;
  status?: ProgramStatus[];
  search?: string;
}

export interface HalaqahFilter {
  program_id?: string;
  status?: HalaqahStatus[];
  search?: string;
}

export interface PendaftaranFilter {
  batch_id?: string;
  program_id?: string;
  status?: PendaftaranStatus[];
  search?: string;
}

export interface PresensiFilter {
  halaqah_id?: string;
  date_from?: string;
  date_to?: string;
  status?: PresensiStatus[];
}
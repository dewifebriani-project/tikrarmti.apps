// Batch-related types for Tikrar MTI Apps
import type { Batch, BatchStatus, BatchFilter } from './database';

// Re-export database types
export type { Batch, BatchStatus, BatchFilter };

// Request types for batch operations
export interface BatchCreateRequest {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  registration_start_date?: string;
  registration_end_date?: string;
  target_juz?: number[];
  duration_weeks?: number;
  max_students?: number;

  // Timeline phase dates
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

export interface BatchUpdateRequest {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  registration_start_date?: string;
  registration_end_date?: string;
  status?: BatchStatus;
  target_juz?: number[];
  duration_weeks?: number;
  max_students?: number;

  // Timeline phase dates
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

// Enrollment types
export type EnrollmentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'selected'
  | 'active'
  | 'completed'
  | 'graduated'
  | 'dropped';

export interface BatchEnrollment {
  id: string;
  batch_id: string;
  user_id: string;
  enrollment_date: string;
  status: EnrollmentStatus;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  halaqah_id?: string;
  performance_score?: number;
  attendance?: {
    total_sessions: number;
    attended_sessions: number;
    attendance_rate: number;
  };
  created_at: string;
  updated_at?: string;
}

export interface EnrollmentApprovalRequest {
  approved_by?: string;
  notes?: string;
  halaqah_id?: string;
  rejection_reason?: string;
}

// Session types
export type SessionType = 'lecture' | 'discussion' | 'practice' | 'evaluation';
export type SessionStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export interface BatchSession {
  id: string;
  batch_id: string;
  session_number: number;
  title: string;
  description?: string;
  session_date: string;
  session_type: SessionType;
  status: SessionStatus;
  instructor_id?: string;
  duration_minutes?: number;
  meeting_link?: string;
  recording_url?: string;
  materials?: {
    title: string;
    url: string;
    type: string;
  }[];
  attendance_count?: number;
  created_at: string;
  updated_at?: string;
}

// Statistics types
export interface BatchStatistics {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  droppedEnrollments: number;
  graduationRate: number;
  averageAttendance: number;
  averagePerformance: number;
  performance: {
    completionRates: {
      overall: number;
      byWeek: Record<string, number>;
    };
    attendanceRates: {
      overall: number;
      byWeek: Record<string, number>;
    };
    dropoutReasons: Record<string, number>;
  };
  demographics: {
    ageGroups: Record<string, number>;
    domicile: Record<string, number>;
    timezones: Record<string, number>;
  };
  enrollmentTrends: {
    weekly: Array<{
      week: string;
      enrollments: number;
      completions: number;
    }>;
    monthly: Array<{
      month: string;
      enrollments: number;
      completions: number;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Extended filter for batch queries
export interface ExtendedBatchFilter extends BatchFilter {
  targetJuz?: number[];
  dateRange?: {
    start: string;
    end: string;
  };
}

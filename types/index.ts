/**
 * Type Definitions for Tikrar MTI Apps
 *
 * This file exports:
 * 1. Database types (from types/database.ts) - use for server-side operations
 * 2. API Response types (from lib/api-wrapper.ts) - use for API responses
 * 3. Frontend-specific types - use for client-side operations
 *
 * RECOMMENDATION:
 * - For server components/API routes: Import directly from types/database.ts
 * - For client components: Import from this file (types/index.ts)
 */

import type { User } from './database'

// =====================================================
// DATABASE TYPES - Re-export for convenience
// =====================================================
export type {
  // Role & Status Types
  UserRole,
  BatchStatus,
  ProgramStatus,
  HalaqahStatus,
  PendaftaranStatus,
  MentorRole,
  HalaqahStudentStatus,
  PresensiStatus,
  JuzPart,
  DaftarUlangStatus,
  SPLevel,
  SPStatus,
  SPType,
  SPReason,
  UdzurType,

  // Database Models
  User,
  Batch,
  Program,
  Halaqah,
  Pendaftaran,
  DaftarUlangSubmission,
  HalaqahMentor,
  HalaqahStudent,
  Presensi,
  JuzOption,
  SuratPeringatan,
  SPHistory,
  PendingSP,
  SPSummary,

  // Joined Types
  BatchWithPrograms,
  ProgramWithBatch,
  HalaqahWithProgram,
  ProgramWithHalaqah,
  UserWithPendaftaran,
  PendaftaranWithDetails,

  // Form Types
  LoginForm,
  RegisterForm,
  BatchForm,
  ProgramForm,
  HalaqahForm,
  PendaftaranForm,
  PresensiForm,

  // Dashboard Types
  DashboardStats,
  ThalibahDashboard,
  MentorDashboard,

  // Filter Types
  BatchFilter,
  ProgramFilter,
  HalaqahFilter,
  PendaftaranFilter,
  PresensiFilter,
  SPFilter,

  // Input/Update Types
  CreateSPInput,
  UpdateSPInput,

  // API Response Types
  ApiResponse,
  PaginatedResponse,
} from './database'

// =====================================================
// API RESPONSE TYPES - Re-export from lib/api-wrapper.ts
// =====================================================
export type {
  ApiResponse as ApiResponseType,
  ApiError,
  PaginatedResponse as ApiPaginatedResponse,
} from '../lib/api-wrapper'

// =====================================================
// FRONTEND-SPECIFIC TYPES
// =====================================================

/**
 * AuthContextType - Client-side authentication context
 * Used by useAuth hook and AuthProvider
 */
export interface AuthContextType {
  user: User | null
  loading: boolean
  loginWithEmail: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  registerWithEmail: (email: string, password: string, userData?: Partial<User>) => Promise<void>
  logout: () => Promise<void>
  updateUserProfile: (data: Partial<User>) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  deleteUser: () => Promise<void>
  isProfileComplete: () => boolean
  isAdmin: () => boolean
  isThalibah: () => boolean
  canAccessAdminPanel: () => boolean
}

/**
 * Server Action Response Type
 * Standard response format for all server actions
 */
export interface ServerActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Legacy PendaftaranData type
 * Kept for backward compatibility with existing forms
 * @deprecated Use PendaftaranForm from types/database.ts instead
 */
export interface PendaftaranData {
  uid?: string
  email: string
  namaLengkap: string
  namaPanggilan: string
  tempatLahir: string
  tanggalLahir: string
  alamat: string
  nomorWhatsApp: string
  pendidikanTerakhir: string
  pekerjaan: string
  namaWali: string
  nomorWali: string
  hubunganWali: string
  alasanDaftar: string
  programTahfidz: string
  experience: string
  motivation: string
  target: string
  availability: string
  createdAt?: Date
  updatedAt?: Date
  status?: 'pending' | 'approved' | 'rejected'
}

// =====================================================
// TYPE UTILITIES
// =====================================================

/**
 * Make specific properties of T required
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Make specific properties of T optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Extract the promise return type
 */
export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : any

import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create individual instances to avoid conflicts
// Use dummy values during build if env vars are not available
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
)

// Admin client for server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-service-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string | null
          full_name: string | null
          phone: string | null
          role: string | null
          avatar_url: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          provinsi: string | null
          kota: string | null
          alamat: string | null
          whatsapp: string | null
          telegram: string | null
          zona_waktu: string | null
          tanggal_lahir: string | null
          tempat_lahir: string | null
          pekerjaan: string | null
          nama_wali: string | null
          nomor_wali: string | null
          hubungan_wali: string | null
          alasan_daftar: string | null
        }
        Insert: {
          id?: string
          email: string
          password_hash?: string | null
          full_name?: string | null
          phone?: string | null
          role?: string | null
          avatar_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          provinsi?: string | null
          kota?: string | null
          alamat?: string | null
          whatsapp?: string | null
          telegram?: string | null
          zona_waktu?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          pekerjaan?: string | null
          nama_wali?: string | null
          nomor_wali?: string | null
          hubungan_wali?: string | null
          alasan_daftar?: string | null
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string | null
          full_name?: string | null
          phone?: string | null
          role?: string | null
          avatar_url?: string | null
          is_active?: boolean | null
          updated_at?: string | null
          provinsi?: string | null
          kota?: string | null
          alamat?: string | null
          whatsapp?: string | null
          telegram?: string | null
          zona_waktu?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          pekerjaan?: string | null
          nama_wali?: string | null
          nomor_wali?: string | null
          hubungan_wali?: string | null
          alasan_daftar?: string | null
        }
      }
      jurnal_harian: {
        Row: {
          id: string
          user_id: string
          date: string
          completed_steps: {
            rabth: boolean
            murajaah: boolean
            simakMurattal: boolean
            tikrarBiAnNadzar: boolean
            tasmiRecord: boolean
            simakRecord: boolean
            tikrarBiAlGhaib: boolean
            tafsir?: boolean
            menulis?: boolean
          }
          counters: {
            murajaahCount: number
            simakCount: number
            recordingCount: number
            tikrarGhaibCount: number
          }
          recording_time: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          completed_steps: {
            rabth?: boolean
            murajaah?: boolean
            simakMurattal?: boolean
            tikrarBiAnNadzar?: boolean
            tasmiRecord?: boolean
            simakRecord?: boolean
            tikrarBiAlGhaib?: boolean
            tafsir?: boolean
            menulis?: boolean
          }
          counters?: {
            murajaahCount?: number
            simakCount?: number
            recordingCount?: number
            tikrarGhaibCount?: number
          }
          recording_time?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          completed_steps?: {
            rabth?: boolean
            murajaah?: boolean
            simakMurattal?: boolean
            tikrarBiAnNadzar?: boolean
            tasmiRecord?: boolean
            simakRecord?: boolean
            tikrarBiAlGhaib?: boolean
            tafsir?: boolean
            menulis?: boolean
          }
          counters?: {
            murajaahCount?: number
            simakCount?: number
            recordingCount?: number
            tikrarGhaibCount?: number
          }
          recording_time?: number | null
          updated_at?: string
        }
      }
      tashih_records: {
        Row: {
          id: string
          user_id: string
          blok: string
          lokasi: string
          masalah_tajwid: string | null
          waktu_tashih: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          blok: string
          lokasi: string
          masalah_tajwid?: string | null
          waktu_tashih: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          blok?: string
          lokasi?: string
          masalah_tajwid?: string | null
          waktu_tashih?: string
        }
      }
      progress_milestones: {
        Row: {
          id: string
          user_id: string
          milestone_type: string
          status: 'pending' | 'current' | 'completed'
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          milestone_type: string
          status?: 'pending' | 'current' | 'completed'
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          milestone_type?: string
          status?: 'pending' | 'current' | 'completed'
          completed_at?: string | null
        }
      }
    }
  }
}
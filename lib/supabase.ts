import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          role: 'admin' | 'musyrifah' | 'muallimah' | 'calon_thalibah' | 'thalibah'
          password_hash: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string | null
          phone?: string | null
          avatar_url: string | null
          role?: 'admin' | 'musyrifah' | 'muallimah' | 'thalibah'
          password_hash: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'musyrifah' | 'muallimah' | 'thalibah'
          updated_at?: string
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
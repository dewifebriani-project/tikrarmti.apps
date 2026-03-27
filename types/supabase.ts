export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string | null
          full_name: string | null
          nama_kunyah: string | null
          phone: string | null
          role: string | null
          roles: string[] | null
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
          jenis_kelamin: string | null
          negara: string | null
        }
        Insert: {
          id?: string
          email: string
          password_hash?: string | null
          full_name?: string | null
          nama_kunyah?: string | null
          phone?: string | null
          role?: string | null
          roles?: string[] | null
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
          jenis_kelamin?: string | null
          negara?: string | null
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string | null
          full_name?: string | null
          nama_kunyah?: string | null
          phone?: string | null
          role?: string | null
          roles?: string[] | null
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
          jenis_kelamin?: string | null
          negara?: string | null
        }
      }
      pendaftaran_tikrar_tahfidz: {
        Row: {
          id: string
          user_id: string
          batch_id: string
          full_name: string
          chosen_juz: string
          oral_total_score: number | null
          written_quiz_score: number | null
          selection_status: string
          submission_date: string
          created_at: string
          updated_at: string
        }
        Insert: any
        Update: any
      }
      batches: {
        Row: {
          id: string
          name: string
          status: string
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: any
        Update: any
      }
      halaqah: {
        Row: {
          id: string
          name: string
          program_id: string | null
          muallimah_id: string | null
          status: string
          max_students: number | null
          created_at: string
          updated_at: string
        }
        Insert: any
        Update: any
      }
      // Add other tables as placeholders to be filled by CLI
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

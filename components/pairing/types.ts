import { LucideIcon } from 'lucide-react'

export interface Batch {
  id: string
  name: string
  status: string
}

export interface PairingStats {
  selfMatch: { submitted: number; approved: number }
  systemMatch: { submitted: number; approved: number }
  tarteel: { submitted: number; approved: number }
  family: { submitted: number; approved: number }
}

export interface UserDetails {
  full_name: string
  email: string
  zona_waktu: string
  chosen_juz: string
  main_time_slot: string
  backup_time_slot: string
  tanggal_lahir?: string
  whatsapp?: string
}

export interface SelfMatchRequest {
  id: string
  submission_id: string
  user_id: string
  user_name: string
  user_zona_waktu: string
  chosen_juz: string
  main_time_slot: string
  backup_time_slot: string
  user_tanggal_lahir: string
  partner_id: string
  partner_name: string
  is_mutual_match: boolean
  is_paired: boolean
  paired_partner_id?: string
  paired_partner_name?: string
  partner_details?: UserDetails
}

export interface SystemMatchRequest {
  id: string
  user_id: string
  user_name: string
  user_zona_waktu: string
  chosen_juz: string
  user_tanggal_lahir: string
  main_time_slot: string
  backup_time_slot: string
  is_paired: boolean
  partner_id?: string
  partner_name?: string
  partner_names?: string[]
  partner_details?: UserDetails
  batch_id?: string
}

export interface TarteelRequest {
  id: string
  user_id: string
  user_name: string
  user_zona_waktu: string
  chosen_juz: string
  user_tanggal_lahir: string
  main_time_slot: string
  backup_time_slot: string
  partner_name: string
  partner_wa_phone: string
  partner_relationship: string
  partner_notes: string
  is_paired: boolean
  pairing_id?: string
  paired_partner_name?: string
  paired_partner_names?: string[]
  batch_id?: string
}

export interface FamilyRequest {
  id: string
  user_id: string
  user_name: string
  user_zona_waktu: string
  chosen_juz: string
  user_tanggal_lahir: string
  main_time_slot: string
  backup_time_slot: string
  partner_name: string
  partner_wa_phone: string
  partner_relationship: string
  partner_notes: string
  is_paired: boolean
  pairing_id?: string
  paired_partner_name?: string
  paired_partner_names?: string[]
  batch_id?: string
}

export interface MatchCandidate {
  user_id: string
  full_name: string
  email: string
  zona_waktu: string
  chosen_juz: string
  main_time_slot: string
  backup_time_slot: string
  tanggal_lahir: string
  match_score: number
  match_reasons: string[]
}

export interface MatchData {
  user: UserDetails
  candidates: MatchCandidate[]
  total_matches: number
}

export interface PairingDetail {
  pairing: {
    id: string
    batch_id: string
    pairing_type: string
    is_group_of_3: boolean
    paired_at: string
  }
  user_1: UserDetails
  user_2: UserDetails
  user_3?: UserDetails
}

export type SortConfig = {
  key: string
  direction: 'asc' | 'desc'
}

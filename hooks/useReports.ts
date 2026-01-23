'use client'

import useSWR from 'swr'

/**
 * Types for reports API
 */
export interface ReportTashihRecord {
  id: string
  user_id: string
  blok: string
  lokasi: string
  lokasi_detail?: string
  nama_pemeriksa?: string
  masalah_tajwid: any[]
  catatan_tambahan?: string
  waktu_tashih: string
  created_at: string
  updated_at: string
  user_data?: {
    id: string
    full_name?: string
    email?: string
  } | null
  blok_list?: string[]
}

export interface ReportJurnalRecord {
  id: string
  user_id: string
  tanggal_jurnal: string
  tanggal_setor: string
  juz_code: string | null
  blok: string | null
  tashih_completed: boolean
  rabth_completed: boolean
  murajaah_count: number
  simak_murattal_count: number
  tikrar_bi_an_nadzar_completed: boolean
  tasmi_record_count: number
  simak_record_completed: boolean
  tikrar_bi_al_ghaib_count: number
  tikrar_bi_al_ghaib_type: string | null
  tarteel_screenshot_url: string | null
  tafsir_completed: boolean
  menulis_completed: boolean
  catatan_tambahan: string | null
  created_at: string
  updated_at: string
  user_data?: {
    id: string
    full_name?: string
    email?: string
  } | null
}

export interface ReportsResponse<T> {
  success: boolean
  data: T[]
  summary?: {
    total_records: number
    unique_users: number
  }
  error?: string
  message?: string
}

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch data')
  }

  return response.json()
}

/**
 * Hook for fetching tashih reports (musyrifah/admin only)
 */
export function useTashihReports(params?: {
  date_from?: string
  user_id?: string
  limit?: number
}) {
  const queryString = new URLSearchParams()
  if (params?.date_from) queryString.set('date_from', params.date_from)
  if (params?.user_id) queryString.set('user_id', params.user_id)
  if (params?.limit) queryString.set('limit', params.limit.toString())

  const url = `/api/reports/tashih${queryString.toString() ? '?' + queryString.toString() : ''}`

  const { data, error, isLoading, mutate } = useSWR<ReportsResponse<ReportTashihRecord>>(
    url,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // 30 seconds
      dedupingInterval: 10000, // 10 seconds
    }
  )

  return {
    records: data?.data || [],
    summary: data?.summary,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook for fetching jurnal reports (musyrifah/admin only)
 */
export function useJurnalReports(params?: {
  date?: string
  date_from?: string
  date_to?: string
  user_id?: string
  limit?: number
}) {
  const queryString = new URLSearchParams()
  if (params?.date) queryString.set('date', params.date)
  if (params?.date_from) queryString.set('date_from', params.date_from)
  if (params?.date_to) queryString.set('date_to', params.date_to)
  if (params?.user_id) queryString.set('user_id', params.user_id)
  if (params?.limit) queryString.set('limit', params.limit.toString())

  const url = `/api/reports/jurnal${queryString.toString() ? '?' + queryString.toString() : ''}`

  const { data, error, isLoading, mutate } = useSWR<ReportsResponse<ReportJurnalRecord>>(
    url,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // 30 seconds
      dedupingInterval: 10000, // 10 seconds
    }
  )

  return {
    records: data?.data || [],
    summary: data?.summary,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Delete a tashih record (admin only)
 */
export async function deleteTashihRecord(recordId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/reports/tashih?id=${encodeURIComponent(recordId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to delete record' }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete record' }
  }
}

/**
 * Delete a jurnal record (admin only)
 */
export async function deleteJurnalRecord(recordId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/reports/jurnal?id=${encodeURIComponent(recordId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to delete record' }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete record' }
  }
}

/**
 * Update a jurnal record (admin only)
 */
export async function updateJurnalRecord(
  recordId: string,
  updateData: Partial<ReportJurnalRecord>
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const response = await fetch('/api/reports/jurnal', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ id: recordId, ...updateData }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to update record' }
    }

    return { success: true, data: result.data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update record' }
  }
}

/**
 * Type for thalibah data from musyrifah panel
 * Data comes from daftar_ulang_submissions (approved thalibah only)
 */
export interface ThalibahData {
  id: string
  user_id: string
  registration_id?: string
  batch_id: string
  full_name: string
  chosen_juz?: string
  wa_phone?: string
  whatsapp?: string
  email?: string
  status: string
  submitted_at?: string
  user_data?: {
    id: string
    full_name?: string
    email?: string
    whatsapp?: string
  }
}

export interface ThalibahResponse {
  success: boolean
  data: ThalibahData[]
  batch?: {
    id: string
    name: string
    start_date: string
    status: string
  }
  summary?: {
    total_thalibah: number
  }
  error?: string
  message?: string
}

/**
 * Hook for fetching all thalibah data for musyrifah panel
 */
export function useThalibahData(params?: { batch_id?: string }) {
  const queryString = new URLSearchParams()
  if (params?.batch_id) queryString.set('batch_id', params.batch_id)

  const url = `/api/reports/thalibah${queryString.toString() ? '?' + queryString.toString() : ''}`

  const { data, error, isLoading, mutate } = useSWR<ThalibahResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000,
      dedupingInterval: 10000,
    }
  )

  return {
    thalibah: data?.data || [],
    batch: data?.batch || null,
    summary: data?.summary,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

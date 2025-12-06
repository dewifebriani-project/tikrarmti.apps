export interface JuzOption {
  id: string
  code: string // e.g., '1A', '1B', '28A', etc.
  name: string // e.g., 'Juz 1A (Halaman 1-11)'
  juz_number: number // 1, 28, 29, or 30
  part: 'A' | 'B'
  start_page: number
  end_page: number
  total_pages?: number // Auto-calculated
  is_active: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

export const JUZ_OPTIONS: JuzOption[] = [
  {
    id: '1a',
    code: '1A',
    name: 'Juz 1A (Halaman 1-11)',
    juz_number: 1,
    part: 'A',
    start_page: 1,
    end_page: 11,
    total_pages: 11,
    is_active: true,
    sort_order: 1
  },
  {
    id: '1b',
    code: '1B',
    name: 'Juz 1B (Halaman 12-21)',
    juz_number: 1,
    part: 'B',
    start_page: 12,
    end_page: 21,
    total_pages: 10,
    is_active: true,
    sort_order: 2
  },
  {
    id: '28a',
    code: '28A',
    name: 'Juz 28A (Halaman 542-551)',
    juz_number: 28,
    part: 'A',
    start_page: 542,
    end_page: 551,
    total_pages: 10,
    is_active: true,
    sort_order: 3
  },
  {
    id: '28b',
    code: '28B',
    name: 'Juz 28B (Halaman 552-561)',
    juz_number: 28,
    part: 'B',
    start_page: 552,
    end_page: 561,
    total_pages: 10,
    is_active: true,
    sort_order: 4
  },
  {
    id: '29a',
    code: '29A',
    name: 'Juz 29A (Halaman 562-571)',
    juz_number: 29,
    part: 'A',
    start_page: 562,
    end_page: 571,
    total_pages: 10,
    is_active: true,
    sort_order: 5
  },
  {
    id: '29b',
    code: '29B',
    name: 'Juz 29B (Halaman 572-581)',
    juz_number: 29,
    part: 'B',
    start_page: 572,
    end_page: 581,
    total_pages: 10,
    is_active: true,
    sort_order: 6
  },
  {
    id: '30a',
    code: '30A',
    name: 'Juz 30A (Halaman 582-591)',
    juz_number: 30,
    part: 'A',
    start_page: 582,
    end_page: 591,
    total_pages: 10,
    is_active: true,
    sort_order: 7
  },
  {
    id: '30b',
    code: '30B',
    name: 'Juz 30B (Halaman 592-604)',
    juz_number: 30,
    part: 'B',
    start_page: 592,
    end_page: 604,
    total_pages: 13,
    is_active: true,
    sort_order: 8
  }
]

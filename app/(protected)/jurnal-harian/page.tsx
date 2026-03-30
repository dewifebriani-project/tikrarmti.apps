'use client'

import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAllRegistrations } from '@/hooks/useRegistrations'
import { useAuth } from '@/hooks/useAuth'
import { useJurnalStatus } from '@/hooks/useDashboard'
import { saveJurnalRecord } from './actions'
import { getRoleRank, ROLE_RANKS } from '@/lib/roles'

// Import New Modular Components
import { JurnalHeader } from './components/JurnalHeader'
import { JurnalStatusGrid } from './components/JurnalStatusGrid'
import { JurnalEntryForm } from './components/JurnalEntryForm'

interface JuzOption {
  id: string
  code: string
  name: string
  juz_number: number
  part: string
  start_page: number
  end_page: number
}

interface JurnalData {
  tanggal_setor: string
  juz_code: string
  blok: string
  rabth_completed: boolean
  murajaah_completed: boolean
  simak_murattal_completed: boolean
  tikrar_bi_an_nadzar_completed: boolean
  tasmi_record_completed: boolean
  simak_record_completed: boolean
  tikrar_bi_al_ghaib_completed: boolean
  tafsir_completed: boolean
  menulis_completed: boolean
  catatan_tambahan: string
}

export default function JurnalHarianPage() {
  const { user } = useAuth()
  
  // Identify if user is Admin/Staff for preview mode
  const isAdmin = React.useMemo(() => {
    const primaryRole = (user as any)?.primaryRole;
    return getRoleRank(primaryRole) >= ROLE_RANKS.admin;
  }, [user]);

  const { registrations, isLoading: registrationsLoading } = useAllRegistrations()
  const { jurnalStatus, isLoading: jurnalStatusLoading, mutate: mutateJurnalStatus } = useJurnalStatus()

  const [jurnalData, setJurnalData] = useState<JurnalData>({
    tanggal_setor: new Date().toISOString().slice(0, 10),
    juz_code: '',
    blok: '',
    rabth_completed: false,
    murajaah_completed: false,
    simak_murattal_completed: false,
    tikrar_bi_an_nadzar_completed: false,
    tasmi_record_completed: false,
    simak_record_completed: false,
    tikrar_bi_al_ghaib_completed: false,
    tafsir_completed: false,
    menulis_completed: false,
    catatan_tambahan: ''
  })

  const [isLoadingJuz, setIsLoadingJuz] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedJuzInfo, setSelectedJuzInfo] = useState<JuzOption | null>(null)
  
  // View states
  const [viewMode, setViewMode] = useState<'status' | 'form'>('status')
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number>(1)

  // Get active registration
  const activeRegistration = registrations.find((reg: any) =>
    reg.batch?.status === 'open' &&
    (reg.status === 'approved' || reg.selection_status === 'selected')
  ) || registrations[0]

  const juzToUse = activeRegistration?.daftar_ulang?.confirmed_chosen_juz ||
                      (activeRegistration as any)?.chosen_juz ||
                      (isAdmin ? '30A' : null)

  const batchStartDate = activeRegistration?.batch?.start_date || (isAdmin ? new Date().toISOString() : null)

  useEffect(() => {
    if (juzToUse) {
      loadJuzInfo(juzToUse)
    }
  }, [juzToUse])

  useEffect(() => {
    if (batchStartDate) {
      const startDate = new Date(batchStartDate)
      const diffDays = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const weekNum = Math.max(1, Math.floor((Math.max(0, diffDays - 7)) / 7) + 1)
      setCurrentWeekNumber(weekNum)
    }
  }, [batchStartDate])

  const loadJuzInfo = async (juzCode: string) => {
    setIsLoadingJuz(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.from('juz_options').select('*').eq('code', juzCode).single()
      if (data) {
        setSelectedJuzInfo(data)
        setJurnalData(prev => ({ ...prev, juz_code: juzCode }))
      }
    } catch (error) {
      console.error('Error loading juz info:', error)
    } finally {
      setIsLoadingJuz(false)
    }
  }

  const handleBlockClick = (blockCode: string, weekNumber: number) => {
    // Reset form for the specific block
    const blockData = jurnalStatus?.blocks.find(b => b.block_code === blockCode)
    
    // If block exists and is completed, we could load it (optional edit mode)
    // For now, let's just reset
    setJurnalData(prev => ({ 
      ...prev, 
      blok: blockCode,
      rabth_completed: false,
      murajaah_completed: false,
      simak_murattal_completed: false,
      tikrar_bi_an_nadzar_completed: false,
      tasmi_record_completed: false,
      simak_record_completed: false,
      tikrar_bi_al_ghaib_completed: false,
      tafsir_completed: false,
      menulis_completed: false,
      catatan_tambahan: ''
    }))
    setViewMode('form')
  }

  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      const result = await saveJurnalRecord({
        ...data,
        weekNumber: Math.ceil(parseInt(data.blok.match(/H(\d+)/)?.[1] || '1') / 1) // Logic per individual block
      })
      if (result.success) {
        toast.success(result.message)
        await mutateJurnalStatus()
        setViewMode('status')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Gagal menyimpan jurnal')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (registrationsLoading || jurnalStatusLoading || isLoadingJuz) {
    return <div className="flex justify-center items-center py-24"><Loader2 className="h-10 w-10 animate-spin text-green-900" /></div>
  }

  if (!jurnalStatus && !isAdmin) {
    return (
      <div className="text-center py-12 glass-premium rounded-3xl m-4">
        <h2 className="text-xl font-bold text-gray-800">Halaqah Belum Aktif</h2>
        <p className="text-gray-500 mt-2">Pendaftaran Ukhti sedang diproses.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fadeInUp">
      {/* Header Section */}
      <JurnalHeader 
        title={viewMode === 'form' ? "Entry Jurnal Harian" : "Jurnal Harian"} 
        subtitle={viewMode === 'form' ? "Catat aktivitas harian Ukhti" : "Pantau kedisiplinan hafalan harian"} 
        juzInfo={selectedJuzInfo}
        progress={jurnalStatus ? {
          completed: jurnalStatus.summary.completed_blocks,
          total: jurnalStatus.summary.total_blocks
        } : undefined}
      />

      {viewMode === 'status' ? (
        <>
          {/* Grid Section */}
          {jurnalStatus && (
            <JurnalStatusGrid 
              blocks={jurnalStatus.blocks} 
              currentWeekNumber={currentWeekNumber}
              onBlockClick={handleBlockClick}
              isAdminPreview={isAdmin && !activeRegistration}
            />
          )}
        </>
      ) : (
        <JurnalEntryForm 
          blockCode={jurnalData.blok}
          initialData={jurnalData}
          isSubmitting={isSubmitting}
          onSubmit={handleFormSubmit}
          onCancel={() => setViewMode('status')}
        />
      )}
    </div>
  )
}

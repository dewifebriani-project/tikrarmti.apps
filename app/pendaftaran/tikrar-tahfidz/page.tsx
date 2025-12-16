'use client'

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useCSRF } from '@/contexts/CSRFContext'
import { type PendaftaranData } from '@/lib/pendaftaran'
import { fetchInitialData, getCachedBatchInfo } from './optimized-sections'
import { supabase } from '@/lib/supabase-singleton'
import { sessionManager, autoExtendSession } from '@/lib/session-manager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, Send, Info, CheckCircle, AlertCircle, Calendar, Users, Award, Clock } from 'lucide-react'

interface FormData {
  // Section 1 - Komitmen & Pemahaman
  understands_commitment: boolean
  tried_simulation: boolean
  no_negotiation: boolean
  has_telegram: boolean
  saved_contact: boolean

  // Section 2 - Izin & Pilihan Program
  has_permission: 'yes' | 'janda' | ''
  permission_name: string
  permission_phone: string
  permission_phone_validation: string
  chosen_juz: string
  no_travel_plans: boolean
  motivation: string
  ready_for_team: string

  // Section 3 - Data Tambahan (khusus tikrar)
  main_time_slot: string
  backup_time_slot: string
  time_commitment: boolean

  // Section 4 - Pemahaman Program
  understands_program: boolean
  questions: string
}

function TikrarTahfidzPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { token: csrfToken, isLoading: csrfLoading, refreshCSRFToken } = useCSRF()

  // Default form data
  const defaultFormData = {
    understands_commitment: false,
    tried_simulation: false,
    no_negotiation: false,
    has_telegram: false,
    saved_contact: false,
    has_permission: '' as 'yes' | 'janda' | '',
    permission_name: '',
    permission_phone: '',
    permission_phone_validation: '',
    chosen_juz: '',
    no_travel_plans: false,
    motivation: '',
    ready_for_team: '',
    main_time_slot: '',
    backup_time_slot: '',
    time_commitment: false,
    understands_program: false,
    questions: ''
  }

  const [isClient, setIsClient] = useState(false)
  const [currentSection, setCurrentSection] = useState(1)
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [batchInfo, setBatchInfo] = useState<{
    batch_id: string,
    program_id: string,
    batch_name: string,
    start_date: string,
    end_date: string,
    duration_weeks: number,
    price: number,
    is_free: boolean,
    scholarship_quota: number,
    total_quota: number,
    registered_count: number
  } | null>(null)
  const [existingRegistration, setExistingRegistration] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoadingRegistration, setIsLoadingRegistration] = useState(false)

  const totalSections = 4
  const progressPercentage = useMemo(() => (currentSection / totalSections) * 100, [currentSection])

  // Version check to force reload on new deployments
  useEffect(() => {
    const CURRENT_VERSION = '2025-12-16-v2'; // Update this to force cache clear
    const storedVersion = localStorage.getItem('tikrar_page_version');

    if (storedVersion !== CURRENT_VERSION) {
      console.log('New version detected, clearing cache...');
      // Clear old cache but preserve form data
      const savedFormState = localStorage.getItem('tikrar_form_state');
      localStorage.clear();
      if (savedFormState) {
        localStorage.setItem('tikrar_form_state', savedFormState);
      }
      localStorage.setItem('tikrar_page_version', CURRENT_VERSION);
      // Force reload to get fresh resources
      window.location.reload();
    }
  }, []);

  // Initialize state after component mounts to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true)

    // Load saved state from localStorage after mount
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('tikrar_form_state')
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState)
          if (parsed.currentSection) setCurrentSection(parsed.currentSection)
          if (parsed.formData) setFormData(parsed.formData)
        } catch (e) {
          console.error('Error parsing saved state:', e)
        }
      }
    }
  }, [])

  // Check for existing registration - optimized for faster loading
  useEffect(() => {
    if (!isClient || !user) return

    const checkExistingRegistration = async () => {
      setIsLoadingRegistration(true)
      try {
        console.log('Checking existing registration for user:', user.id, user.email)

        // Fetch registration data
        const checkResponse = await fetch('/api/auth/check-registration-simple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for authentication
          body: JSON.stringify({
            userId: user.id,
            email: user.email
          })
        })

        if (checkResponse.ok) {
          const data = await checkResponse.json()
          console.log('Existing registration data:', data)

          if (data.hasRegistered && data.registration) {
            setExistingRegistration(data.registration)
            setIsEditMode(true)

            // API now returns all form fields, no need for second API call
            console.log('Full registration data:', data.registration)

            // Populate form with existing data - using object spread for cleaner code
            const populatedForm = {
              understands_commitment: data.registration.understands_commitment ?? false,
              tried_simulation: data.registration.tried_simulation ?? false,
              no_negotiation: data.registration.no_negotiation ?? false,
              has_telegram: data.registration.has_telegram ?? false,
              saved_contact: data.registration.saved_contact ?? false,
              has_permission: data.registration.has_permission || '',
              permission_name: data.registration.permission_name || '',
              permission_phone: data.registration.permission_phone || '',
              permission_phone_validation: data.registration.permission_phone || '',
              chosen_juz: data.registration.chosen_juz || '',
              no_travel_plans: data.registration.no_travel_plans ?? false,
              motivation: data.registration.motivation || '',
              ready_for_team: data.registration.ready_for_team || '',
              main_time_slot: data.registration.main_time_slot || '',
              backup_time_slot: data.registration.backup_time_slot || '',
              time_commitment: data.registration.time_commitment ?? false,
              understands_program: data.registration.understands_program ?? false,
              questions: data.registration.questions || ''
            }

            setFormData(populatedForm)
          }
        }
      } catch (error) {
        console.error('Error checking existing registration:', error)
      } finally {
        setIsLoadingRegistration(false)
      }
    }

    // Add a small delay to ensure all state is properly initialized
    const timeoutId = setTimeout(checkExistingRegistration, 50)

    return () => clearTimeout(timeoutId)
  }, [isClient, user])

  // Optimized data fetching with parallel loading
  useEffect(() => {
    if (!isClient) return

    // Load cached data immediately for instant UI
    const cachedBatch = getCachedBatchInfo()
    if (cachedBatch) {
      setBatchInfo({
        batch_id: cachedBatch.batch_id,
        program_id: cachedBatch.program_id,
        batch_name: cachedBatch.batch_name,
        start_date: cachedBatch.start_date,
        end_date: cachedBatch.end_date,
        duration_weeks: cachedBatch.duration_weeks,
        price: cachedBatch.price,
        is_free: cachedBatch.is_free,
        scholarship_quota: cachedBatch.scholarship_quota,
        total_quota: cachedBatch.total_quota,
        registered_count: cachedBatch.registered_count
      })
    }

    // Fetch batch info only (don't fetch user profile to avoid 401 errors)
    if (navigator.onLine) {
      console.log('[TikrarTahfidz] Fetching batch info...')
      fetchInitialData().then(({ batchInfo }) => {
        console.log('[TikrarTahfidz] Fetch batch info result:', { batchInfo });

        if (batchInfo) {
          console.log('[TikrarTahfidz] Setting batch info state')
          setBatchInfo({
            batch_id: batchInfo.batch_id,
            program_id: batchInfo.program_id,
            batch_name: batchInfo.batch_name,
            start_date: batchInfo.start_date,
            end_date: batchInfo.end_date,
            duration_weeks: batchInfo.duration_weeks,
            price: batchInfo.price,
            is_free: batchInfo.is_free,
            scholarship_quota: batchInfo.scholarship_quota,
            total_quota: batchInfo.total_quota,
            registered_count: batchInfo.registered_count
          })
        } else {
          console.error('[TikrarTahfidz] Failed to get batch info after retries')
        }
      }).catch(error => {
        console.error('[TikrarTahfidz] Error fetching batch info:', error)
      })
    }
  }, [isClient])

  // Save form state to localStorage whenever it changes - client side only
  useEffect(() => {
    if (!isClient) return

    const stateToSave = {
      currentSection,
      formData,
      errors,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('tikrar_form_state', JSON.stringify(stateToSave))
  }, [currentSection, formData, errors, isClient])

  // Restore scroll position and prevent auto-scroll to top on mount - client side only
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return

    const savedScrollPosition = sessionStorage.getItem('tikrar_scroll_position')
    if (savedScrollPosition) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPosition))
        sessionStorage.removeItem('tikrar_scroll_position')
      }, 100)
    }
  }, [isClient])

  // Save scroll position before unmount - client side only
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return

    const handleBeforeUnload = () => {
      sessionStorage.setItem('tikrar_scroll_position', window.pageYOffset.toString())
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isClient])

  const handleInputChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value }
      return newFormData
    })

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [errors])

  // Scroll to top when component mounts - ensure it works on first load
  useEffect(() => {
    // Use immediate scroll for first load, smooth scroll for subsequent loads
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0)
      // Additional scroll after a short delay to ensure it works on all platforms
      const scrollTimer = setTimeout(() => {
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      }, 100)
      return () => clearTimeout(scrollTimer)
    }
  }, [])

  const validateSection = (section: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (section === 1) {
      if (!formData.understands_commitment) {
        newErrors.understands_commitment = 'Wajib menyetujui komitmen program'
      }
      if (!formData.tried_simulation) {
        newErrors.tried_simulation = 'Wajib mencoba simulasi terlebih dahulu'
      }
      if (!formData.no_negotiation) {
        newErrors.no_negotiation = 'Wajib menyetujui tidak menego jumlah tikrar'
      }
      if (!formData.has_telegram) {
        newErrors.has_telegram = 'Wajib memiliki aplikasi Telegram'
      }
      if (!formData.saved_contact) {
        newErrors.saved_contact = 'Wajib menyimpan nomor kontak admin'
      }
    }

    if (section === 2) {
      if (!formData.has_permission) {
        newErrors.has_permission = 'Wajib memilih salah satu opsi izin'
      }
      if (!formData.permission_name.trim()) {
        newErrors.permission_name = 'Nama pemberi izin harus diisi'
      }
      if (!formData.permission_phone.trim()) {
        newErrors.permission_phone = 'Nomor HP pemberi izin harus diisi'
      }
      if (formData.permission_phone !== formData.permission_phone_validation) {
        newErrors.permission_phone_validation = 'Validasi nomor HP tidak cocok'
      }
      if (!formData.chosen_juz) {
        newErrors.chosen_juz = 'Pilih salah satu pilihan juz'
      }
      if (!formData.no_travel_plans) {
        newErrors.no_travel_plans = 'Wajib menyetujui tidak ada rencana safar'
      }
      if (!formData.motivation.trim()) {
        newErrors.motivation = 'Motivasi harus diisi'
      }
      if (!formData.ready_for_team) {
        newErrors.ready_for_team = 'Pilih salah satu opsi'
      }
    }

    if (section === 3) {
      // Validasi hanya field akad waktu
      if (!formData.main_time_slot) {
        newErrors.main_time_slot = 'Pilih waktu utama'
      }
      if (!formData.backup_time_slot) {
        newErrors.backup_time_slot = 'Pilih waktu cadangan'
      }
      if (!formData.time_commitment) {
        newErrors.time_commitment = 'Wajib menyetujui komitmen waktu'
      }
    }

    if (section === 4) {
      if (!formData.understands_program) {
        newErrors.understands_program = 'Wajib memahami program'
      }
    }

    setErrors(newErrors)

    // Auto-scroll to first error field with improved cross-platform behavior
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0]
      const element = document.getElementById(firstErrorField)

      if (element) {
        // Add a small delay to ensure DOM is updated
        setTimeout(() => {
          // Try different scroll methods for better cross-platform compatibility
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          })

          // Fallback for browsers that don't support smooth scroll
          const fallbackScroll = () => {
            const rect = element.getBoundingClientRect()
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop
            const targetY = scrollTop + rect.top - (window.innerHeight / 2) + (rect.height / 2)

            window.scrollTo({
              top: targetY,
              behavior: 'smooth'
            })
          }

          // If smooth scroll didn't work after 500ms, use fallback
          setTimeout(fallbackScroll, 500)

          // Try to focus the element or its first input
          const focusableElement = element.querySelector('input, button, select, textarea') as HTMLElement | null
          const elToFocus = focusableElement || element as HTMLElement
          if (elToFocus && typeof elToFocus.focus === 'function') {
            elToFocus.focus()
          }
        }, 100)
      }
    }

    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateSection(currentSection)) {
      if (currentSection < totalSections) {
        setCurrentSection(currentSection + 1)
        // Smooth scroll to form container with cross-platform compatibility
        setTimeout(() => {
          const formElement = document.getElementById('registration-form')
          if (formElement) {
            // Use multiple methods for better cross-platform compatibility
            formElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
              inline: 'nearest'
            })

            // Fallback for older browsers
            window.scrollTo({
              top: 0,
              behavior: 'smooth'
            })
          }
        }, 100)
      }
    }
  }

  const handlePrevious = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1)
      // Smooth scroll to form container with cross-platform compatibility
      setTimeout(() => {
        const formElement = document.getElementById('registration-form')
        if (formElement) {
          // Use multiple methods for better cross-platform compatibility
          formElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          })

          // Fallback for older browsers
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          })
        }
      }, 100)
    }
  }

  const handleSubmit = async (retryCount = 0) => {
    const maxRetries = 3

    // Validate all sections before submission
    for (let i = 1; i <= 4; i++) {
      if (!validateSection(i)) {
        // Scroll to the first section that has errors
        setCurrentSection(i)
        return
      }
    }

    // Declare authUser at higher scope
    let authUser: any;
    let finalSession: any;

    // Robust authentication validation using multiple sources
    try {
      console.log('Starting robust auth validation...');

      // Method 1: Get current session directly from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('No session found:', sessionError);
        setSubmitStatus('error')
        alert('Session tidak valid. Silakan login kembali.')
        router.push('/login')
        return
      }

      console.log('Session found:', session.user.id, session.user.email);
      finalSession = session;

      // Method 2: Validate session is not expired
      const now = Date.now();
      const expiresAt = session.expires_at! * 1000;
      const timeUntilExpiry = expiresAt - now;
      const isExpired = timeUntilExpiry <= 0;

      if (isExpired) {
        console.log('Session expired, attempting refresh...');
        // Try to refresh the session
        const { error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          console.error('Session refresh failed:', refreshError);
          setSubmitStatus('error')
          alert('Session telah berakhir. Silakan login kembali.')
          router.push('/login')
          return
        }

        // Get refreshed session
        const { data: { session: refreshedSession } } = await supabase.auth.getSession();
        if (!refreshedSession) {
          setSubmitStatus('error')
          alert('Gagal memperbarui session. Silakan login kembali.')
          router.push('/login')
          return
        }

        console.log('Session refreshed successfully');
        finalSession = refreshedSession;
      }

      // Method 3: Get user data from AuthContext as backup
      authUser = user;

      // Method 4: If AuthContext user is missing, get from session directly
      if (!authUser?.id || !authUser?.email) {
        console.log('AuthContext user missing, getting from session...');
        // Create a compatible user object from session user
        authUser = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name ||
                     session.user.user_metadata?.name ||
                     session.user.email?.split('@')[0] || '',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          avatar_url: session.user.user_metadata?.avatar_url,
          role: 'calon_thalibah'
        } as any;
      }

      // Method 5: Final validation using getUser API
      if (!authUser?.id || !authUser?.email) {
        console.log('Getting user via getUser API...');
        const { data: { user: apiUser }, error: userError } = await supabase.auth.getUser();

        if (userError || !apiUser) {
          console.error('Failed to get user from API:', userError);
          setSubmitStatus('error')
          alert('Data user tidak valid. Silakan login kembali.')
          router.push('/login')
          return
        }

        // Create compatible user object from API user
        authUser = {
          id: apiUser.id,
          email: apiUser.email || '',
          full_name: apiUser.user_metadata?.full_name ||
                     apiUser.user_metadata?.name ||
                     apiUser.email?.split('@')[0],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          avatar_url: apiUser.user_metadata?.avatar_url,
          role: 'calon_thalibah'
        } as any;
      }

      // Final validation
      if (!authUser?.id || !authUser?.email) {
        console.error('User validation failed:', {
          hasId: !!authUser?.id,
          hasEmail: !!authUser?.email,
          userId: authUser?.id,
          userEmail: authUser?.email
        });

        setSubmitStatus('error')
        alert('Data user tidak lengkap. Silakan login kembali.')
        router.push('/login')
        return
      }

      console.log('Auth validation passed for user:', authUser.email);

    } catch (sessionError) {
      console.error('Auth validation failed:', sessionError);
      setSubmitStatus('error');
      alert('Terjadi kesalahan autentikasi. Silakan login kembali.');
      router.push('/login');
      return;
    }

    // Check network connectivity
    if (!navigator.onLine) {
      setSubmitStatus('error');
      alert('Tidak ada koneksi internet. Silakan periksa koneksi Ukhti dan coba lagi.')
      return
    }

    setIsSubmitting(true)
    try {
      // Re-get session to ensure we have the latest data
      // For mobile, refresh session to prevent expiration issues
      let currentSession = null;

      // First, check if we have a valid session
      const { data: { session: initialSession } } = await supabase.auth.getSession();

      if (initialSession?.user) {
        // Check if session is expired or close to expiry
        const now = new Date();
        const expiresAt = new Date(initialSession.expires_at! * 1000);
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        const fiveMinutes = 5 * 60 * 1000;

        // If session expires within 5 minutes, refresh it
        if (timeUntilExpiry < fiveMinutes) {
          console.log('Session expires soon, refreshing...');
          const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
          currentSession = refreshedSession || initialSession;
        } else {
          currentSession = initialSession;
        }
      } else {
        // No session, try to get from user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('No session but user exists, checking session state...');
          // For mobile users, the session might be in an inconsistent state
          // Try to refresh
          const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
          currentSession = refreshedSession;
        }
      }

      // Also fetch user profile data to get complete information
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser?.id || currentSession?.user?.id)
        .single();

      const currentUser: any = {
        id: authUser?.id || currentSession?.user?.id || '',
        email: authUser?.email || currentSession?.user?.email || '',
        full_name: authUser?.full_name ||
                   currentSession?.user?.user_metadata?.full_name ||
                   currentSession?.user?.user_metadata?.name ||
                   currentSession?.user?.email?.split('@')[0] || '',
        // Additional profile data - safely spread if userProfile exists
        ...(userProfile || {})
      };

      console.log('Final user for submission:', currentUser);

      // CRITICAL: Ensure user exists in database before submitting form
      // This prevents foreign key constraint violations
      console.log('Ensuring user exists before form submission...')
      try {
        const ensureResponse = await fetch('/api/auth/ensure-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Include cookies for authentication
          body: JSON.stringify({
            userId: currentUser.id,
            email: currentUser.email,
            full_name: currentUser.full_name,
            provider: finalSession?.user?.app_metadata?.provider ||
                     finalSession?.user?.user_metadata?.provider || 'email'
          })
        })

        if (!ensureResponse.ok) {
          console.error('Failed to ensure user exists:', await ensureResponse.text())
        } else {
          console.log('User ensured successfully')
        }
      } catch (ensureError) {
        console.error('Error ensuring user:', ensureError)
        // Continue anyway - user might already exist
      }

      // Check if we have batch info
      if (!batchInfo) {
        setSubmitStatus('error')
        console.error('Batch info not available:', {
          batchInfo,
          isClient,
          navigatorOnline: navigator.onLine
        })
        alert('Informasi batch tidak tersedia. Mohon tunggu beberapa saat hingga data teruat dan refresh halaman.')
        return
      }

      // Get provider from session metadata
      const provider = finalSession?.user?.app_metadata?.provider ||
                     finalSession?.user?.user_metadata?.provider || 'email'

      // Prepare data for database
      const submissionData: any = {
        user_id: currentUser.id,
        email: currentUser.email, // Add email field for ensure-user API
        provider: provider, // Add provider field for ensure-user API
        full_name: currentUser.full_name,
        batch_id: batchInfo.batch_id,
        program_id: batchInfo.program_id,

        // Section 1 - Komitmen & Pemahaman
        understands_commitment: formData.understands_commitment,
        tried_simulation: formData.tried_simulation,
        no_negotiation: formData.no_negotiation,
        has_telegram: formData.has_telegram,
        saved_contact: formData.saved_contact,

        // Section 2 - Permission & Program Choice
        has_permission: formData.has_permission,
        permission_name: formData.permission_name,
        permission_phone: formData.permission_phone,
        chosen_juz: formData.chosen_juz,
        no_travel_plans: formData.no_travel_plans,
        motivation: formData.motivation,
        ready_for_team: formData.ready_for_team,

        // Section 3 - Time slots
        main_time_slot: formData.main_time_slot,
        backup_time_slot: formData.backup_time_slot,
        time_commitment: formData.time_commitment,

        // Section 4 - Program Understanding
        understands_program: formData.understands_program,

        // Personal Data from profile
        birth_date: currentUser.tanggal_lahir || null,
        age: currentUser.tanggal_lahir ? Math.floor((new Date().getTime() - new Date(currentUser.tanggal_lahir).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        domicile: `${currentUser.kota}, ${currentUser.provinsi || ''}`,
        address: currentUser.alamat || null,
        wa_phone: currentUser.whatsapp || null,
        telegram_phone: currentUser.telegram || null,
        timezone: currentUser.zona_waktu || 'WIB',

        // Batch info
        batch_name: batchInfo.batch_name,

        // Status
        status: 'pending',
        selection_status: 'pending',
        submission_date: new Date().toISOString()
      }

      // Only add questions if not empty
      if (formData.questions && formData.questions.trim() !== '') {
        submissionData.questions = formData.questions
      }

      console.log('Submitting form with data:', submissionData)

      // Submit to API with timeout and retry mechanism
      // Longer timeout for mobile devices with slower connections
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const timeout = isMobile ? 60000 : 30000 // 60s for mobile, 30s for desktop

      console.log(`Submitting with timeout: ${timeout}ms (Mobile: ${isMobile})`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      // Check if this is an edit or create operation
      let apiUrl = '/api/pendaftaran/submit'
      let apiMethod = 'POST'

      if (isEditMode && existingRegistration) {
        apiUrl = `/api/pendaftaran/${existingRegistration.id}`
        apiMethod = 'PUT'
      }

      // Get current session for Authorization header
      const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !authSession?.access_token) {
        throw new Error('Authentication token not available. Please login again.');
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authSession.access_token}`, // Send token as Bearer
      };

      // Add CSRF token if available for production security
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
        console.log('CSRF token added to headers:', csrfToken.substring(0, 20) + '...');
      } else {
        console.warn('CSRF token not available, attempting to refresh...');
        await refreshCSRFToken();
        // Try to get the token from cookie after refresh
        const cookieToken = document.cookie.split('; ').find(c => c.startsWith('csrf-token='))?.split('=')[1];
        if (cookieToken) {
          headers['x-csrf-token'] = cookieToken;
          console.log('CSRF token retrieved from cookie:', cookieToken.substring(0, 20) + '...');
        } else {
          console.error('Failed to get CSRF token from cookie. Available cookies:', document.cookie);
        }
      }

      const response = await fetch(apiUrl, {
        method: apiMethod,
        headers: headers,
        credentials: 'include', // Include cookies for authentication as fallback
        body: JSON.stringify(submissionData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const result = await response.json()
      console.log('Server response:', result)

      if (!response.ok) {
        // Handle CSRF token validation error (403 Forbidden)
        if (response.status === 403 && result.error?.includes('CSRF')) {
          console.error('CSRF token validation failed, refreshing token...');
          // Refresh CSRF token and retry once
          if (retryCount === 0) {
            await refreshCSRFToken();
            console.log('CSRF token refreshed, retrying submission...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return handleSubmit(retryCount + 1);
          }
          throw new Error('Token keamanan tidak valid. Silakan refresh halaman dan coba lagi.');
        }

        // Check if it's a network error that can be retried
        if (retryCount < maxRetries && (response.status >= 500 || !navigator.onLine)) {
          console.log(`Retrying submit attempt ${retryCount + 1} of ${maxRetries}`)
          await new Promise(resolve => setTimeout(resolve, 3000 * (retryCount + 1))) // Wait longer each retry
          return handleSubmit(retryCount + 1)
        }
        throw new Error(result.error || 'Failed to submit registration')
      }

      setSubmitStatus('success')

      // Clear saved form state after successful submission
      localStorage.removeItem('tikrar_form_state')
      console.log('Form state cleared after successful submission')

      // Don't auto-redirect - let user read the success message and click button to navigate
    } catch (error: any) {
      console.error('Submit error:', error)
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })

      // Handle specific error types
      if (error.name === 'AbortError') {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        const message = isMobile
          ? 'Koneksi terlalu lambat (lebih dari 60 detik). Pastikan sinyal internet Ukhti stabil dan coba lagi.'
          : 'Koneksi terlalu lambat. Silakan coba lagi dengan koneksi internet yang lebih stabil.'
        alert(message)
        setSubmitStatus('error')
      } else if (error.name === 'TypeError' && retryCount < maxRetries) {
        // Network error, retry
        console.log(`Network error, retrying attempt ${retryCount + 1} of ${maxRetries}`)
        await new Promise(resolve => setTimeout(resolve, 3000 * (retryCount + 1)))
        return handleSubmit(retryCount + 1)
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui'

        // Check if it's a foreign key violation error
        if (typeof errorMsg === 'string' && errorMsg.includes('foreign key constraint')) {
          alert(`Gagal mengirim formulir: Error autentikasi user.

Solusi:
1. Logout dari akun Ukhti
2. Login kembali
3. Coba kirim formulir lagi
4. Jika masih gagal, hubungi admin WhatsApp 08567712914`)
        } else if (typeof errorMsg === 'string' && errorMsg.includes('FOREIGN_KEY_VIOLATION')) {
          alert(`Gagal mengirim formulir: Error autentikasi user.

Solusi:
1. Logout dari akun Ukhti
2. Login kembali
3. Coba kirim formulir lagi
4. Jika masih gagal, hubungi admin WhatsApp 08567712914`)
        } else {
          alert(`Gagal mengirim formulir: ${errorMsg}.

Silakan:
1. Pastikan koneksi internet stabil
2. Coba refresh halaman
3. Atau hubungi admin jika masalah berlanjut`)
        }
        setSubmitStatus('error')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderSection1 = () => (
    <div className="space-y-6">
      <Alert className="bg-green-50 border-green-200">
        <Info className="h-5 w-5 text-green-600" />
        <AlertDescription className="text-green-800 text-base">
          <strong>Section 1 of 4</strong> - FORMULIR PENDAFTARAN TIKRAR MTI BATCH 2 (JUZ 1, 28, 29, 30)
        </AlertDescription>
      </Alert>

      <div className="bg-blue-50 p-4 md:p-8 rounded-lg">
        <h3 className="font-bold text-lg md:text-xl mb-4 md:mb-6 text-green-900">Bismillah.. Hayyakillah Ahlan wasahlan kakak-kakak calon hafidzah..</h3>

        <div className="space-y-3 md:space-y-4 text-sm md:text-base text-gray-700">
          <p>📝 Formulir ini adalah formulir pendaftaran untuk kelas hafalan Al-Qur'an {batchInfo?.is_free ? 'gratis' : 'berbayar'} khusus akhawat, menggunakan metode pengulangan (tikrar) sebanyak 40 kali.</p>
          <p>📆 Durasi program: InsyaAllah selama {Math.ceil((batchInfo?.duration_weeks || 16) / 4)} Bulan ({batchInfo?.duration_weeks || 16} Pekan) dimulai dari tanggal {batchInfo ? new Date(batchInfo.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '5 Januari 2026'} untuk target hafalan 1/2 juz.</p>
          {batchInfo && (
            <p>💰 Biaya program: {batchInfo.is_free ? 'GRATIS' : `Rp ${batchInfo.price.toLocaleString('id-ID')}/bulan`}</p>
          )}

          {batchInfo && (
            <div className="mt-3 md:mt-4 p-3 md:p-4 bg-green-50 rounded-lg">
              <p className="font-semibold text-green-800 mb-2 md:mb-3 text-sm md:text-base">Struktur Program {batchInfo.batch_name}:</p>
              <div className="text-xs md:text-sm text-green-700 space-y-1 md:space-y-2">
                <p>📅 <strong>Pekan 1:</strong> Tashih dan Orientasi</p>
                <p>📖 <strong>Pekan 2-{batchInfo.duration_weeks - 2}:</strong> Ziyadah (Pertambahan Hafalan)</p>
                <p>📚 <strong>Pekan {batchInfo.duration_weeks - 1}:</strong> Muroja'ah</p>
                <p>✅ <strong>Pekan {batchInfo.duration_weeks}:</strong> Ujian Akhir</p>
                <p>🕌 <strong>Tanggal Mulai:</strong> {new Date(batchInfo.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p>🎯 <strong>Tanggal Selesai:</strong> {new Date(batchInfo.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          )}

          <p>🎯 Target hafalan harian: 1 halaman perpekan (1/4 halaman per hari, 4 hari dalam sepekan)</p>

          <div className="mt-3 md:mt-4 p-3 md:p-4 bg-blue-50 rounded-lg">
            <p className="font-semibold text-blue-800 mb-2 md:mb-3 text-sm md:text-base">Kewajiban Program:</p>
            <div className="text-xs md:text-sm text-blue-700 space-y-1 md:space-y-2">
              <p>✅ Tashih wajib sekali sepekan untuk kurikulum ziyadah pekan depan, jadwal menyesuaikan</p>
              <p>✅ Ujian wajib sekali sepekan untuk kurikulum selesai ziyadah pekanan, jadwal menyesuaikan</p>
              <p>✅ Setoran 40X boleh memilih mau bersama pasangan atau tidak (yang memilih tidak berpasangan hanya untuk yang bacaan sudah benar-benar mutqin)</p>
              <p>✅ Jadwal setoran pasangan boleh pilih opsi yang sudah ditentukan, akan kami carikan pasangan setoran semaksimal mungkin yang sama waktu dan zona waktu</p>
            </div>
          </div>

          <div className="mt-3 md:mt-4 p-3 md:p-5 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="font-semibold text-yellow-800 mb-2 md:mb-3 flex items-center text-sm md:text-base">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              ⚠️ Peringatan Penting
            </p>
            <div className="text-yellow-700 text-xs md:text-sm space-y-2 md:space-y-3">
              <p>Bagi kakak-kakak yang sibuk, banyak kelas, ga bisa atur waktu dengan pasangan silahkan pilih program tanpa pasangan.</p>
              <p><strong>Jika Ukhti dinyatakan lolos seleksi administrasi dan tes bacaan, dan sudah daftar ulang, kami tidak meridhoi Ukhti keluar dari program tanpa udzur syar'i.</strong> Alasan seperti "sibuk", "ada kerjaan", atau "ikut kelas lain" tidak kami terima.</p>

              <p className="mt-2 font-semibold">✅ Alasan yang DITERIMA untuk mundur dari program:</p>
              <ul className="ml-4 space-y-1">
                <li>• Qadarullah, diri sendiri/orang tua/mertua/suami/anak sakit dan butuh perawatan intensif</li>
                <li>• Qadarullah, hamil muda dan mengalami ngidam atau mual berat yang menyulitkan untuk mengikuti program</li>
                <li>• Qadarullah, terjadi bencana alam yang menghambat kelanjutan program</li>
                <li>• Udzur lain yang darurat, mendesak, dan tidak terduga, yang dapat kami maklumi</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-4 bg-purple-50 rounded-lg">
            <p className="font-semibold text-purple-800 mb-3 text-base">👨‍👩‍👧 Izin Keluarga/Wali</p>
            <p className="text-sm text-purple-700">
              Untuk mengikuti program ini, wajib mendapatkan izin dari suami, orang tua, majikan, atau wali, karena waktu Ukhti akan lebih banyak digunakan untuk menghafal. Jika sewaktu-waktu mereka mencabut izinnya, merekalah yang harus menghubungi pihak MTI untuk menyampaikan permohonan pengunduran diri.
            </p>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="font-semibold text-gray-800 mb-3 text-base">⚙️ Tentang Program</p>
            <p className="text-sm text-gray-700">
              Seluruh aturan kami susun demi kebaikan dan kelancaran program ini, bukan untuk mempersulit siapapun. Kami ingin menciptakan lingkungan yang serius dan kondusif bagi para penghafal Qur'an.
            </p>
          </div>

          <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
            <p className="font-semibold text-indigo-800 mb-3 text-base">⏳ Komitmen Waktu</p>
            <p className="text-sm text-indigo-700">
              Program ini membutuhkan komitmen waktu minimal 2 jam per hari membersamai Al Quran. Jika Ukhti memiliki jadwal yang padat, banyak tanggungan, atau merasa tidak bisa konsisten, kami sarankan untuk tidak mendaftar dulu. Tujuan kami adalah agar program ini berjalan dengan zero dropout dan zero blacklist.
            </p>
          </div>

          <div className="mt-4 p-4 bg-teal-50 rounded-lg">
            <p className="font-semibold text-teal-800 mb-3 text-base">💡 Tentang Metode</p>
            <p className="text-sm text-teal-700">
              Metode Tikrar MTI kami rancang berdasarkan pengalaman para ibu yang mengajar dan belajar Al-Qur'an di tengah rutinitas rumah tangga. Metode ini cocok untuk emak-emak yang menghafal di rumah sambil mencuci, masak, mengurus anak dan suami.
            </p>
          </div>

          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="font-semibold text-red-800 mb-3 text-base">🚫 Tidak cocok untuk:</p>
            <div className="text-sm text-red-700 space-y-2">
              <p>• Tholibah yang bekerja full-time dan hanya memiliki waktu malam untuk keluarga</p>
              <p>• Mu'allimah yang sudah mutqin tapi tidak bisa menyelesaikan program karena kesibukan mengajar, belajar atau kesibukan pribadi</p>
            </div>
            <p className="text-sm text-red-600 mt-3">
              Namun, jika ingin mengadopsi metode ini untuk diterapkan di halaqah masing-masing, silakan. Metode ini bebas dipakai, dimodifikasi, dan disebarluaskan.
            </p>
          </div>

          <div className="mt-4 p-4 bg-orange-50 rounded-lg">
            <p className="font-semibold text-orange-800 mb-3 text-base">🧪 Simulasi Sebelum Daftar</p>
            <div className="text-sm text-orange-700 space-y-3">
              <p>Karena metode pengulangan 40 kali bisa terasa berat, lama, dan membosankan, kami mensyaratkan calon peserta untuk mencoba simulasi:</p>
              <p>📖 Bacalah Surah An-Naba' ayat 1–11 sebanyak 40 kali.</p>
              <p><strong>Jika merasa sanggup, silakan lanjut mengisi formulir. Jika tidak, sebaiknya undur diri dari sekarang.</strong></p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-rose-50 rounded-lg border border-rose-200">
            <p className="font-semibold text-rose-800 mb-3 text-base">🚩 Peringatan Serius</p>
            <div className="text-sm text-rose-700 space-y-3">
              <p>Kami tidak ridho jika Ukhti submit formulir pendaftaran ini hanya untuk iseng atau kepo saja, karena hanya merepotkan proses seleksi. Jika hanya ingin kepo saja silahkan langsung japri, kami dengan senang hati share metode Tikrar kepada Ukhti.</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
            <p className="font-semibold text-emerald-800 mb-3 text-base">🎯 Tujuan Program</p>
            <div className="text-sm text-emerald-700 space-y-3">
              <p>Kami tidak mengejar kuantitas peserta, tetapi lebih fokus pada tholibah yang ikhlas, istiqamah, dan bersungguh-sungguh untuk menghafal dan menebar manfaat. Bagi yang masih banyak agenda dan belum bisa konsisten, lebih baik menunggu angkatan berikutnya.</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="font-semibold text-slate-800 mb-3 text-base">⚠️ Program Blacklist</p>
            <div className="text-sm text-slate-700 space-y-3">
              <p>Program ini menerapkan sistem Blacklist permanen bagi peserta yang mundur di tengah jalan tanpa alasan yang dapat kami terima, demi menjaga hak pasangan setoran dan stabilitas Nasional Markaz Tikrar Indonesia.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-5 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
        <p className="text-center text-base text-green-800 font-medium mb-3">
          🤝 Komitmen & Etika
        </p>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• Program ini melibatkan banyak pihak dan pasangan setoran. Kami berusaha menyesuaikan jadwal dengan pilihan Ukhti sendiri.</p>
          <p>• Harap menjaga komitmen, tidak banyak mengeluh, dan tidak mementingkan diri sendiri</p>
          <p>• Jaga adab kepada seluruh tim Tikrar MTI dan pasangan setoran masing-masing</p>
          <p>• Keputusan kelulusan tes administrasi dan bacaan bersifat final dan tidak dapat diganggu gugat</p>
          <p>• Program ini baru dimulai dan gratis, kami akui masih banyak kekurangan/ketidaksempurnaan di sana-sini, kami berusaha melakukan semaksimal mungkin energi kami untuk program ini.</p>
          <p>• Kami tidak melayani tuntutan professionalisme berlebih atau kesempurnaan seakan kami menjual jasa dengan harga tinggi.</p>
          <p>• MTI adalah rumah bagi kita, yang anggotanya adalah keluarga bagaikan ibu dengan anak, kakak dengan adik, yang saling melengkapi kelemahan dan kekurangan masing-masing untuk kebaikan denqan target berkumpul di Jannah Firdaus Al-'Ala. (No Baper, No Drama).</p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800">
            Apakah Ukhti  sudah faham dengan semua poin di atas dan bersedia menerima segala komitmen?
            <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            id="understands_commitment"
            value={formData.understands_commitment ? "yes" : "no"}
            onValueChange={(value) => handleInputChange('understands_commitment', value === "yes")}
            className="space-y-2"
          >
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer">
              <RadioGroupItem value="yes" id="understands_commitment_yes" className="mt-0.5 w-4 h-4" />
              <Label htmlFor="understands_commitment_yes" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah ana sudah dengar dan sudah paham dan insyaAllah ikhlas menerima segala komitmen dan berusaha menjalankannya semaksimal mungkin.
              </Label>
            </div>
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-red-50 transition-all duration-200 cursor-pointer">
              <RadioGroupItem value="no" id="understands_commitment_no" className="mt-0.5 w-4 h-4" />
              <Label htmlFor="understands_commitment_no" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Belum, saya perlu waktu untuk mempertimbangkan kembali.
              </Label>
            </div>
          </RadioGroup>
          {errors.understands_commitment && (
            <p className="text-red-500 text-sm font-medium">{errors.understands_commitment}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800">
            Apakah Ukhti sudah mencoba simulasi mengulang membaca Surat An-Naba' ayat 1-11 sebanyak 40X
            (Jika belum silahkan coba dulu, sebelum melanjutkan)
            <span className="text-red-500">*</span>
          </Label>
          <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
            <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Peringatan Penting:</p>
            <p className="text-sm text-yellow-700">
              Kami tidak melayani calon tolibah yang nego-nego jumlah tikrar, walaupun Ukhti hanya ingin murojaah/sudah pernah hafal. Jika tetap ingin menjadi keluarga MTI silahkan japri kak Mara untuk mendaftar jadi mu'allimah, akan ada kelas Tikrar mu'allimah yang bebas tanpa akad.
            </p>
          </div>
          <RadioGroup
            id="tried_simulation"
            value={formData.tried_simulation ? "yes" : "no"}
            onValueChange={(value) => handleInputChange('tried_simulation', value === "yes")}
            className="space-y-2"
          >
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer">
              <RadioGroupItem value="yes" id="tried_simulation_yes" className="mt-0.5 w-4 h-4" />
              <Label htmlFor="tried_simulation_yes" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah sudah dan saya berjanji ga akan nego-nego jumlah tikrar
              </Label>
            </div>
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-red-50 transition-all duration-200 cursor-pointer">
              <RadioGroupItem value="no" id="tried_simulation_no" className="mt-0.5 w-4 h-4" />
              <Label htmlFor="tried_simulation_no" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Belum, saya akan mencoba terlebih dahulu.
              </Label>
            </div>
          </RadioGroup>
          {errors.tried_simulation && (
            <p className="text-red-500 text-sm font-medium">{errors.tried_simulation}</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
            <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Peringatan Penting:</p>
            <p className="text-sm text-yellow-700">
              Kami tidak melayani calon tolibah yang nego-nego jumlah tikrar, walaupun Ukhti hanya ingin muroja'ah/sudah pernah hafal. Jika tetap ingin menjadi keluarga MTI silahkan japri kak Mara untuk mendaftar jadi mu'allimah, akan ada kelas Tikrar mu'allimah yang bebas tanpa akad.
            </p>
          </div>
          <RadioGroup
            id="no_negotiation"
            value={formData.no_negotiation ? "yes" : "no"}
            onValueChange={(value) => handleInputChange('no_negotiation', value === "yes")}
            className="space-y-2"
          >
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer">
              <RadioGroupItem value="yes" id="no_negotiation_yes" className="mt-0.5 w-4 h-4" />
              <Label htmlFor="no_negotiation_yes" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah sudah dan saya berjanji ga akan nego-nego jumlah tikrar
              </Label>
            </div>
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-red-50 transition-all duration-200 cursor-pointer">
              <RadioGroupItem value="no" id="no_negotiation_no" className="mt-0.5 w-4 h-4" />
              <Label htmlFor="no_negotiation_no" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Saya masih perlu pertimbangan.
              </Label>
            </div>
          </RadioGroup>
          {errors.no_negotiation && (
            <p className="text-red-500 text-sm font-medium">{errors.no_negotiation}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800">
            Apakah Ukhti sudah faham jika program ini juga mewajibkan tholibah untuk mempunyai aplikasi telegram untuk proses seleksi?
          </Label>
          <p className="text-sm text-gray-500 italic">
            Mohon maaf kami tidak akan mengecek VN seleksi yang dikirim lewat whatsapp karena keterbatasan memori hp admin.
          </p>
          <RadioGroup
            id="has_telegram"
            value={formData.has_telegram ? "yes" : ""}
            onValueChange={(value) => handleInputChange('has_telegram', value === "yes")}
            className="space-y-2"
          >
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer">
              <RadioGroupItem value="yes" id="has_telegram_yes" className="mt-0.5 w-4 h-4" />
              <Label htmlFor="has_telegram_yes" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah saya sudah download telegram di hp saya
              </Label>
            </div>
          </RadioGroup>
          {errors.has_telegram && (
            <p className="text-red-500 text-sm font-medium">{errors.has_telegram}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800">
            Apakah Ukhti sudah simpan nomor Whatsapp Kak Mara 081313650842? Yang akan di-add ke grup hanya yang bisa langsung kak Mara add saja.. kami tidak akan mengirimkan invitation link bagi yang tidak bisa di-add karena tidak mau save nomor admin.
            <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            id="saved_contact"
            value={formData.saved_contact ? "yes" : ""}
            onValueChange={(value) => handleInputChange('saved_contact', value === "yes")}
            className="space-y-2"
          >
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer">
              <RadioGroupItem value="yes" id="saved_contact_yes" className="mt-0.5 w-4 h-4" />
              <Label htmlFor="saved_contact_yes" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah saya sudah simpan nomor hp Kak Mara
              </Label>
            </div>
          </RadioGroup>
          {errors.saved_contact && (
            <p className="text-red-500 text-sm font-medium">{errors.saved_contact}</p>
          )}
        </div>

        </div>
    </div>
  )

  const renderSection2 = () => (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-blue-800 text-base">
          <strong>Section 2 of 4</strong> - Izin & Pilihan Program
        </AlertDescription>
      </Alert>

      <div className="space-y-8">
        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800">
            Apakah Ukhti sudah meminta izin kepada suami/ orang tua/majikan/wali yang bertanggung jawab atas diri Ukhti?
            <span className="text-red-500">*</span>
          </Label>
          <p className="text-sm text-gray-500 italic">
            (Jika belum, silahkan minta izin terlebih dahulu. Jika tidak diizinkan, mohon bersabar dan berdoa kepada Allah semoga Allah mudahkan pada angkatan selanjutnya)
          </p>
          <RadioGroup
            id="has_permission"
            value={formData.has_permission}
            onValueChange={(value) => handleInputChange('has_permission', value as 'yes' | 'janda' | '')}
            className="space-y-2"
          >
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer">
              <RadioGroupItem value="yes" id="has_permission_yes" className="mt-0.5 w-4 h-4" />
              <Label htmlFor="has_permission_yes" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah sudah (ini jawaban saya sejujur-jujurnya yang akan saya pertanggungjawabkan di akhirat nanti)
              </Label>
            </div>
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer">
              <RadioGroupItem value="janda" id="has_permission_janda" className="mt-0.5 w-4 h-4" />
              <Label htmlFor="has_permission_janda" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Saya seorang janda yang mandiri, tidak terikat, tidak perlu persetujuan siapapun dan mengikuti program ini tidak akan mempengaruhi siapapun.
              </Label>
            </div>
          </RadioGroup>
          {errors.has_permission && (
            <p className="text-red-500 text-sm font-medium">{errors.has_permission}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="permission_name" className="text-base font-semibold text-gray-800">
              {formData.has_permission === 'janda'
                ? "Nama lengkap Ukhti (sebagai penanggung jawab diri sendiri)"
                : "Nama suami/ orang tua/majikan/wali yang bertanggung jawab atas diri Ukhti dan yang sudah memberikan izin Ukhti untuk ikut program ini"
              }
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="permission_name"
              value={formData.permission_name}
              onChange={(e) => handleInputChange('permission_name', e.target.value)}
              placeholder={formData.has_permission === 'janda' ? "Ketik nama lengkap Ukhti" : "Ketik nama pemberi izin sesuai KTP"}
              className="text-base py-3"
              required
            />
            {errors.permission_name && (
              <p className="text-red-500 text-sm font-medium">{errors.permission_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="permission_phone" className="text-base font-semibold text-gray-800">
              {formData.has_permission === 'janda'
                ? "No HP Ukhti yang bisa dihubungi"
                : "No HP suami/ orang tua/majikan/wali yang bertanggung jawab atas diri Ukhti dan yang sudah memberikan izin Ukhti untuk ikut program ini"
              }
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="permission_phone"
              value={formData.permission_phone}
              onChange={(e) => handleInputChange('permission_phone', e.target.value)}
              placeholder={formData.has_permission === 'janda' ? "08xx-xxxx-xxxx (No HP aktif Ukhti)" : "08xx-xxxx-xxxx (No HP pemberi izin)"}
              className="text-base py-3"
              required
            />
            {errors.permission_phone && (
              <p className="text-red-500 text-sm font-medium">{errors.permission_phone}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="permission_phone_validation" className="text-base font-semibold text-gray-800">
            {formData.has_permission === 'janda'
              ? "Validasi No HP Ukhti (ketik ulang untuk memastikan nomor benar)"
              : "Validasi No HP suami/ orang tua/majikan/wali yang bertanggung jawab (ketik ulang untuk memastikan nomor benar)"
            }
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="permission_phone_validation"
            value={formData.permission_phone_validation}
            onChange={(e) => handleInputChange('permission_phone_validation', e.target.value)}
            placeholder="Ketik ulang nomor HP"
            className="text-base py-3"
            required
          />
          {errors.permission_phone_validation && (
            <p className="text-red-500 text-sm font-medium">{errors.permission_phone_validation}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800">Pilihan juz yang akan dihafalkan<span className="text-red-500">*</span></Label>
          <Select value={formData.chosen_juz} onValueChange={(value) => handleInputChange('chosen_juz', value)}>
            <SelectTrigger className="text-base py-3" id="chosen_juz">
              <SelectValue placeholder="Pilih juz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1A">Juz 1A (Halaman 1-11)</SelectItem>
              <SelectItem value="1B">Juz 1B (Halaman 12-21)</SelectItem>
              <SelectItem value="28A">Juz 28A (Halaman 542-551)</SelectItem>
              <SelectItem value="28B">Juz 28B (Halaman 552-561)</SelectItem>
              <SelectItem value="29A">Juz 29A (Halaman 562-571)</SelectItem>
              <SelectItem value="29B">Juz 29B (Halaman 572-581)</SelectItem>
              <SelectItem value="30A">Juz 30A (Halaman 582-591)</SelectItem>
              <SelectItem value="30B">Juz 30B (Halaman 592-604)</SelectItem>
            </SelectContent>
          </Select>
          {errors.chosen_juz && (
            <p className="text-red-500 text-sm font-medium">{errors.chosen_juz}</p>
          )}
        </div>

        {batchInfo && (
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
            <p className="text-sm text-blue-800 font-semibold mb-2">Informasi Program {batchInfo.batch_name}:</p>
            <p className="text-sm text-blue-700">
              Program ini akan insyaAllah biidznillah akan dilaksanakan selama {batchInfo.duration_weeks} pekan dimulai dari tanggal {new Date(batchInfo.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - {new Date(batchInfo.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.
              <strong> Program ini {batchInfo.is_free ? 'GRATIS' : `Rp ${batchInfo.price.toLocaleString('id-ID')}/bulan`}</strong>.
              <br /><br />
              Apabila Ukhti sudah merencanakan atau safar, mudik, umrah atau liburan di luar jadwal liburan MTI, kami sarankan menunda pendaftaran pada angkatan berikutnya. Kami tidak menerima alasan safar yang mendzholimi jadwal pasangan setoran Ukhti.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Apakah Ukhti sudah merencanakan atau safar, mudik, umrah atau liburan di luar jadwal liburan MTI?
            <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            id="no_travel_plans"
            value={formData.no_travel_plans ? "yes" : ""}
            onValueChange={(value) => handleInputChange('no_travel_plans', value === "yes")}
            className="space-y-2"
          >
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <RadioGroupItem value="yes" id="no_travel_plans_yes" className="mt-0.5 w-4 h-4" />
              <Label htmlFor="no_travel_plans_yes" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                InsyaAllah saya tidak ada rencana safar, kalaupun tiba-tiba safar saya akan bertanggungjawab memprioritaskan waktu untuk memenuhi kewajiban setoran kepada pasangan
              </Label>
            </div>
          </RadioGroup>
          {errors.no_travel_plans && (
            <p className="text-red-500 text-xs">{errors.no_travel_plans}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="motivation" className="text-sm font-medium text-gray-700">
            Ketikkan secara singkat apa motivasi terbesar Ukhti untuk menghafal Al-Quran sehingga Ukhti rela mengikuti program ini dan ikhlas menjalankan semua aturan-peraturan dari MTI?
          </Label>
          <Textarea
            id="motivation"
            value={formData.motivation}
            onChange={(e) => handleInputChange('motivation', e.target.value)}
            rows={3}
            placeholder="Jelaskan motivasi Ukhti..."
            className="text-sm"
            required
          />
          {errors.motivation && (
            <p className="text-red-500 text-xs">{errors.motivation}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Apakah Ukhti siap dan bersedia menjadi bagian tim MTI apabila kami anggap sudah layak menjadi khadimat Al-Quran sebagai mu'allimah atau musyrifah untuk turut membantu MTI dalam misi memberantas buta huruf Al-Quran di Indonesia?
            <span className="text-red-500">*</span>
          </Label>
          <RadioGroup id="ready_for_team" value={formData.ready_for_team} onValueChange={(value) => handleInputChange('ready_for_team', value)} className="space-y-2">
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="ready" id="ready" className="mt-0.5 w-4 h-4" />
              <Label htmlFor="ready" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                InsyaAllah siapppp → Jawaban ini kami catat sebagai akad
              </Label>
            </div>
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="infaq" id="infaq" className="mt-0.5 w-4 h-4" />
              <Label htmlFor="infaq" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Afwan saya tidak bisa menjadi tim MTI dikarenakan kesibukan dan komitmen di lembaga lain, sebagai gantinya saya akan infaq sesuai dengan kemampuan saya dan bersedia dimasukkan ke group donatur MTI
              </Label>
            </div>
          </RadioGroup>
          {errors.ready_for_team && (
            <p className="text-red-500 text-xs">{errors.ready_for_team}</p>
          )}
        </div>
      </div>
    </div>
  )

  const renderSection3 = () => (
    <div className="space-y-6">
      <Alert className="bg-purple-50 border-purple-200">
        <Info className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800">
          <strong>Section 3 of 4</strong> - Akad Waktu
        </AlertDescription>
      </Alert>

      {/* Field untuk akad waktu */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Pilih waktu utama untuk jadwal setoran dengan pasangan</Label>
            <Select value={formData.main_time_slot} onValueChange={(value) => handleInputChange('main_time_slot', value)}>
              <SelectTrigger id="main_time_slot">
                <SelectValue placeholder="Pilih waktu utama" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="04-06">04.00 - 06.00 WIB/WITA/WIT</SelectItem>
                <SelectItem value="06-09">06.00 - 09.00 WIB/WITA/WIT</SelectItem>
                <SelectItem value="09-12">09.00 - 12.00 WIB/WITA/WIT</SelectItem>
                <SelectItem value="12-15">12.00 - 15.00 WIB/WITA/WIT</SelectItem>
                <SelectItem value="15-18">15.00 - 18.00 WIB/WITA/WIT</SelectItem>
                <SelectItem value="18-21">18.00 - 21.00 WIB/WITA/WIT</SelectItem>
                <SelectItem value="21-24">21.00 - 24.00 WIB/WITA/WIT</SelectItem>
              </SelectContent>
            </Select>
            {errors.main_time_slot && (
              <p className="text-red-500 text-xs">{errors.main_time_slot}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Pilih waktu cadangan untuk jadwal setoran dengan pasangan</Label>
            <Select value={formData.backup_time_slot} onValueChange={(value) => handleInputChange('backup_time_slot', value)}>
              <SelectTrigger id="backup_time_slot">
                <SelectValue placeholder="Pilih waktu cadangan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="04-06">04.00 - 06.00 WIB/WITA/WIT</SelectItem>
                <SelectItem value="06-09">06.00 - 09.00 WIB/WITA/WIT</SelectItem>
                <SelectItem value="09-12">09.00 - 12.00 WIB/WITA/WIT</SelectItem>
                <SelectItem value="12-15">12.00 - 15.00 WIB/WITA/WIT</SelectItem>
                <SelectItem value="15-18">15.00 - 18.00 WIB/WITA/WIT</SelectItem>
                <SelectItem value="18-21">18.00 - 21.00 WIB/WITA/WIT</SelectItem>
                <SelectItem value="21-24">21.00 - 24.00 WIB/WITA/WIT</SelectItem>
              </SelectContent>
            </Select>
            {errors.backup_time_slot && (
              <p className="text-red-500 text-xs">{errors.backup_time_slot}</p>
            )}
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="time_commitment"
              checked={formData.time_commitment}
              onCheckedChange={(checked) => handleInputChange('time_commitment', checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="time_commitment" className="text-sm font-medium text-gray-700">
                Akad waktu
              </Label>
              <p className="text-xs text-gray-500 italic">
                Saya sudah memilih jadwal waktu utama dan cadangan dengan mempertimbangkan jadwal harian dan kegiatan saya.
                Saya terima ini sebagai akad yang akan saya pertanggungjawabkan di hadapan Allah apabila saya mendzolimi waktu pasangan setoran saya dengan alasan-alasan yang tidak urgen.
              </p>
              {errors.time_commitment && (
                <p className="text-red-500 text-xs">{errors.time_commitment}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSection4 = () => (
    <div className="space-y-6">
      <Alert className="bg-orange-50 border-orange-200">
        <Info className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Section 4 of 4</strong> - Program Tikrar MTI
        </AlertDescription>
      </Alert>

      <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
        <h3 className="font-bold text-lg mb-4 text-green-900">📚 Program Hafalan Al-Qur'an MTI (Metode Tikrar 40 Kali)</h3>

        <div className="space-y-4 text-sm text-gray-700">
          {batchInfo && (
            <div>
              <p><strong>🗓 Durasi Program:</strong> Program ini insyaAllah biidznillah akan berlangsung selama {batchInfo.duration_weeks} pekan, dimulai dari {new Date(batchInfo.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} hingga {new Date(batchInfo.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.
              <strong> Program ini {batchInfo.is_free ? 'GRATIS' : `Rp ${batchInfo.price.toLocaleString('id-ID')}/bulan`}</strong>
              </p>
            </div>
          )}

          <div>
            <p><strong>🎯 Target dan Struktur Program:</strong></p>
            <ul className="ml-4 mt-2 space-y-1">
              <li>• Target hafalan: 1 halaman per pekan, dibagi menjadi 4 blok (¼ halaman per hari)</li>
              <li>• Setoran ziyadah (penambahan hafalan): hanya dilakukan 4 hari per pekan</li>
            </ul>
          </div>

          <div>
            <p><strong>📌 Kewajiban Mingguan:</strong></p>
            <ul className="ml-4 mt-2 space-y-1">
              <li>• Mendengarkan atau membaca tafsir 1 halaman hafalan</li>
              <li>• Menulis tangan 1 halaman yang dihafalkan pekan tersebut</li>
              <li>• Mengikuti 2 kelas pertemuan bersama mu'allimah:</li>
              <li>  - Kelas Tashih</li>
              <li>  - Kelas Ujian (Jadwal menyusul)</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-100 rounded-lg">
            <p className="font-semibold text-yellow-800 mb-2">📌 Kewajiban Harian Saat Ziyadah (Penambahan Hafalan)</p>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Mendengarkan murottal ¼ halaman minimal 3 kali</li>
              <li>• Membaca ¼ halaman sebanyak 40 kali</li>
              <li>• Merekam hafalan ¼ halaman sebanyak 3 kali berturut-turut, lalu dengarkan sambil melihat mushaf</li>
              <li>➤ Jika masih ada kesalahan, ulangi proses ini sampai bacaan benar-benar sempurna</li>
            </ul>
          </div>

          <div>
            <p><strong>👥 Setoran kepada Pasangan:</strong></p>
            <ul className="ml-4 mt-2 space-y-1">
              <li>• Menyetorkan hafalan ¼ halaman sebanyak 40 kali</li>
              <li>• Menyimak hafalan pasangan sebanyak 40 kali</li>
            </ul>
          </div>

          <div>
            <p><strong>🔄 Rabth (Penguatan Hafalan):</strong></p>
            <p className="ml-4">Jika sudah menambah hafalan, wajib menyetorkan 10 blok hafalan sebelumnya (10 hari terakhir) sebelum memulai setoran 40 kali untuk hafalan baru (ziyadah).</p>
          </div>

          <div>
            <p><strong>🔁 Ulangan Ziyadah Sebelumnya:</strong></p>
            <p className="ml-4">Menyetorkan hafalan ziyadah dari hari sebelumnya sebanyak 5 kali.</p>
          </div>

          <div>
            <p><strong>☎️ Ketentuan Teknis Setoran:</strong></p>
            <p className="ml-4">Jika tidak memungkinkan menyetor secara langsung (misalnya via telepon karena waktu terbatas), maka diperbolehkan dengan format:</p>
            <ul className="ml-8 mt-1 space-y-1">
              <li>• 20 kali setoran via WA Call, dan</li>
              <li>• 20 kali setoran via Voice Note (VN)</li>
              <li>➤ Total: 40 kali</li>
            </ul>
          </div>

          <div className="p-4 bg-green-100 rounded-lg">
            <p className="font-semibold text-green-800 mb-2">📖 Tentang Metode MTI (Tikrar 40 Kali)</p>
            <p className="text-sm text-green-700">
              Program ini menggunakan metode Tikrar 40 kali. Karena ini inti dari program, maka:
            </p>
            <ul className="text-sm text-green-700 mt-2 ml-4 space-y-1">
              <li>• Tidak diperbolehkan dikurangi atau ditawar-tawar</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-100 rounded-lg">
            <p className="font-semibold text-blue-800 mb-2">🧰 Perlengkapan Wajib:</p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Al-Qur'an Tikrar</strong> ➤ Jika belum memiliki, bisa dibeli di toko buku atau toko online (tautan tersedia di deskripsi grup pendaftaran)</li>
              <li>• <strong>Counter Manual (alat penghitung)</strong> ➤ Bisa dibeli di toko alat tulis atau toko online (tautan juga tersedia di deskripsi grup)</li>
              <li>• Bagi yang mengalami kendala finansial, silakan hubungi Kak Mara di WA: 0813-1365-0842</li>
            </ul>
          </div>

          <div className="p-4 bg-purple-100 rounded-lg">
            <p className="font-semibold text-purple-800 mb-2">📝 Laporan:</p>
            <p className="text-sm text-purple-700">
              Wajib melaporkan semua poin yang telah dikerjakan sesuai arahan musyrifah MTI.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="understands_program"
            checked={formData.understands_program}
            onCheckedChange={(checked) => handleInputChange('understands_program', checked as boolean)}
          />
          <div className="space-y-1">
            <Label htmlFor="understands_program" className="text-sm font-medium text-gray-700">
              Apakah Ukhti faham dengan poin-poin di atas?
            </Label>
            {errors.understands_program && (
              <p className="text-red-500 text-xs">{errors.understands_program}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="questions" className="text-sm font-medium text-gray-700">
            Silahkan ketik pertanyaan Ukhti apabila ada yang masih kurang faham
          </Label>
          <Textarea
            id="questions"
            value={formData.questions}
            onChange={(e) => handleInputChange('questions', e.target.value)}
            rows={4}
            placeholder="Ketik pertanyaan Ukhti di sini (kosongkan jika tidak ada)"
            className="text-sm"
          />
        </div>

        {submitStatus === 'success' && (
          <Alert className="bg-green-50 border-green-200 border-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong className="text-lg">
                {isEditMode ? 'Alhamdulillah! Data Berhasil Diperbarui! ✅' : 'Alhamdulillah! Pendaftaran Berhasil! 🎉'}
              </strong>
              <br /><br />
              <p className="text-base">
                {isEditMode
                  ? 'Data formulir pendaftaran Ukhti telah berhasil diperbarui. Jazakillahu khairan.'
                  : 'Formulir pendaftaran Ukhti telah berhasil dikirim. Jazakillahu khairan atas keseriusan Ukhti untuk bergabung dengan program Tikrar MTI.'
                }
              </p>
              <br />
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 my-3 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Informasi Penting:</strong><br />
                  Silakan pantau aplikasi ini secara berkala untuk mendapatkan informasi selanjutnya mengenai tahap seleksi. Tim kami akan menghubungi Ukhti melalui Telegram yang telah didaftarkan.
                </p>
              </div>
              <p className="text-sm text-gray-700">
                <strong>Tahap Selanjutnya:</strong><br />
                • Proses seleksi administrasi<br />
                • Tes bacaan Al-Qur'an<br />
                • Pengumuman hasil seleksi
              </p>
              <br />
              <div className="mt-4">
                <Button
                  onClick={() => router.push('/perjalanan-saya')}
                  className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto min-w-0"
                >
                  <span className="hidden sm:inline">Lihat Perjalanan Saya (My Journeys) →</span>
                  <span className="sm:hidden">Perjalanan Saya →</span>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {submitStatus === 'error' && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Gagal Mengirim Formulir</strong>
              <br /><br />
              <p className="text-sm">
                Terjadi kesalahan saat mengirim formulir. Silakan coba lagi atau hubungi admin melalui WhatsApp 08567712914.
              </p>
              <br />
              <div className="space-y-1 text-xs">
                <p>💡 <strong>Tips:</strong></p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Periksa koneksi internet Ukhti</li>
                  <li>Refresh halaman dan coba lagi</li>
                  <li>Gunakan koneksi Wi-Fi jika data seluler bermasalah</li>
                  <li>Hubungi admin jika masalah berlanjut</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )

  // Authentication check - user must be logged in to access this page
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-green-900 mb-3">
              Formulir Pendaftaran MTI Batch 2
            </h1>
            <p className="text-lg text-gray-600">
              Program Hafalan Al-Qur'an Gratis Khusus Akhawat
            </p>
          </div>

          {/* Authentication Required Message */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Login Diperlukan
              </h2>
              <p className="text-gray-600 mb-6">
                Untuk mengakses formulir pendaftaran Tikrar MTI, Ukhti harus login terlebih dahulu.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-blue-800 mb-2">📋 Cara Mendaftar:</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Login ke akun MTI Apps</li>
                  <li>Lengkapi profil data diri</li>
                  <li>Kembali ke halaman ini untuk mengisi formulir</li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/login"
                  className="inline-flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Masuk/Login
                </a>
                <a
                  href="/register"
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Daftar Baru
                </a>
              </div>
            </div>

            {loading && (
              <div className="mt-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-900 mx-auto mb-2"></div>
                <p className="text-gray-600">Memeriksa status login...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 pt-16 sm:pt-20 lg:pt-20">
      <div className="max-w-4xl mx-auto px-3 md:px-4 py-8 overflow-x-hidden">

        <div className="text-center mb-6 px-4">
          <h1 className="text-2xl md:text-4xl font-bold text-green-900 mb-3">
            {isEditMode ? 'Edit Pendaftaran MTI Batch 2' : 'Formulir Pendaftaran MTI Batch 2'}
          </h1>
          <p className="text-sm md:text-lg text-gray-600">
            Program Hafalan Al-Qur'an Gratis Khusus Akhawat<br/>
            <span className="text-xs md:text-base text-green-700 font-medium">Metode Tikrar 40 Kali - Juz 1, 28, 29, 30</span>
          </p>
          {isLoadingRegistration ? (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-900"></div>
                <p className="text-sm text-gray-700">Memeriksa status pendaftaran...</p>
              </div>
            </div>
          ) : isEditMode && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>Mode Edit:</strong> Ukhti sudah terdaftar. Perbarui data formulir jika ada perubahan.
              </p>
              {existingRegistration && (
                <p className="text-xs text-blue-600 mt-1">
                  Status: {existingRegistration.status} |
                  Tanggal Daftar: {new Date(existingRegistration.submission_date).toLocaleDateString('id-ID')}
                </p>
              )}
            </div>
          )}

          {/* Link ke Perjalanan Program */}
          <div className="mt-3 md:mt-4">
            <a
              href="/perjalanan-saya"
              className="inline-flex items-center px-3 md:px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors duration-200 text-xs md:text-sm"
            >
              <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              Lihat Perjalanan Program
            </a>
          </div>
        </div>

  
        <Card className="shadow-lg border-green-100 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl text-green-900">
                Section {currentSection} of {totalSections}
              </CardTitle>
              <span className="text-base text-gray-600">
                {Math.round(progressPercentage)}% Complete
              </span>
            </div>
            <Progress value={progressPercentage} className="w-full h-3" />
          </CardHeader>

          <CardContent className="pt-6 overflow-x-hidden">
            <form id="registration-form" onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {currentSection === 1 && renderSection1()}
              {currentSection === 2 && renderSection2()}
              {currentSection === 3 && renderSection3()}
              {currentSection === 4 && renderSection4()}

              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentSection === 1 || isSubmitting}
                  className="flex items-center space-x-2 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 text-base py-2 px-4"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span>Previous</span>
                </Button>

                {currentSection < totalSections ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 text-base py-2 px-4"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting || submitStatus === 'success'}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 text-base py-2 px-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        <span>{isEditMode ? 'Memperbarui Data...' : 'Mengirim Data...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{isEditMode ? 'Update Pendaftaran' : 'Kirim Pendaftaran'}</span>
                        <Send className="h-5 w-5" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <div className="mt-6 md:mt-8 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 md:p-8">
          <h3 className="font-bold text-lg md:text-xl mb-3 md:mb-4 text-yellow-900 flex items-center">
            <AlertCircle className="w-4 h-4 md:w-6 md:h-6 mr-2" />
            Catatan Penting
          </h3>
          <div className="space-y-2 md:space-y-3 text-sm md:text-base text-yellow-800">
            <p>• Pastikan Ukhti sudah mencoba simulasi membaca Surat An-Naba' ayat 1-11 sebanyak 40 kali sebelum melanjutkan pendaftaran.</p>
            <p>• Simpan nomor WhatsApp Kak Mara (081313650842) agar dapat di-add ke grup setelah lolos seleksi.</p>
            <p>• Siapkan aplikasi Telegram untuk proses seleksi dan komunikasi selanjutnya.</p>
            <p>• Program ini membutuhkan komitmen waktu minimal 2 jam per hari.</p>
            <p>• Pastikan Ukhti memiliki izin dari suami/orang tua/wali yang bertanggung jawab atas diri Ukhti.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Force dynamic rendering to prevent localStorage SSR errors
export const dynamic = 'force-dynamic'

export default TikrarTahfidzPage
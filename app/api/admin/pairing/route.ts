import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/pairing
 *
 * Fetch all pairing requests for admin review
 *
 * Query params:
 * - batch_id: Filter by batch (optional)
 * - status: Filter by status (optional) - 'pending', 'approved', 'rejected', 'paired'
 */
export async function GET(request: Request) {
  const supabase = createClient()

  // 1. Verify admin access
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Parse query params
  const { searchParams } = new URL(request.url)
  const batchId = searchParams.get('batch_id')
  const status = searchParams.get('status')

  try {
    // 3. Fetch pairing requests
    let query = supabase
      .from('daftar_ulang_submissions')
      .select(`
        id,
        user_id,
        batch_id,
        status,
        partner_type,
        partner_user_id,
        partner_name,
        partner_relationship,
        partner_notes,
        submitted_at,
        profiles!daftar_ulang_submissions_user_id_fkey (
          id,
          full_name,
          email,
          zona_waktu,
          wa_phone
        ),
        registrations:pendaftaran_tikrar_tahfidz!daftar_ulang_submissions_registration_id_fkey (
          id,
          chosen_juz,
          main_time_slot,
          backup_time_slot
        ),
        batch:batches!daftar_ulang_submissions_batch_id_fkey (
          id,
          name
        )
      `)
      .eq('status', 'submitted') // Only submitted daftar ulang

    if (batchId) {
      query = query.eq('batch_id', batchId)
    }

    // Filter by pairing status if provided
    // We'll add a pairing_status column later, for now use partner_type
    const { data: submissions, error } = await query.order('submitted_at', { ascending: false })

    if (error) throw error

    // 4. Transform data for frontend
    const selfMatchRequests = []
    const systemMatchRequests = []

    for (const submission of submissions || []) {
      const requestData = {
        id: submission.id,
        user_id: submission.user_id,
        user_name: submission.profiles?.full_name,
        user_email: submission.profiles?.email,
        user_zona_waktu: submission.profiles?.zona_waktu,
        user_wa_phone: submission.profiles?.wa_phone,
        chosen_juz: submission.registrations?.chosen_juz,
        main_time_slot: submission.registrations?.main_time_slot,
        backup_time_slot: submission.registrations?.backup_time_slot,
        partner_type: submission.partner_type,
        partner_user_id: submission.partner_user_id,
        partner_name: submission.partner_name,
        partner_relationship: submission.partner_relationship,
        partner_notes: submission.partner_notes,
        submitted_at: submission.submitted_at,
        batch_id: submission.batch_id,
        batch_name: submission.batch?.name,
      }

      if (submission.partner_type === 'self_match') {
        // Fetch partner details
        if (submission.partner_user_id) {
          const { data: partnerProfile } = await supabase
            .from('profiles')
            .select('id, full_name, email, zona_waktu, wa_phone')
            .eq('id', submission.partner_user_id)
            .single()

          const { data: partnerRegistration } = await supabase
            .from('pendaftaran_tikrar_tahfidz')
            .select('chosen_juz, main_time_slot, backup_time_slot')
            .eq('user_id', submission.partner_user_id)
            .eq('batch_id', submission.batch_id)
            .single()

          selfMatchRequests.push({
            ...requestData,
            partner_details: partnerProfile ? {
              id: partnerProfile.id,
              full_name: partnerProfile.full_name,
              email: partnerProfile.email,
              zona_waktu: partnerProfile.zona_waktu,
              wa_phone: partnerProfile.wa_phone,
              chosen_juz: partnerRegistration?.chosen_juz,
              main_time_slot: partnerRegistration?.main_time_slot,
              backup_time_slot: partnerRegistration?.backup_time_slot,
            } : null,
          })
        }
      } else if (submission.partner_type === 'system_match') {
        systemMatchRequests.push(requestData)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        self_match_requests: selfMatchRequests,
        system_match_requests: systemMatchRequests,
      },
    })
  } catch (error: any) {
    console.error('Error fetching pairing requests:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch pairing requests' },
      { status: 500 }
    )
  }
}

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Approve daftar ulang submission
 * - Changes status from 'submitted' to 'approved'
 * - Changes user role from 'calon_thalibah' to 'thalibah'
 * - Adds thalibah to halaqah_students (ujian and/or tashih)
 */
export async function approveDaftarUlang(submissionId: string) {
  const supabase = createClient()

  // 1. Validasi Auth - hanya admin
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (!authUser || authError) {
    return { success: false, error: 'Unauthorized. Silakan login kembali.' }
  }

  // Check if user is admin
  const { data: currentUser, error: userError } = await supabase
    .from('users')
    .select('roles')
    .eq('id', authUser.id)
    .single()

  if (userError || !currentUser || !currentUser.roles?.includes('admin')) {
    return { success: false, error: 'Anda tidak memiliki akses untuk menyetujui daftar ulang.' }
  }

  try {
    // 2. Get daftar ulang submission with details
    const { data: submission, error: submissionError } = await supabase
      .from('daftar_ulang_submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (submissionError || !submission) {
      return { success: false, error: 'Daftar ulang tidak ditemukan.' }
    }

    if (submission.status !== 'submitted') {
      return { success: false, error: 'Hanya submission dengan status submitted yang bisa disetujui.' }
    }

    // 3. Update daftar_ulang_submissions status to 'approved'
    const { error: updateError } = await supabase
      .from('daftar_ulang_submissions')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: authUser.id
      })
      .eq('id', submissionId)

    if (updateError) {
      console.error('Error updating daftar ulang status:', updateError)
      return { success: false, error: 'Gagal mengupdate status daftar ulang.' }
    }

    // 4. Update user role - add 'thalibah' role
    const { data: userData } = await supabase
      .from('users')
      .select('roles')
      .eq('id', submission.user_id)
      .single()

    if (userData?.roles) {
      const currentRoles = userData.roles.filter((r: string) => r !== 'calon_thalibah')
      const newRoles = [...new Set([...currentRoles, 'thalibah'])] // Add thalibah if not exists

      const { error: roleUpdateError } = await supabase
        .from('users')
        .update({ roles: newRoles })
        .eq('id', submission.user_id)

      if (roleUpdateError) {
        console.error('Error updating user role:', roleUpdateError)
        // Continue anyway - status update is more important
      }
    }

    // 5. Add thalibah to halaqah_students
    const halaqahStudentsToAdd = []

    // Add ujian halaqah
    if (submission.ujian_halaqah_id) {
      halaqahStudentsToAdd.push({
        halaqah_id: submission.ujian_halaqah_id,
        thalibah_id: submission.user_id,
        assigned_by: authUser.id,
        status: 'active'
      })
    }

    // Add tashih halaqah (if different from ujian)
    if (submission.tashih_halaqah_id && submission.tashih_halaqah_id !== submission.ujian_halaqah_id) {
      halaqahStudentsToAdd.push({
        halaqah_id: submission.tashih_halaqah_id,
        thalibah_id: submission.user_id,
        assigned_by: authUser.id,
        status: 'active'
      })
    }

    if (halaqahStudentsToAdd.length > 0) {
      const { error: studentsError } = await supabase
        .from('halaqah_students')
        .insert(halaqahStudentsToAdd)

      if (studentsError) {
        console.error('Error adding to halaqah_students:', studentsError)
        return { success: false, error: 'Gagal menambahkan thalibah ke halaqah.' }
      }
    }

    // Revalidate paths
    revalidatePath('/dashboard')
    revalidatePath('/perjalanan-saya')
    revalidatePath('/daftar-ulang')

    return {
      success: true,
      message: 'Daftar ulang berhasil disetujui! Thalibah telah ditambahkan ke halaqah.'
    }

  } catch (error: any) {
    console.error('Approve daftar ulang error:', error)
    return {
      success: false,
      error: error?.message || 'Terjadi kesalahan tidak terduga'
    }
  }
}

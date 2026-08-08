type HalaqahSubmission = {
  user_id: string
  ujian_halaqah_id?: string | null
  tashih_halaqah_id?: string | null
}

function getHalaqahIds(submission: HalaqahSubmission) {
  return Array.from(new Set([
    submission.ujian_halaqah_id,
    submission.tashih_halaqah_id
  ].filter((id): id is string => Boolean(id))))
}

/**
 * Ensure an approved daftar-ulang submission is represented in halaqah_students.
 * This deliberately uses select + update/insert because older databases may not
 * have a unique constraint on (halaqah_id, thalibah_id).
 */
export async function syncApprovedSubmissionToHalaqahStudents(
  supabase: SupabaseClient,
  submission: HalaqahSubmission,
  assignedBy: string
) {
  for (const halaqahId of getHalaqahIds(submission)) {
    const { data: existingRows, error: selectError } = await supabase
      .from('halaqah_students')
      .select('id, status')
      .eq('halaqah_id', halaqahId)
      .eq('thalibah_id', submission.user_id)
      .limit(1)

    if (selectError) throw selectError
    const existing = existingRows?.[0]

    if (existing) {
      const { error: updateError } = await supabase
        .from('halaqah_students')
        .update({
          status: 'active',
          assigned_by: assignedBy,
          assigned_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (updateError) throw updateError
      continue
    }

    const { error: insertError } = await supabase
      .from('halaqah_students')
      .insert({
        halaqah_id: halaqahId,
        thalibah_id: submission.user_id,
        assigned_by: assignedBy,
        status: 'active'
      })

    if (insertError) throw insertError
  }
}

/** Remove the exact halaqah memberships created by this submission. */
export async function removeSubmissionFromHalaqahStudents(
  supabase: SupabaseClient,
  submission: HalaqahSubmission
) {
  for (const halaqahId of getHalaqahIds(submission)) {
    const { error } = await supabase
      .from('halaqah_students')
      .delete()
      .eq('halaqah_id', halaqahId)
      .eq('thalibah_id', submission.user_id)

    if (error) throw error
  }
}
import type { SupabaseClient } from '@supabase/supabase-js'

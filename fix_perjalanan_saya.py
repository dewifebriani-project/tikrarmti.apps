import re

with open("app/(protected)/perjalanan-saya/page.tsx", "r") as f:
    content = f.read()

# Add needs_revision to TikrarRegistration interface
old_interface = """  final_juz?: string;
  oral_total_score?: number;
  // daftar_ulang is now inherited from Pendaftaran interface
}"""
new_interface = """  final_juz?: string;
  oral_total_score?: number;
  needs_revision?: boolean;
  // daftar_ulang is now inherited from Pendaftaran interface
}"""
if 'needs_revision?: boolean;' not in content:
    content = content.replace(old_interface, new_interface)

# Update hasOralSubmission logic
old_has_oral = """      hasOralSubmission: !!(
        registration?.oral_submission_url ||
        (registration?.oral_assessment_status && registration?.oral_assessment_status !== 'pending' && registration?.oral_assessment_status !== 'not_submitted') ||
        (registration?.oral_total_score != null && registration?.oral_total_score > 0) ||
        (registration?.oral_score != null && registration?.oral_score > 0)
      ),"""
new_has_oral = """      hasOralSubmission: !!(
        (registration?.oral_submission_url ||
        (registration?.oral_assessment_status && registration?.oral_assessment_status !== 'pending' && registration?.oral_assessment_status !== 'not_submitted') ||
        (registration?.oral_total_score != null && registration?.oral_total_score > 0) ||
        (registration?.oral_score != null && registration?.oral_score > 0)) &&
        !registration?.needs_revision
      ),"""
content = content.replace(old_has_oral, new_has_oral)

# Also expose needsRevision to the return object
old_return = """      writtenQuizSubmittedAt: registration?.written_quiz_submitted_at || (registration as any)?.written_submitted_at,"""
new_return = """      needsRevision: registration?.needs_revision,
      writtenQuizSubmittedAt: registration?.written_quiz_submitted_at || (registration as any)?.written_submitted_at,"""
if 'needsRevision: registration?.needs_revision,' not in content:
    content = content.replace(old_return, new_return)

# Update the subPhases Test Lisan to show a different message if needs_revision is true
old_test_lisan = """            done: hasFormPendaftaran && hasOral, 
            data: hasFormPendaftaran && hasOral 
              ? (registrationStatus.oralAssessmentStatus === 'pending'
                  ? 'Sudah Rekaman (Belum Dinilai)'
                  : (isSelectionDone 
                      ? (registrationStatus.oralAssessmentStatus === 'pass' ? 'Lulus ✓' : 'Tidak Lulus')
                      : 'Sudah Dinilai (Menunggu Pengumuman)'
                    )
                )
              : (hasFormPendaftaran ? 'Belum rekaman' : 'Isi form dahulu'), 
            reviewType: hasFormPendaftaran && hasOral ? 'oral' : null,"""
new_test_lisan = """            done: hasFormPendaftaran && hasOral, 
            data: hasFormPendaftaran && hasOral 
              ? (registrationStatus.oralAssessmentStatus === 'pending'
                  ? 'Sudah Rekaman (Belum Dinilai)'
                  : (isSelectionDone 
                      ? (registrationStatus.oralAssessmentStatus === 'pass' ? 'Lulus ✓' : 'Tidak Lulus')
                      : 'Sudah Dinilai (Menunggu Pengumuman)'
                    )
                )
              : (registrationStatus.needsRevision ? 'Perlu Rekam Ulang' : (hasFormPendaftaran ? 'Belum rekaman' : 'Isi form dahulu')), 
            reviewType: hasFormPendaftaran && hasOral ? 'oral' : null,"""
content = content.replace(old_test_lisan, new_test_lisan)


with open("app/(protected)/perjalanan-saya/page.tsx", "w") as f:
    f.write(content)

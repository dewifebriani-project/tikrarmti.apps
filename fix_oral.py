import re

with open("components/OralAssessment.tsx", "r") as f:
    content = f.read()

old_body = """        body: JSON.stringify({
          oral_submission_url: null,
          oral_submission_file_name: null,
          oral_submitted_at: null,
          oral_assessment_status: 'not_submitted',
          oral_makhraj_errors: null,
          oral_sifat_errors: null,
          oral_mad_errors: null,
          oral_ghunnah_errors: null,
          oral_harakat_errors: null,
          oral_itmamul_harakat_errors: null,
          oral_total_score: null,
          oral_assessment_notes: null,
          oral_assessment_audio_url: null,
          selection_status: 'pending'
        }),"""
new_body = """        body: JSON.stringify({
          oral_submission_url: null,
          oral_submission_file_name: null,
          oral_submitted_at: null,
          oral_assessment_status: 'pending',
          oral_makhraj_errors: null,
          oral_sifat_errors: null,
          oral_mad_errors: null,
          oral_ghunnah_errors: null,
          oral_harakat_errors: null,
          oral_itmamul_harakat_errors: null,
          oral_total_score: null,
          oral_assessment_notes: null,
          oral_assessment_audio_url: null,
          selection_status: 'pending',
          needs_revision: true
        }),"""

content = content.replace(old_body, new_body)

with open("components/OralAssessment.tsx", "w") as f:
    f.write(content)

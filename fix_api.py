import re

with open("app/api/pendaftaran/tikrar/[id]/route.ts", "r") as f:
    content = f.read()

old_isOralAssessmentUpdate = """const isOralAssessmentUpdate = body.oral_makhraj_errors !== undefined || body.oral_sifat_errors !== undefined ||
                                    body.oral_mad_errors !== undefined || body.oral_ghunnah_errors !== undefined ||
                                    body.oral_harakat_errors !== undefined || body.oral_itmamul_harakat_errors !== undefined ||
                                    body.oral_total_score !== undefined || body.oral_assessment_status !== undefined ||
                                    body.oral_assessment_notes !== undefined || body.oral_assessment_audio_url !== undefined ||
                                    body.selection_status !== undefined;"""
new_isOralAssessmentUpdate = """const isOralAssessmentUpdate = body.oral_makhraj_errors !== undefined || body.oral_sifat_errors !== undefined ||
                                    body.oral_mad_errors !== undefined || body.oral_ghunnah_errors !== undefined ||
                                    body.oral_harakat_errors !== undefined || body.oral_itmamul_harakat_errors !== undefined ||
                                    body.oral_total_score !== undefined || body.oral_assessment_status !== undefined ||
                                    body.oral_assessment_notes !== undefined || body.oral_assessment_audio_url !== undefined ||
                                    body.selection_status !== undefined || body.needs_revision !== undefined;"""

content = content.replace(old_isOralAssessmentUpdate, new_isOralAssessmentUpdate)

old_update = """      if (body.selection_status !== undefined) updateData.selection_status = body.selection_status;
      isHandled = true;
    }"""
new_update = """      if (body.selection_status !== undefined) updateData.selection_status = body.selection_status;
      if (body.needs_revision !== undefined) updateData.needs_revision = body.needs_revision;
      isHandled = true;
    }"""

content = content.replace(old_update, new_update)

with open("app/api/pendaftaran/tikrar/[id]/route.ts", "w") as f:
    f.write(content)

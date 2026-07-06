import re

with open("app/api/seleksi/submit-base64/route.ts", "r") as f:
    content = f.read()

old_updateData = """    const updateData = {
      oral_submission_url: publicUrl,
      oral_submission_file_name: supabaseFileName,
      oral_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };"""
new_updateData = """    const updateData = {
      oral_submission_url: publicUrl,
      oral_submission_file_name: supabaseFileName,
      oral_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      needs_revision: false
    };"""

content = content.replace(old_updateData, new_updateData)

with open("app/api/seleksi/submit-base64/route.ts", "w") as f:
    f.write(content)

import re

with open("app/(protected)/daftar-ulang/page.tsx", "r") as f:
    content = f.read()

# 1. Add user profile fallback for empty registration data
old_fetch = """        setFormData(prev => ({
          ...prev,
          confirmed_full_name: selectedRegistration.full_name || prev.confirmed_full_name,
          confirmed_chosen_juz: selectedRegistration.chosen_juz || prev.confirmed_chosen_juz,
          confirmed_main_time_slot: selectedRegistration.main_time_slot || prev.confirmed_main_time_slot,
          confirmed_backup_time_slot: selectedRegistration.backup_time_slot || prev.confirmed_backup_time_slot,
          confirmed_wa_phone: selectedRegistration.wa_phone || prev.confirmed_wa_phone,
          confirmed_address: selectedRegistration.address || prev.confirmed_address,"""
new_fetch = """        setFormData(prev => ({
          ...prev,
          confirmed_full_name: selectedRegistration.full_name || user?.user_metadata?.full_name || prev.confirmed_full_name,
          confirmed_chosen_juz: selectedRegistration.chosen_juz || prev.confirmed_chosen_juz,
          confirmed_main_time_slot: selectedRegistration.main_time_slot || prev.confirmed_main_time_slot,
          confirmed_backup_time_slot: selectedRegistration.backup_time_slot || prev.confirmed_backup_time_slot,
          confirmed_wa_phone: selectedRegistration.wa_phone || user?.user_metadata?.wa_phone || prev.confirmed_wa_phone,
          confirmed_address: selectedRegistration.address || prev.confirmed_address,"""
content = content.replace(old_fetch, new_fetch)

# 2. Add loading from existingSubmission
old_useEffect = """    setFormData(prev => ({
      ...prev,
      // For draft: reset halaqah selections so user always picks from current options
      // For locked (submitted/approved): load the actual selections
      ujian_halaqah_id: isDraft ? '' : (existingSubmission.ujian_halaqah_id || ''),
      tashih_halaqah_id: isDraft ? '' : (existingSubmission.tashih_halaqah_id || ''),"""
new_useEffect = """    setFormData(prev => ({
      ...prev,
      // Load confirmed personal data from draft if available
      confirmed_full_name: existingSubmission.confirmed_full_name || prev.confirmed_full_name,
      confirmed_chosen_juz: existingSubmission.confirmed_chosen_juz || prev.confirmed_chosen_juz,
      confirmed_main_time_slot: existingSubmission.confirmed_main_time_slot || prev.confirmed_main_time_slot,
      confirmed_backup_time_slot: existingSubmission.confirmed_backup_time_slot || prev.confirmed_backup_time_slot,
      confirmed_wa_phone: existingSubmission.confirmed_wa_phone || prev.confirmed_wa_phone,
      confirmed_address: existingSubmission.confirmed_address || prev.confirmed_address,
      // For draft: reset halaqah selections so user always picks from current options
      // For locked (submitted/approved): load the actual selections
      ujian_halaqah_id: isDraft ? '' : (existingSubmission.ujian_halaqah_id || ''),
      tashih_halaqah_id: isDraft ? '' : (existingSubmission.tashih_halaqah_id || ''),"""
content = content.replace(old_useEffect, new_useEffect)

with open("app/(protected)/daftar-ulang/page.tsx", "w") as f:
    f.write(content)

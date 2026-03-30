-- ============================================================================
-- EXPORT QUERIES — Jalankan di PROJECT LAMA
-- ============================================================================
-- URL project lama: https://nmbvklixthlqtkkgqnjl.supabase.co
--
-- Cara pakai:
--   1. Buka Supabase Dashboard → project LAMA → SQL Editor
--   2. Jalankan tiap query di bawah SATU PER SATU
--   3. Download hasilnya sebagai CSV
--   4. Gunakan hasil CSV untuk import ke project baru
-- ============================================================================


-- ============================================================================
-- EXPORT 1: users
-- ============================================================================
-- Kolom blacklist TIDAK diikutkan (tidak ada di project baru)
-- COALESCE digunakan untuk handle NULL pada kolom yang NOT NULL di project baru
-- ============================================================================
SELECT
  id,
  email,
  password_hash,
  full_name,
  role,
  avatar_url,
  is_active,
  created_at,
  updated_at,
  provinsi,
  kota,
  alamat,
  whatsapp,
  telegram,
  COALESCE(zona_waktu, 'WIB')                     AS zona_waktu,
  tanggal_lahir,
  COALESCE(tempat_lahir, '[tidak diisi]')           AS tempat_lahir,
  COALESCE(pekerjaan, '[tidak diisi]')              AS pekerjaan,
  COALESCE(alasan_daftar, '[tidak diisi]')          AS alasan_daftar,
  COALESCE(jenis_kelamin, 'Perempuan')              AS jenis_kelamin,
  COALESCE(negara, 'Indonesia')                     AS negara,
  nama_kunyah,
  COALESCE(roles, '{}')                             AS roles,
  current_tikrar_batch_id
  -- TIDAK DIIKUTKAN: is_blacklisted, blacklist_reason, blacklisted_at,
  --                  blacklist_notes, blacklist_by, name
FROM public.users
ORDER BY created_at;


-- ============================================================================
-- EXPORT 2: batches
-- ============================================================================
SELECT
  id, name, description, start_date, end_date,
  registration_start_date, registration_end_date,
  COALESCE(status, 'draft')                         AS status,
  created_at, updated_at,
  COALESCE(duration_weeks, 0)                       AS duration_weeks,
  COALESCE(is_free, true)                           AS is_free,
  COALESCE(price, 0)                                AS price,
  COALESCE(total_quota, 100)                        AS total_quota,
  program_type,
  selection_start_date, selection_end_date,
  selection_result_date, re_enrollment_date,
  COALESCE(registered_count, 0)                     AS registered_count
  -- Kolom baru di project baru (opening_class_date, dll) → otomatis NULL
FROM public.batches
ORDER BY created_at;


-- ============================================================================
-- EXPORT 3: programs
-- ============================================================================
SELECT
  id, batch_id, name, description, target_level,
  duration_weeks, max_thalibah,
  COALESCE(status, 'draft')                         AS status,
  created_at, updated_at, class_type
FROM public.programs
ORDER BY created_at;


-- ============================================================================
-- EXPORT 4: halaqah
-- ============================================================================
SELECT
  id, program_id, name, description, day_of_week,
  start_time, end_time, location, max_students,
  COALESCE(status, 'active')                        AS status,
  created_at, updated_at,
  zoom_link, muallimah_id,
  COALESCE(waitlist_max, 5)                         AS waitlist_max,
  preferred_juz
FROM public.halaqah
ORDER BY created_at;


-- ============================================================================
-- EXPORT 5a: halaqah_mentors
-- ============================================================================
SELECT id, halaqah_id, mentor_id, role, is_primary, assigned_at
FROM public.halaqah_mentors
ORDER BY assigned_at;


-- ============================================================================
-- EXPORT 5b: halaqah_students
-- ============================================================================
SELECT
  id, halaqah_id, thalibah_id, assigned_at, assigned_by,
  COALESCE(status, 'active')                        AS status
FROM public.halaqah_students
ORDER BY assigned_at;


-- ============================================================================
-- EXPORT 6: pendaftaran_tikrar_tahfidz
-- ============================================================================
SELECT
  id, user_id, batch_id, program_id, email, full_name, address,
  wa_phone, telegram_phone, chosen_juz, main_time_slot, backup_time_slot,
  COALESCE(status, 'pending')                       AS status,
  COALESCE(selection_status, 'pending')             AS selection_status,
  approved_by, approved_at, created_at, updated_at, submission_date,
  -- Extended fields (ada di versi lama):
  birth_date, age, domicile, timezone,
  COALESCE(understands_commitment, false)           AS understands_commitment,
  COALESCE(tried_simulation, false)                 AS tried_simulation,
  COALESCE(no_negotiation, false)                   AS no_negotiation,
  COALESCE(has_telegram, false)                     AS has_telegram,
  COALESCE(saved_contact, false)                    AS saved_contact,
  has_permission, permission_name, permission_phone,
  COALESCE(no_travel_plans, false)                  AS no_travel_plans,
  motivation, ready_for_team,
  COALESCE(time_commitment, false)                  AS time_commitment,
  COALESCE(understands_program, false)              AS understands_program,
  questions, batch_name,
  oral_submission_url, oral_submission_file_name, oral_submitted_at,
  written_quiz_answers, written_quiz_score, written_quiz_total_questions,
  written_quiz_correct_answers, written_submitted_at,
  COALESCE(oral_makhraj_errors, 0)                  AS oral_makhraj_errors,
  COALESCE(oral_sifat_errors, 0)                    AS oral_sifat_errors,
  COALESCE(oral_mad_errors, 0)                      AS oral_mad_errors,
  COALESCE(oral_ghunnah_errors, 0)                  AS oral_ghunnah_errors,
  COALESCE(oral_harakat_errors, 0)                  AS oral_harakat_errors,
  oral_total_score,
  COALESCE(oral_assessment_status, 'pending')       AS oral_assessment_status,
  oral_assessed_by, oral_assessed_at, oral_assessment_notes,
  COALESCE(oral_itmamul_harakat_errors, 0)          AS oral_itmamul_harakat_errors,
  exam_juz_number, exam_attempt_id, exam_score, exam_submitted_at,
  COALESCE(exam_status, 'not_started')              AS exam_status,
  COALESCE(re_enrollment_completed, false)          AS re_enrollment_completed,
  re_enrollment_completed_at, re_enrollment_confirmed_by,
  alasan_mengundurkan_diri
FROM public.pendaftaran_tikrar_tahfidz
ORDER BY created_at;


-- ============================================================================
-- EXPORT 7: daftar_ulang_submissions
-- ============================================================================
SELECT
  id, user_id, registration_id, batch_id,
  confirmed_full_name, confirmed_chosen_juz,
  confirmed_main_time_slot, confirmed_backup_time_slot,
  confirmed_wa_phone, confirmed_address,
  COALESCE(partner_type, 'self_match')              AS partner_type,
  partner_user_id, partner_name, partner_relationship, partner_notes,
  ujian_halaqah_id, tashih_halaqah_id,
  COALESCE(is_tashih_umum, false)                   AS is_tashih_umum,
  akad_url, akad_file_name, akad_submitted_at,
  COALESCE(status, 'draft')                         AS status,
  submitted_at, reviewed_at, reviewed_by, review_notes,
  created_at, updated_at,
  partner_wa_phone,
  COALESCE(pairing_status, 'pending')               AS pairing_status,
  rejection_reason,
  COALESCE(akad_files, '[]')                        AS akad_files
FROM public.daftar_ulang_submissions
ORDER BY created_at;


-- ============================================================================
-- EXPORT 8: jurnal_records
-- ============================================================================
SELECT
  id, user_id, tanggal_jurnal, tanggal_setor,
  COALESCE(tashih_completed, false)                 AS tashih_completed,
  COALESCE(murajaah_count, 0)                       AS murajaah_count,
  created_at, updated_at,
  COALESCE(rabth_completed, false)                  AS rabth_completed,
  COALESCE(simak_murattal_count, 0)                 AS simak_murattal_count,
  COALESCE(tikrar_bi_an_nadzar_completed, false)    AS tikrar_bi_an_nadzar_completed,
  COALESCE(tasmi_record_count, 0)                   AS tasmi_record_count,
  COALESCE(simak_record_completed, false)           AS simak_record_completed,
  COALESCE(tikrar_bi_al_ghaib_count, 0)             AS tikrar_bi_al_ghaib_count,
  COALESCE(tafsir_completed, false)                 AS tafsir_completed,
  COALESCE(menulis_completed, false)                AS menulis_completed,
  COALESCE(total_duration_minutes, 0)               AS total_duration_minutes,
  catatan_tambahan, juz_code, blok,
  tikrar_bi_al_ghaib_type,
  tikrar_bi_al_ghaib_40x,
  tikrar_bi_al_ghaib_20x,
  tarteel_screenshot_url
FROM public.jurnal_records
ORDER BY created_at;


-- ============================================================================
-- EXPORT 9: tashih_records
-- ============================================================================
SELECT
  id, user_id, blok, lokasi,
  COALESCE(masalah_tajwid, '[]')                    AS masalah_tajwid,
  catatan_tambahan, waktu_tashih,
  created_at, updated_at,
  -- Kolom yang mungkin ada di lama:
  nama_pemeriksa,
  ustadzah_id,
  COALESCE(jumlah_kesalahan_tajwid, 0)              AS jumlah_kesalahan_tajwid
FROM public.tashih_records
ORDER BY waktu_tashih;


-- ============================================================================
-- EXPORT 10: exam_configurations (opsional)
-- ============================================================================
SELECT id, name, description, duration_minutes, start_time, end_time,
       max_attempts, passing_score, status, created_at, updated_at,
       shuffle_questions, randomize_order, show_questions_all,
       questions_per_attempt
FROM public.exam_configurations
ORDER BY created_at;


-- ============================================================================
-- EXPORT 10b: exam_attempts (opsional)
-- ============================================================================
SELECT id, user_id, registration_id, juz_number, started_at, submitted_at,
       answers, total_questions, correct_answers, score, status,
       created_at, updated_at, configuration_id, attempt_number,
       time_taken, passed, is_graded
FROM public.exam_attempts
ORDER BY started_at;


-- ============================================================================
-- EXPORT 11a: muallimah_registrations
-- ============================================================================
SELECT
  id, user_id, batch_id, full_name, birth_date, birth_place, address,
  whatsapp, email, education, occupation, memorization_level, memorized_juz,
  preferred_juz, teaching_experience, teaching_years, teaching_institutions,
  preferred_schedule, backup_schedule,
  COALESCE(timezone, 'WIB')                         AS timezone,
  motivation, special_skills, health_condition,
  COALESCE(status, 'pending')                       AS status,
  submitted_at, reviewed_at, reviewed_by, review_notes,
  tajweed_institution, quran_institution, teaching_communities,
  memorized_tajweed_matan, studied_matan_exegesis, examined_juz,
  certified_juz, paid_class_interest,
  COALESCE(understands_commitment, false)           AS understands_commitment,
  age, class_type, preferred_max_thalibah
FROM public.muallimah_registrations
ORDER BY submitted_at;


-- ============================================================================
-- EXPORT 11b: musyrifah_registrations
-- ============================================================================
SELECT
  id, user_id, batch_id, full_name, birth_date, birth_place, address,
  whatsapp, email, education, occupation, leadership_experience,
  leadership_years, leadership_roles,
  COALESCE(management_skills, '{}')                 AS management_skills,
  team_management_experience, preferred_schedule, backup_schedule,
  COALESCE(timezone, 'WIB')                         AS timezone,
  motivation, leadership_philosophy, special_achievements,
  COALESCE(status, 'pending')                       AS status,
  submitted_at, reviewed_at, reviewed_by, review_notes
FROM public.musyrifah_registrations
ORDER BY submitted_at;


-- ============================================================================
-- EXPORT 12: Verifikasi jumlah baris (jalankan ini untuk cross-check)
-- ============================================================================
SELECT 'users' AS tabel, COUNT(*) AS jumlah FROM public.users
UNION ALL SELECT 'batches', COUNT(*) FROM public.batches
UNION ALL SELECT 'programs', COUNT(*) FROM public.programs
UNION ALL SELECT 'halaqah', COUNT(*) FROM public.halaqah
UNION ALL SELECT 'halaqah_mentors', COUNT(*) FROM public.halaqah_mentors
UNION ALL SELECT 'halaqah_students', COUNT(*) FROM public.halaqah_students
UNION ALL SELECT 'pendaftaran_tikrar_tahfidz', COUNT(*) FROM public.pendaftaran_tikrar_tahfidz
UNION ALL SELECT 'daftar_ulang_submissions', COUNT(*) FROM public.daftar_ulang_submissions
UNION ALL SELECT 'jurnal_records', COUNT(*) FROM public.jurnal_records
UNION ALL SELECT 'tashih_records', COUNT(*) FROM public.tashih_records
UNION ALL SELECT 'muallimah_registrations', COUNT(*) FROM public.muallimah_registrations
UNION ALL SELECT 'musyrifah_registrations', COUNT(*) FROM public.musyrifah_registrations
ORDER BY tabel;

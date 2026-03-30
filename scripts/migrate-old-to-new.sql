-- ============================================================================
-- IMPORT SCRIPT — Jalankan di PROJECT BARU
-- ============================================================================
-- URL project baru: https://lhqbqzrghdbbmstnhple.supabase.co
--
-- CARA PAKAI:
--   File ini berisi TEMPLATE INSERT untuk tiap tabel.
--   Untuk tiap STEP:
--     1. Jalankan query EXPORT di project lama (lihat export-from-old-project.sql)
--     2. Copy hasilnya, paste menggantikan bagian VALUES (...) di bawah
--     3. Jalankan INSERT di project baru
--
-- ORDER WAJIB:
--   Step 1: users → Step 2: batches → Step 3: programs → Step 4: halaqah
--   → Step 5: halaqah_mentors/students → Step 6: pendaftaran
--   → Step 7: daftar_ulang → Step 8: jurnal → Step 9: tashih
--   → Step 10: exam → Step 11: muallimah/musyrifah registrations
-- ============================================================================


-- ============================================================================
-- PRE-FLIGHT: Cek tabel sudah ada di project baru
-- ============================================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;


-- ============================================================================
-- STEP 1: USERS
-- ============================================================================
/*
  PERHATIAN — Gunakan script Node.js untuk users, BUKAN INSERT manual:

    node scripts/migrate-users-new-schema.js

  Script ini membaca scripts/users_rows.csv (export CSV dari project lama)
  dan menghasilkan scripts/users_insert_new_schema.sql yang sudah:
  - Menghapus kolom blacklist (tidak ada di project baru)
  - Handle NOT NULL dengan default placeholder
  - Handle FK current_tikrar_batch_id

  Jika tetap ingin INSERT manual, gunakan kolom berikut
  (JANGAN sertakan: is_blacklisted, blacklist_reason, blacklisted_at,
                    blacklist_notes, blacklist_by, name):

  INSERT INTO public.users (
    id, email, password_hash, full_name, role, avatar_url, is_active,
    created_at, updated_at, provinsi, kota, alamat, whatsapp, telegram,
    zona_waktu, tanggal_lahir, tempat_lahir, pekerjaan, alasan_daftar,
    jenis_kelamin, negara, nama_kunyah, roles, current_tikrar_batch_id
  ) VALUES
    ('uuid-1', 'email@example.com', NULL, 'Nama Lengkap', 'thalibah',
     NULL, true, '2025-01-01', '2025-01-01', NULL, NULL, NULL, NULL, NULL,
     'WIB', '1995-01-01', 'Jakarta', 'Mahasiswi', 'Ingin menghafal',
     'Perempuan', 'Indonesia', NULL, ARRAY['thalibah']::text[], NULL)
  ON CONFLICT (id) DO NOTHING;

  AUTH USERS: public.users.id harus match auth.users.id di project baru.
  User perlu register ulang di project baru agar auth.users terbuat,
  lalu public.users akan terisi dari trigger — ATAU import manual dulu
  lalu user register (trigger akan skip jika id sudah ada).
*/


-- ============================================================================
-- STEP 2: BATCHES
-- ============================================================================
/*
  Kolom baru di project baru yang tidak ada di lama (akan NULL):
    opening_class_date, first_week_start_date, first_week_end_date,
    review_week_start_date, review_week_end_date,
    final_exam_start_date, final_exam_end_date,
    graduation_start_date, graduation_end_date

  Template INSERT — ganti VALUES dengan data dari export-from-old-project.sql query 2:
*/
/*
INSERT INTO public.batches (
  id, name, description, start_date, end_date,
  registration_start_date, registration_end_date,
  status, created_at, updated_at,
  duration_weeks, is_free, price, total_quota,
  program_type, selection_start_date, selection_end_date,
  selection_result_date, re_enrollment_date, registered_count
) VALUES
  ('uuid-batch-1', 'Batch 1 2025', NULL, '2025-01-01', '2025-04-01',
   NULL, NULL, 'closed', '2025-01-01', '2025-01-01',
   14, true, 0, 100,
   NULL, NULL, NULL, NULL, NULL, 25)
ON CONFLICT (id) DO NOTHING;
*/


-- ============================================================================
-- STEP 3: PROGRAMS
-- ============================================================================
/*
INSERT INTO public.programs (
  id, batch_id, name, description, target_level,
  duration_weeks, max_thalibah, status, created_at, updated_at, class_type
) VALUES
  ('uuid-program-1', 'uuid-batch-1', 'Program Juz 30', NULL, NULL,
   14, 30, 'completed', '2025-01-01', '2025-01-01', 'tikrar_tahfidz')
ON CONFLICT (id) DO NOTHING;
*/


-- ============================================================================
-- STEP 4: HALAQAH
-- ============================================================================
/*
INSERT INTO public.halaqah (
  id, program_id, name, description, day_of_week,
  start_time, end_time, location, max_students, status,
  created_at, updated_at, zoom_link, muallimah_id, waitlist_max, preferred_juz
) VALUES
  ('uuid-halaqah-1', 'uuid-program-1', 'Halaqah A', NULL, 5,
   '08:00', '09:00', NULL, 20, 'active',
   '2025-01-01', '2025-01-01', NULL, NULL, 5, '30A')
ON CONFLICT (id) DO NOTHING;
*/


-- ============================================================================
-- STEP 5: HALAQAH_MENTORS + HALAQAH_STUDENTS
-- ============================================================================
/*
INSERT INTO public.halaqah_mentors (id, halaqah_id, mentor_id, role, is_primary, assigned_at)
VALUES
  ('uuid-hm-1', 'uuid-halaqah-1', 'uuid-user-muallimah', 'ustadzah', true, '2025-01-01')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.halaqah_students (id, halaqah_id, thalibah_id, assigned_at, assigned_by, status)
VALUES
  ('uuid-hs-1', 'uuid-halaqah-1', 'uuid-user-thalibah', '2025-01-01', NULL, 'active')
ON CONFLICT (id) DO NOTHING;
*/


-- ============================================================================
-- STEP 6: PENDAFTARAN_TIKRAR_TAHFIDZ
-- ============================================================================
/*
  Kolom baru di project baru yang tidak ada di lama (akan default):
    oral_assessment_status DEFAULT 'pending'
    exam_status DEFAULT 'not_started'
    re_enrollment_completed DEFAULT false

  INSERT INTO public.pendaftaran_tikrar_tahfidz (
    id, user_id, batch_id, program_id, email, full_name, address,
    wa_phone, telegram_phone, chosen_juz, main_time_slot, backup_time_slot,
    status, selection_status, approved_by, approved_at,
    created_at, updated_at, submission_date,
    understands_commitment, tried_simulation, no_negotiation,
    has_telegram, saved_contact, no_travel_plans,
    time_commitment, understands_program, batch_name
    -- ... tambahkan kolom lain sesuai data export
  ) VALUES (
    'uuid-reg-1', 'uuid-user-1', 'uuid-batch-1', 'uuid-program-1',
    'user@example.com', 'Nama Lengkap', NULL,
    '081234567890', NULL, '30A', 'Jumat 08:00', 'Sabtu 08:00',
    'approved', 'selected', NULL, NULL,
    '2025-01-01', '2025-01-01', '2025-01-01',
    true, true, true, true, true, true, true, true, 'Batch 1 2025'
  )
  ON CONFLICT (id) DO NOTHING;
*/


-- ============================================================================
-- STEP 7: DAFTAR_ULANG_SUBMISSIONS
-- ============================================================================
/*
  PENTING: partner_type NOT NULL, nilai valid: 'self_match', 'system_match', 'family', 'tarteel'
  Jika data lama tidak punya partner_type, gunakan 'self_match' sebagai default.

  INSERT INTO public.daftar_ulang_submissions (
    id, user_id, registration_id, batch_id,
    confirmed_full_name, confirmed_chosen_juz,
    confirmed_main_time_slot, confirmed_backup_time_slot,
    confirmed_wa_phone, confirmed_address,
    partner_type, status, created_at, updated_at
    -- ... tambahkan kolom lain sesuai data export
  ) VALUES (
    'uuid-du-1', 'uuid-user-1', 'uuid-reg-1', 'uuid-batch-1',
    'Nama Lengkap', '30A', 'Jumat 08:00', 'Sabtu 08:00',
    '081234567890', NULL, 'self_match', 'approved', '2025-01-01', '2025-01-01'
  )
  ON CONFLICT (id) DO NOTHING;
*/


-- ============================================================================
-- STEP 8: JURNAL_RECORDS
-- ============================================================================
/*
  PENTING: user_id FK ke public.users (bukan auth.users).
  ID biasanya sama karena Supabase auth menggunakan UUID yang sama.

  INSERT INTO public.jurnal_records (
    id, user_id, tanggal_jurnal, tanggal_setor,
    tashih_completed, murajaah_count, created_at, updated_at,
    catatan_tambahan, juz_code, blok
    -- ... tambahkan kolom extended jika ada
  ) VALUES (
    'uuid-jurnal-1', 'uuid-user-1', '2025-01-15 08:00:00+07', '2025-01-15',
    false, 3, '2025-01-15', '2025-01-15', NULL, '30A', 'A1'
  )
  ON CONFLICT (id) DO NOTHING;
*/


-- ============================================================================
-- STEP 9: TASHIH_RECORDS
-- ============================================================================
/*
  Kolom baru di project baru (bisa NULL): lokasi_detail, nama_pemeriksa,
  ustadzah_id, jumlah_kesalahan_tajwid (DEFAULT 0)

  INSERT INTO public.tashih_records (
    id, user_id, blok, lokasi,
    masalah_tajwid, catatan_tambahan, waktu_tashih,
    created_at, updated_at
    -- lokasi_detail, nama_pemeriksa, ustadzah_id → NULL secara default
    -- jumlah_kesalahan_tajwid → 0 secara default
  ) VALUES (
    'uuid-tashih-1', 'uuid-user-1', 'A1', 'Online',
    '[]', NULL, '2025-01-15 09:00:00+07', '2025-01-15', '2025-01-15'
  )
  ON CONFLICT (id) DO NOTHING;
*/


-- ============================================================================
-- STEP 10: EXAM (OPSIONAL)
-- ============================================================================
/*
INSERT INTO public.exam_configurations (
  id, name, description, duration_minutes, passing_score, status, created_at
) VALUES (
  'uuid-config-1', 'Ujian Juz 30', NULL, 30, 70, 'active', '2025-01-01'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exam_attempts (
  id, user_id, registration_id, juz_number, started_at,
  total_questions, correct_answers, score, status, created_at
) VALUES (
  'uuid-attempt-1', 'uuid-user-1', 'uuid-reg-1', 30, '2025-03-01',
  100, 85, 85, 'graded', '2025-03-01'
) ON CONFLICT (id) DO NOTHING;
*/


-- ============================================================================
-- STEP 11: MUALLIMAH_REGISTRATIONS + MUSYRIFAH_REGISTRATIONS
-- ============================================================================
/*
INSERT INTO public.muallimah_registrations (
  id, user_id, batch_id, full_name, birth_date, birth_place, address,
  whatsapp, email, education, occupation, memorization_level,
  preferred_juz, teaching_experience, preferred_schedule, backup_schedule,
  timezone, status, submitted_at
) VALUES (
  'uuid-mr-1', 'uuid-user-muallimah', 'uuid-batch-1', 'Nama Muallimah',
  '1990-01-01', 'Jakarta', 'Jl. Contoh No. 1',
  '081234567890', 'muallimah@example.com', 'S1', 'Guru',
  'Hafidz 30 Juz', '30A', '5 tahun', 'Jumat', 'Sabtu', 'WIB', 'approved', '2025-01-01'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.musyrifah_registrations (
  id, user_id, batch_id, full_name, birth_date, birth_place, address,
  whatsapp, email, education, occupation, leadership_experience,
  team_management_experience, preferred_schedule, backup_schedule,
  timezone, status, submitted_at
) VALUES (
  'uuid-musy-1', 'uuid-user-musyrifah', 'uuid-batch-1', 'Nama Musyrifah',
  '1992-01-01', 'Bandung', 'Jl. Contoh No. 2',
  '089876543210', 'musyrifah@example.com', 'S1', 'Ibu Rumah Tangga',
  '3 tahun sebagai koordinator', 'Pernah memimpin kelompok 10 orang',
  'Sabtu', 'Minggu', 'WIB', 'approved', '2025-01-01'
) ON CONFLICT (id) DO NOTHING;
*/


-- ============================================================================
-- STEP 12: VERIFIKASI — Jalankan setelah semua import selesai
-- ============================================================================
SELECT 'users'                        AS tabel, COUNT(*) AS jumlah FROM public.users
UNION ALL SELECT 'batches',                      COUNT(*) FROM public.batches
UNION ALL SELECT 'programs',                     COUNT(*) FROM public.programs
UNION ALL SELECT 'halaqah',                      COUNT(*) FROM public.halaqah
UNION ALL SELECT 'halaqah_mentors',              COUNT(*) FROM public.halaqah_mentors
UNION ALL SELECT 'halaqah_students',             COUNT(*) FROM public.halaqah_students
UNION ALL SELECT 'pendaftaran_tikrar_tahfidz',   COUNT(*) FROM public.pendaftaran_tikrar_tahfidz
UNION ALL SELECT 'daftar_ulang_submissions',     COUNT(*) FROM public.daftar_ulang_submissions
UNION ALL SELECT 'jurnal_records',               COUNT(*) FROM public.jurnal_records
UNION ALL SELECT 'tashih_records',               COUNT(*) FROM public.tashih_records
UNION ALL SELECT 'muallimah_registrations',      COUNT(*) FROM public.muallimah_registrations
UNION ALL SELECT 'musyrifah_registrations',      COUNT(*) FROM public.musyrifah_registrations
ORDER BY tabel;

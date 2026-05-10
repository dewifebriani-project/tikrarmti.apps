-- Migration: Update merge_users RPC to be comprehensive and fix column errors
-- Updated at: 2026-04-20
-- Description: Atomic migration of ALL related data from one user ID to another.
-- Fixes: "preferred_muallimah_tashih" column location and missing pendaftaran tables.

CREATE OR REPLACE FUNCTION merge_users(source_id UUID, target_id UUID)
RETURNS void AS $$
DECLARE
    row_count INT;
BEGIN
    -- 1. Validasi keberadaan user
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = source_id) THEN
        RAISE EXCEPTION 'User sumber (lama) tidak ditemukan di database.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = target_id) THEN
        RAISE EXCEPTION 'User target (utama) tidak ditemukan di database.';
    END IF;

    -- 2. Migrasi Data - Modul Akademik & Laporan
    -- Jurnal Records
    UPDATE jurnal_records SET user_id = target_id WHERE user_id = source_id;
    
    -- Tashih Records (sebagai thalibah atau sebagai penguji/ustadzah)
    UPDATE tashih_records SET user_id = target_id WHERE user_id = source_id;
    UPDATE tashih_records SET ustadzah_id = target_id WHERE ustadzah_id = source_id;
    
    -- Presensi (sebagai thalibah atau pencatat)
    UPDATE presensi SET thalibah_id = target_id WHERE thalibah_id = source_id;
    UPDATE presensi SET recorded_by = target_id WHERE recorded_by = source_id;

    -- 3. Migrasi Data - Modul Pendaftaran & Batch
    -- Pendaftaran Tikrar Tahfidz
    -- Hapus jika ada duplikat di batch yang sama agar tidak melanggar constraint di tingkat aplikasi
    DELETE FROM pendaftaran_tikrar_tahfidz 
    WHERE user_id = source_id 
    AND (batch_id, program_id) IN (SELECT batch_id, program_id FROM pendaftaran_tikrar_tahfidz WHERE user_id = target_id);
    
    UPDATE pendaftaran_tikrar_tahfidz SET user_id = target_id WHERE user_id = source_id;
    UPDATE pendaftaran_tikrar_tahfidz SET approved_by = target_id WHERE approved_by = source_id;
    UPDATE pendaftaran_tikrar_tahfidz SET oral_assessed_by = target_id WHERE oral_assessed_by = source_id;
    UPDATE pendaftaran_tikrar_tahfidz SET re_enrollment_confirmed_by = target_id WHERE re_enrollment_confirmed_by = source_id;
    
    -- Daftar Ulang Submissions
    DELETE FROM daftar_ulang_submissions 
    WHERE user_id = source_id 
    AND batch_id IN (SELECT batch_id FROM daftar_ulang_submissions WHERE user_id = target_id);
    
    UPDATE daftar_ulang_submissions SET user_id = target_id WHERE user_id = source_id;
    UPDATE daftar_ulang_submissions SET reviewed_by = target_id WHERE reviewed_by = source_id;
    -- Handle both column names if they exist (depending on migration version)
    BEGIN
        UPDATE daftar_ulang_submissions SET partner_user_id = target_id WHERE partner_user_id = source_id;
    EXCEPTION WHEN undefined_column THEN NULL; END;

    -- Ustadzah Preferences (Daftar Ulang)
    UPDATE ustadzah_preferences SET user_id = target_id WHERE user_id = source_id;
    UPDATE ustadzah_preferences SET preferred_muallimah_tashih = target_id WHERE preferred_muallimah_tashih = source_id;
    UPDATE ustadzah_preferences SET preferred_muallimah_ujian = target_id WHERE preferred_muallimah_ujian = source_id;

    -- Partner Preferences (Daftar Ulang)
    UPDATE partner_preferences SET user_id = target_id WHERE user_id = source_id;
    UPDATE partner_preferences SET preferred_partner_id = target_id WHERE preferred_partner_id = source_id;
    
    UPDATE study_partner_preferences SET user_id = target_id WHERE user_id = source_id;
    UPDATE study_partner_preferences SET preferred_partner_id = target_id WHERE preferred_partner_id = source_id;

    -- Akad Commitments (Daftar Ulang)
    UPDATE akad_commitments SET user_id = target_id WHERE user_id = source_id;
    UPDATE akad_commitments SET verified_by = target_id WHERE verified_by = source_id;

    -- 4. Migrasi Data - Modul Halaqah & Student Management
    -- Halaqah (sebagai Muallimah)
    UPDATE halaqah SET muallimah_id = target_id WHERE muallimah_id = source_id;
    
    -- Halaqah Mentors
    UPDATE halaqah_mentors SET mentor_id = target_id WHERE mentor_id = source_id;
    
    -- Halaqah Students
    DELETE FROM halaqah_students 
    WHERE thalibah_id = source_id 
    AND halaqah_id IN (SELECT halaqah_id FROM halaqah_students WHERE thalibah_id = target_id);
    
    UPDATE halaqah_students SET thalibah_id = target_id WHERE thalibah_id = source_id;
    UPDATE halaqah_students SET assigned_by = target_id WHERE assigned_by = source_id;

    -- 5. Migrasi Data - Modul Kedisiplinan (Surat Peringatan)
    UPDATE surat_peringatan SET thalibah_id = target_id WHERE thalibah_id = source_id;
    UPDATE surat_peringatan SET issued_by = target_id WHERE issued_by = source_id;
    
    BEGIN
        UPDATE surat_peringatan SET reviewed_by = target_id WHERE reviewed_by = source_id;
    EXCEPTION WHEN undefined_column THEN NULL; END;
    
    UPDATE sp_history SET thalibah_id = target_id WHERE thalibah_id = source_id;
    UPDATE sp_history SET action_taken_by = target_id WHERE action_taken_by = source_id;

    -- 6. Migrasi Data - Modul Partner & Social
    -- Study Partners (Logika Kompleks: user_1_id < user_2_id)
    UPDATE study_partners SET user_1_id = target_id WHERE user_1_id = source_id;
    UPDATE study_partners SET user_2_id = target_id WHERE user_2_id = source_id;
    UPDATE study_partners SET paired_by = target_id WHERE paired_by = source_id;
    
    -- Perbaiki integritas (jika target_id > user_2_id setelah update, mereka harus ditukar)
    UPDATE study_partners 
    SET user_1_id = LEAST(user_1_id, user_2_id),
        user_2_id = GREATEST(user_1_id, user_2_id)
    WHERE user_1_id = target_id OR user_2_id = target_id;

    -- 7. Migrasi Data - Modul Registrasi Pengajar & Keamanan
    UPDATE muallimah_registrations SET user_id = target_id WHERE user_id = source_id;
    
    BEGIN
        UPDATE muallimah_registrations SET reviewed_by = target_id WHERE reviewed_by = source_id;
    EXCEPTION WHEN undefined_column THEN NULL; END;
    
    UPDATE musyrifah_registrations SET user_id = target_id WHERE user_id = source_id;
    
    BEGIN
        UPDATE musyrifah_registrations SET reviewed_by = target_id WHERE reviewed_by = source_id;
    EXCEPTION WHEN undefined_column THEN NULL; END;
    
    -- Password Reset & Audit Logs
    UPDATE password_reset_otps SET user_id = target_id WHERE user_id = source_id;
    
    UPDATE system_logs SET user_id = target_id WHERE user_id = source_id;
    UPDATE audit_logs SET user_id = target_id WHERE user_id = source_id;
    UPDATE activity_logs SET user_id = target_id WHERE user_id = source_id;
    
    UPDATE error_logs SET resolved_by = target_id WHERE resolved_by = source_id;

    -- 8. Hapus User Lama (Cleanup)
    -- Kita gunakan DELETE di public.users, auth.users akan dihapus oleh API menggunakan Admin API
    DELETE FROM users WHERE id = source_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Gagal menggabungkan user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

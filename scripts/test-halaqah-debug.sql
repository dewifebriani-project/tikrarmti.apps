-- Script test untuk diagnose masalah fungsi analyze_halaqah_availability_by_juz
-- Gunakan batch_id: 4bcb3020-20cb-46e2-8be4-0100f8012a49

-- 1. Cek apakah batch ada
SELECT id, name, status
FROM batches
WHERE id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID;

-- 2. Cek program untuk batch ini
SELECT p.id, p.name, p.juz_selection, p.batch_id
FROM programs p
WHERE p.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID;

-- 3. Cek halaqah untuk batch ini
SELECT h.id, h.name, h.program_id, h.max_students, h.day_of_week, h.status
FROM halaqah h
INNER JOIN programs p ON p.id = h.program_id
WHERE p.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID
  AND h.status = 'active';

-- 4. Cek juz_options
SELECT jo.code, jo.juz_number, jo.name, jo.is_active
FROM juz_options jo
WHERE jo.is_active = true
  AND jo.juz_number IN (28, 29, 30)
ORDER BY jo.juz_number;

-- 5. Cek pendaftaran_tikrar_tahfidz untuk batch ini (selection_status = 'selected')
SELECT pt.id, pt.user_id, pt.chosen_juz, pt.selection_status
FROM pendaftaran_tikrar_tahfidz pt
WHERE pt.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID
  AND pt.selection_status = 'selected';

-- 6. Cek daftar_ulang_submissions untuk batch ini
SELECT dus.id, dus.user_id, dus.status, dus.ujian_halaqah_id, dus.tashih_halaqah_id
FROM daftar_ulang_submissions dus
WHERE dus.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID
  AND dus.status = 'submitted';

-- 7. Cek halaqah_students untuk batch ini
SELECT hs.id, hs.student_id, hs.halaqah_id, hs.status
FROM halaqah_students hs
INNER JOIN halaqah h ON h.id = hs.halaqah_id
INNER JOIN programs p ON p.id = h.program_id
WHERE p.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID
  AND hs.status = 'active';

-- 8. Test panggil fungsi
SELECT * FROM analyze_halaqah_availability_by_juz('4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID);

-- Update semua submission yang punya halaqah_id menjadi approved
UPDATE daftar_ulang_submissions
SET status = 'approved',
    updated_at = NOW()
WHERE status = 'submitted'
  AND (ujian_halaqah_id IS NOT NULL OR tashih_halaqah_id IS NOT NULL);

-- Verifikasi hasil
SELECT
  status,
  COUNT(*) as count
FROM daftar_ulang_submissions
GROUP BY status
ORDER BY status;

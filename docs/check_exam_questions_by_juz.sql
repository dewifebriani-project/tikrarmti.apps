-- Query untuk mengecek distribusi soal berdasarkan juz_number
-- Jalankan ini di Supabase SQL Editor

-- 1. Cek jumlah soal per juz_number
SELECT 
  juz_number,
  COUNT(*) as total_questions,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_questions,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_questions
FROM exam_questions
GROUP BY juz_number
ORDER BY juz_number;

-- 2. Cek distribusi soal per section per juz
SELECT 
  juz_number,
  section_number,
  section_title,
  COUNT(*) as questions_count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
FROM exam_questions
GROUP BY juz_number, section_number, section_title
ORDER BY juz_number, section_number;

-- 3. Sample soal untuk verifikasi (limit 5 per juz)
SELECT 
  juz_number,
  section_title,
  question_number,
  LEFT(question_text, 50) as question_preview,
  is_active
FROM exam_questions
WHERE is_active = true
ORDER BY juz_number, section_number, question_number
LIMIT 20;

-- 4. Cek jika ada soal dengan juz_number yang tidak valid
SELECT 
  juz_number,
  COUNT(*) as count
FROM exam_questions
WHERE juz_number NOT IN (28, 29, 30)
GROUP BY juz_number;

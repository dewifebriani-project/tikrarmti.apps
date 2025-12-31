# Panduan Mapping Juz Ujian

## Logika Mapping Saat Ini

Kode menggunakan **mapping silang** untuk ujian:

| User Mendaftar Untuk | Soal Ujian Yang Keluar |
|---------------------|------------------------|
| Juz 28A / 28B | **Juz 29** |
| Juz 29A / 29B | **Juz 30** |
| Juz 1A / 1B | **Juz 30** |
| Juz 30A / 30B | **Tidak ada ujian** |

## Lokasi Kode

1. **API Fetch Questions**: `app/api/exam/questions/for-user/route.ts` (baris 106-129)
2. **API Submit Exam**: `app/api/exam/attempts/route.ts` (baris 135-157)

## Cara Memverifikasi

### 1. Jalankan Query Check

Jalankan query di `docs/check_exam_questions_by_juz.sql` di Supabase SQL Editor untuk melihat:
- Berapa banyak soal per juz_number
- Section apa saja yang ada
- Sample soal untuk verifikasi

### 2. Cek Data User

```sql
-- Cek user dan chosen_juz mereka
SELECT 
  u.email,
  u.full_name,
  pt.chosen_juz,
  pt.exam_status,
  pt.exam_score,
  pt.exam_juz_number
FROM pendaftaran_tikrar_tahfidz pt
JOIN users u ON pt.user_id = u.id
WHERE pt.chosen_juz IS NOT NULL
ORDER BY pt.created_at DESC;
```

### 3. Cek Soal yang Diambil

```sql
-- Cek exam_attempts untuk melihat juz_number ujian
SELECT 
  ea.user_id,
  u.email,
  ea.juz_number,
  ea.total_questions,
  ea.status,
  ea.submitted_at
FROM exam_attempts ea
JOIN users u ON ea.user_id = u.id
ORDER BY ea.created_at DESC;
```

## Jika Admin Salah Input Soal

### Masalah
Soal tentang Juz 29 di-input dengan `juz_number = 28` (atau sebaliknya)

### Solusi Update Batch

```sql
-- UPDATE juz_number untuk soal yang salah
-- HATI-HATI: Pastikan backup dulu!

-- Contoh: Update semua soal dari juz_number 29 ke 30
-- (jika ternyata soal tersebut adalah soal tentang Juz 30)
UPDATE exam_questions
SET juz_number = 30
WHERE juz_number = 29
AND -- tambah kondisi untuk filter yang tepat
  (section_title LIKE '%Juz 30%' OR 
   question_text LIKE '%Juz 30%' OR
   question_text LIKE '%An-Naba%' OR
   question_text LIKE '%'Abasa%' OR
   question_text LIKE '%An-Nazi''at%');

-- Selalu cek dulu sebelum update:
SELECT COUNT(*) 
FROM exam_questions
WHERE juz_number = 29
AND (section_title LIKE '%Juz 30%' OR 
     question_text LIKE '%Juz 30%');
```

## Ringkasan

1. Jalankan `check_exam_questions_by_juz.sql` untuk cek distribusi soal
2. Jika soal Juz 29 ternyata isinya tentang Juz 30 → admin perlu update `juz_number`
3. Jika user mendaftar Juz 28 tapi keluar soal Juz 29 → ini **BENAR** sesuai logika

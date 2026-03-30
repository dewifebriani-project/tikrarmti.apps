# MIGRASI KE SUPABASE PROJECT BARU

## Project Lama (Source)
- URL: https://nmbvklixthlqtkkgqnjl.supabase.co
- Database: `tikrarmti_apps`

## Project Baru (Target)
- URL: https://lhqbqzrghdbbmstnhple.supabase.co
- Database: `lhqbqzrghdbbmstnhple`

## ⚠️ Baca Dulu: Perbedaan Schema

Schema project baru **berbeda** dari project lama. Jangan copy-paste INSERT langsung.
Lihat `scripts/migrate-old-to-new.sql` untuk panduan lengkap per tabel.

### Perbedaan utama:
| Tabel | Kolom Dihapus | Kolom Ditambah | Constraint Berubah |
|-------|---------------|----------------|-------------------|
| `users` | `is_blacklisted`, `blacklist_reason`, `blacklisted_at`, `blacklist_notes`, `blacklist_by`, `name` | - | Beberapa field jadi NOT NULL |
| `batches` | - | `opening_class_date`, `first_week_*`, `review_week_*`, `final_exam_*`, `graduation_*` | - |
| `jurnal_records` | - | `tikrar_bi_*`, `tarteel_screenshot_url`, dll | FK ke `public.users` (bukan `auth.users`) |
| `tashih_records` | - | `lokasi_detail`, `nama_pemeriksa`, `ustadzah_id`, `jumlah_kesalahan_tajwid` | - |
| `pendaftaran_tikrar_tahfidz` | - | Banyak kolom oral/exam/re-enrollment | - |

## Langkah 1: Setup Schema di Project Baru

Jalankan migration files berikut di project baru (urutan penting):
1. `20260329_create_base_tables_v2.sql` — batches, programs, halaqah, tashih, muallimah/musyrifah registrations
2. `20260329_create_pendaftaran_tikrar_tahfidz_table.sql`
3. `20260329_recreate_daftar_ulang_submissions_old_structure.sql`
4. `20260329_create_exam_attempts_table.sql`
5. Migration RLS policies yang relevan

Atau gunakan CLI:
```bash
npx supabase db push --db-url "postgresql://postgres:YOUR_PASSWORD@db.lhqbqzrghdbbmstnhple.supabase.co:5432/postgres"
```

## Langkah 2: Migrasi Data (ORDER MATTER!)

### 2.1. users table (public.users) — WAJIB GUNAKAN SCRIPT KHUSUS
```bash
# Export CSV dari Supabase lama: Table Editor → users → Download CSV
# Simpan sebagai: scripts/users_rows.csv
# Kemudian:
node scripts/migrate-users-new-schema.js
# Output: scripts/users_insert_new_schema.sql
# Jalankan file SQL tersebut di project baru
```

**Jangan** gunakan `SELECT * FROM users` karena ada kolom blacklist yang tidak ada di project baru.

### 2.2. batches table
```sql
-- Export dari project lama (gunakan SELECT spesifik, BUKAN SELECT *):
SELECT id, name, description, start_date, end_date,
       registration_start_date, registration_end_date,
       status, created_at, updated_at, duration_weeks, is_free, price,
       total_quota, program_type, selection_start_date, selection_end_date,
       selection_result_date, re_enrollment_date, registered_count
FROM public.batches ORDER BY created_at;
-- Kolom baru di project baru (opening_class_date, dll) akan default NULL
```

### 2.3. programs table
```sql
SELECT id, batch_id, name, description, target_level, duration_weeks,
       max_thalibah, status, created_at, updated_at, class_type
FROM public.programs ORDER BY created_at;
```

### 2.4. halaqah, halaqah_students, halaqah_mentors
```sql
SELECT id, program_id, name, description, day_of_week, start_time, end_time,
       location, max_students, status, created_at, updated_at,
       zoom_link, muallimah_id, waitlist_max, preferred_juz
FROM public.halaqah ORDER BY created_at;

SELECT id, halaqah_id, thalibah_id, assigned_at, assigned_by, status
FROM public.halaqah_students ORDER BY created_at;

SELECT id, halaqah_id, mentor_id, role, is_primary, assigned_at
FROM public.halaqah_mentors ORDER BY assigned_at;
```

### 2.5. pendaftaran_tikrar_tahfidz (registrations)
```sql
-- Gunakan SELECT spesifik (lihat scripts/migrate-old-to-new.sql untuk daftar kolom)
SELECT id, user_id, batch_id, program_id, email, full_name, address,
       wa_phone, telegram_phone, chosen_juz, main_time_slot, backup_time_slot,
       status, selection_status, approved_by, approved_at, created_at, updated_at,
       submission_date, oral_submission_url, written_quiz_answers,
       oral_assessment_status, exam_status, re_enrollment_completed
       -- ... (lihat migrate-old-to-new.sql untuk daftar lengkap)
FROM public.pendaftaran_tikrar_tahfidz ORDER BY created_at;
```

### 2.6. daftar_ulang_submissions
```sql
-- Struktur project baru menggunakan registration_id-based
-- Lihat scripts/migrate-old-to-new.sql Step 7
SELECT id, user_id, registration_id, batch_id, confirmed_full_name,
       confirmed_chosen_juz, confirmed_main_time_slot, confirmed_backup_time_slot,
       confirmed_wa_phone, partner_type, status, created_at, updated_at
       -- ... (lihat migrate-old-to-new.sql untuk daftar lengkap)
FROM public.daftar_ulang_submissions ORDER BY created_at;
```

### 2.7. jurnal_records
```sql
-- ⚠️ FK berubah: user_id FK ke public.users (bukan auth.users)
-- Biasanya ID sama, tapi verifikasi dulu
SELECT id, user_id, tanggal_jurnal, tanggal_setor, tashih_completed,
       murajaah_count, created_at, updated_at, catatan_tambahan, juz_code, blok
       -- ... (kolom extended jika ada)
FROM public.jurnal_records ORDER BY created_at;
```

### 2.8. tashih_records
```sql
-- Kolom baru di project baru: lokasi_detail, nama_pemeriksa, ustadzah_id, jumlah_kesalahan_tajwid
SELECT id, user_id, blok, lokasi, masalah_tajwid, catatan_tambahan,
       waktu_tashih, created_at, updated_at
       -- lokasi_detail, nama_pemeriksa, ustadzah_id jika ada di lama
FROM public.tashih_records ORDER BY created_at;
```

### 2.9. exam tables
```sql
SELECT id, name, description, duration_minutes, start_time, end_time,
       max_attempts, passing_score, status, created_at
FROM public.exam_configurations ORDER BY created_at;

SELECT id, user_id, registration_id, juz_number, started_at, submitted_at,
       answers, total_questions, correct_answers, score, status, created_at
FROM public.exam_attempts ORDER BY created_at;
```

### 2.10. muallimah & musyrifah registrations
```sql
-- Lihat scripts/migrate-old-to-new.sql Step 11 untuk daftar kolom lengkap
SELECT * FROM public.muallimah_registrations ORDER BY submitted_at;
SELECT * FROM public.musyrifah_registrations ORDER BY submitted_at;
```

## Langkah 2.11: Verifikasi Jumlah Data

Setelah semua import, jalankan query verifikasi di project baru (lihat `scripts/migrate-old-to-new.sql` Step 12).
Bandingkan hasilnya dengan jumlah yang sama di project lama.

## Langkah 3: Auth Users (auth.users)

Ini lebih kompleks. Opsi:

### Opsi A: Re-create users manually (simplest)
- User register ulang dengan Google/email
- Data di public.users sudah ada, tinggal link ke auth.users yang baru

### Opsi B: Export/Import auth (complex but complete)
```sql
-- Di project lama:
SELECT id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, raw_app_meta_data
FROM auth.users
WHERE email IN (SELECT DISTINCT email FROM public.users);
```

## Langkah 4: Update .env.local

```env
NEXT_PUBLIC_SUPABASE_URL="https://lhqbqzrghdbbmstnhple.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # PASTIKAN INI SERVICE ROLE KEY!
```

## Langkah 5: Verify

1. Test login dengan Google/email
2. Cek admin users page — verifikasi user count cocok
3. Test flow pendaftaran
4. Test daftar ulang flow
5. Cek jurnal harian — verifikasi data tampil dengan benar
6. Cek role admin bekerja (akses halaman admin)

## Troubleshooting

Lihat bagian TROUBLESHOOTING di `scripts/migrate-old-to-new.sql` untuk solusi error umum:
- `null value in column X violates not-null constraint`
- `insert or update on table X violates foreign key constraint`
- `duplicate key value violates unique constraint`
- `value too long for type character varying`

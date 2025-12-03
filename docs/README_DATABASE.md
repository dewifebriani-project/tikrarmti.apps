# Database Schema Tikrar MTI

Dokumentasi lengkap skema database untuk Tikrar MTI Apps yang dirancang untuk mengelola batch, program, halaqah, dan pendaftaran thalibah.

## 📋 Overview

Tikrar MTI Apps menggunakan Supabase sebagai backend dengan struktur database yang mendukung:
- Manajemen batch (periode program)
- Manajemen program dalam batch
- Manajemen halaqah dalam program
- Sistem pendaftaran thalibah
- Assignment mentor (ustadzah/musyrifah) ke halaqah
- Tracking presensi thalibah

## 🗄️ Struktur Database

### 1. Tabel `users`
Menyimpan data pengguna aplikasi (thalibah, musyrifah, muallimah, admin).

```sql
- id: UUID (Primary Key)
- email: VARCHAR(255) (Unique, Not Null)
- password_hash: VARCHAR(255) (Not Null)
- full_name: VARCHAR(255) (Not Null)
- phone: VARCHAR(20)
- role: ENUM('thalibah', 'musyrifah', 'muallimah', 'admin') (Not Null)
- avatar_url: TEXT
- is_active: BOOLEAN (Default: true)
- created_at: TIMESTAMP WITH TIME ZONE
- updated_at: TIMESTAMP WITH TIME ZONE
```

### 2. Tabel `batches`
Menyimpan data batch/periode program.

```sql
- id: UUID (Primary Key)
- name: VARCHAR(255) (Not Null)
- description: TEXT
- start_date: DATE (Not Null)
- end_date: DATE (Not Null)
- registration_start_date: TIMESTAMP WITH TIME ZONE
- registration_end_date: TIMESTAMP WITH TIME ZONE
- status: ENUM('draft', 'open', 'closed', 'archived') (Default: 'draft')
- created_at: TIMESTAMP WITH TIME ZONE
- updated_at: TIMESTAMP WITH TIME ZONE
```

### 3. Tabel `programs`
Menyimpan data program belajar dalam batch.

```sql
- id: UUID (Primary Key)
- batch_id: UUID (Foreign Key → batches.id)
- name: VARCHAR(255) (Not Null)
- description: TEXT
- target_level: VARCHAR(50)
- duration_weeks: INTEGER
- max_thalibah: INTEGER
- status: ENUM('draft', 'open', 'ongoing', 'completed', 'cancelled') (Default: 'draft')
- created_at: TIMESTAMP WITH TIME ZONE
- updated_at: TIMESTAMP WITH TIME ZONE
```

### 4. Tabel `halaqah`
Menyimpan data grup belajar (halaqah) dalam program.

```sql
- id: UUID (Primary Key)
- program_id: UUID (Foreign Key → programs.id)
- name: VARCHAR(255) (Not Null)
- description: TEXT
- day_of_week: INTEGER (Check: 1-7)
- start_time: TIME
- end_time: TIME
- location: VARCHAR(255)
- max_students: INTEGER (Default: 20)
- status: ENUM('active', 'inactive', 'suspended') (Default: 'active')
- created_at: TIMESTAMP WITH TIME ZONE
- updated_at: TIMESTAMP WITH TIME ZONE
```

### 5. Tabel `pendaftaran`
Menyimpan data pendaftaran thalibah ke program.

```sql
- id: UUID (Primary Key)
- thalibah_id: UUID (Foreign Key → users.id)
- program_id: UUID (Foreign Key → programs.id)
- batch_id: UUID (Foreign Key → batches.id)
- registration_date: TIMESTAMP WITH TIME ZONE (Default: CURRENT_TIMESTAMP)
- status: ENUM('pending', 'approved', 'rejected', 'withdrawn', 'completed') (Default: 'pending')
- notes: TEXT
- approved_by: UUID (Foreign Key → users.id)
- approved_at: TIMESTAMP WITH TIME ZONE
- created_at: TIMESTAMP WITH TIME ZONE
- updated_at: TIMESTAMP WITH TIME ZONE
- UNIQUE(thalibah_id, program_id, batch_id)
```

### 6. Tabel `halaqah_mentors`
Relasi many-to-many antara halaqah dan mentors (ustadzah/musyrifah).

```sql
- id: UUID (Primary Key)
- halaqah_id: UUID (Foreign Key → halaqah.id)
- mentor_id: UUID (Foreign Key → users.id)
- role: ENUM('ustadzah', 'musyrifah') (Not Null)
- is_primary: BOOLEAN (Default: false)
- assigned_at: TIMESTAMP WITH TIME ZONE (Default: CURRENT_TIMESTAMP)
- UNIQUE(halaqah_id, mentor_id, role)
```

### 7. Tabel `halaqah_students`
Menyimpan assignment thalibah ke halaqah tertentu.

```sql
- id: UUID (Primary Key)
- halaqah_id: UUID (Foreign Key → halaqah.id)
- thalibah_id: UUID (Foreign Key → users.id)
- assigned_at: TIMESTAMP WITH TIME ZONE (Default: CURRENT_TIMESTAMP)
- assigned_by: UUID (Foreign Key → users.id)
- status: ENUM('active', 'transferred', 'graduated', 'dropped') (Default: 'active')
- UNIQUE(halaqah_id, thalibah_id)
```

### 8. Tabel `presensi`
Menyimpan data kehadiran thalibah di halaqah.

```sql
- id: UUID (Primary Key)
- halaqah_id: UUID (Foreign Key → halaqah.id)
- thalibah_id: UUID (Foreign Key → users.id)
- date: DATE (Not Null)
- status: ENUM('hadir', 'izin', 'sakit', 'alpha') (Not Null)
- notes: TEXT
- recorded_by: UUID (Foreign Key → users.id)
- recorded_at: TIMESTAMP WITH TIME ZONE (Default: CURRENT_TIMESTAMP)
- UNIQUE(halaqah_id, thalibah_id, date)
```

## 🔗 Relasi Antar Tabel

```
users (1) ←→ (N) pendaftaran (N) ←→ (1) programs (N) ←→ (1) batches
users (1) ←→ (N) halaqah_mentors (N) ←→ (1) halaqah (N) ←→ (1) programs
users (1) ←→ (N) halaqah_students (N) ←→ (1) halaqah
users (1) ←→ (N) presensi (N) ←→ (1) halaqah
```

## 🎯 Alur Bisnis Utama

### 1. Alur Batch → Program → Halaqah
1. **Admin** membuat **Batch** (periode waktu)
2. **Admin** membuat **Program** dalam batch tersebut
3. **Admin** membuat **Halaqah** dalam program tersebut
4. **Admin** assign **Mentors** ke halaqah

### 2. Alur Pendaftaran Thalibah
1. **Thalibah** register akun dan login
2. **Thalibah** melihat program yang tersedia (status: open)
3. **Thalibah** mendaftar ke program yang diminati
4. **Admin/Mentor** approve/reject pendaftaran
5. Jika approved, **Thalibah** bisa di-assign ke halaqah

### 3. Alur Presensi
1. **Mentor** mencatat presensi thalibah di halaqah
2. **Thalibah** bisa melihat rekaman presensi mereka
3. **Admin** bisa generate laporan presensi

## 🔐 Security & Access Control

### Row Level Security (RLS)
Semua tabel mengaktifkan RLS dengan policies:
- **Users**: Hanya bisa lihat/update data sendiri
- **Batches/Programs/Halaqah**: Public read access untuk status aktif
- **Pendaftaran**:
  - Thalibah hanya bisa lihat pendaftaran sendiri
  - Admin bisa lihat semua pendaftaran
  - Mentor bisa lihat pendaftaran di halaqah yang ditugani
- **Halaqah Mentors/Students**:
  - Mentor hanya bisa akses halaqah yang ditugani
  - Student hanya bisa akses halaqah tempat mereka terdaftar
- **Presensi**:
  - Student hanya bisa lihat presensi sendiri
  - Mentor bisa manage presensi di halaqah yang ditugani

## 📱 API Routes

Tersedia API routes untuk:
- `GET/POST /api/batch` - Kelola batch
- `GET/PUT/DELETE /api/batch/[id]` - Detail batch
- `GET/POST /api/program` - Kelola program
- `GET/PUT/DELETE /api/program/[id]` - Detail program
- `GET/POST /api/halaqah` - Kelola halaqah
- `GET/PUT/DELETE /api/halaqah/[id]` - Detail halaqah
- `POST /api/halaqah/[id]/mentors` - Assign mentor
- `GET/POST /api/pendaftaran` - Kelola pendaftaran
- `POST /api/pendaftaran/[id]/approve` - Approve pendaftaran
- `POST /api/pendaftaran/[id]/reject` - Reject pendaftaran
- `GET/POST /api/presensi` - Kelola presensi

## 🚀 Implementasi

### 1. Setup Supabase
1. Buat project Supabase baru
2. Jalankan SQL script `database_schema.sql`
3. Setup environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 2. Install Dependencies
```bash
npm install @supabase/supabase-js
```

### 3. Setup Authentication
Gunakan Supabase Auth untuk:
- Register/login dengan email & password
- Google OAuth integration
- Session management

### 4. Pages/Components
Gunakan komponen yang sudah disediakan:
- `BatchPage` - Manajemen batch
- `ProgramPage` - Manajemen program
- `HalaqahPage` - Manajemen halaqah
- `PendaftaranPage` - Manajemen pendaftaran

## 🔧 Maintenance

### Backup & Migration
- Setup automated backup di Supabase
- Gunakan Supabase migrations untuk schema changes
- Monitor storage usage dan bandwidth

### Monitoring
- Track query performance
- Monitor error rates
- Setup alerts untuk critical failures

### Scaling
- Consider edge functions untuk complex logic
- Implement proper indexing untuk large datasets
- Use CDN untuk static assets

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
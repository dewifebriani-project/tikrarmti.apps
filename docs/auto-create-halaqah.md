# Auto Create Halaqah - Dokumentasi

## Deskripsi

Fitur Auto Create Halaqah memungkinkan admin untuk membuat halaqah secara otomatis untuk setiap muallimah yang sudah diapprove dalam suatu batch tertentu.

## Arsitektur

### Database Schema

#### Tabel Halaqah
```sql
CREATE TABLE halaqah (
  id uuid PRIMARY KEY,
  program_id uuid REFERENCES programs(id),  -- Nullable: assigned by admin after halaqah creation
  muallimah_id uuid REFERENCES users(id),
  name varchar NOT NULL,
  description text,
  day_of_week integer CHECK (day_of_week >= 1 AND day_of_week <= 7),
  start_time time,
  end_time time,
  location varchar,
  max_students integer DEFAULT 20,
  waitlist_max integer DEFAULT 5,
  preferred_juz text,
  zoom_link text,
  status varchar DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### Tabel Halaqah Mentors
```sql
CREATE TABLE halaqah_mentors (
  id uuid PRIMARY KEY,
  halaqah_id uuid NOT NULL REFERENCES halaqah(id),
  mentor_id uuid NOT NULL REFERENCES users(id),
  role varchar NOT NULL CHECK (role IN ('ustadzah', 'musyrifah')),
  is_primary boolean DEFAULT false,
  assigned_at timestamptz DEFAULT now()
);
```

#### Tabel Halaqah Students
```sql
CREATE TABLE halaqah_students (
  id uuid PRIMARY KEY,
  halaqah_id uuid NOT NULL REFERENCES halaqah(id),
  thalibah_id uuid NOT NULL REFERENCES users(id),
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES users(id),
  status varchar DEFAULT 'active' CHECK (status IN ('active', 'waitlist', 'graduated', 'dropped')),
  enrollment_type text DEFAULT 'new' CHECK (enrollment_type IN ('new', 're_enrollment')),
  previous_halaqah_id uuid REFERENCES halaqah(id),
  re_enrollment_batch_id uuid REFERENCES batches(id),
  joined_waitlist_at timestamptz,
  promoted_from_waitlist_at timestamptz
);
```

### Flow Process

```
1. Admin membuka modal "Auto Create Halaqah"
   │
   ├─> Pilih Batch (hanya batch dengan status 'open')
   │
   ├─> Pilih Program (program dengan status 'open' atau 'ongoing')
   │
   └─> Klik "Auto Create Halaqah"
       │
       ├─> Sistem query semua muallimah dengan status 'approved' di batch terpilih
       │
       ├─> Untuk setiap muallimah:
       │   │
       │   ├─> Cek apakah sudah ada halaqah untuk muallimah tersebut di program terpilih
       │   │   ├─> Jika sudah ada: Skip (warning)
       │   │   └─> Jika belum ada: Lanjut create
       │   │
       │   ├─> Note: preferred_schedule adalah text field, bukan tabel
       │   │
       │   ├─> Create halaqah baru dengan data:
       │   │   ├─> program_id: NULL (akan diisi manual nanti)
       │   │   ├─> muallimah_id: dari muallimah.user_id
       │   │   ├─> name: "Halaqah {nama_muallimah}"
       │   │   ├─> description: "Halaqah diampu oleh {nama_muallimah}"
       │   │   ├─> day_of_week: NULL (akan diisi manual nanti)
       │   │   ├─> start_time: NULL (akan diisi manual nanti)
       │   │   ├─> end_time: NULL (akan diisi manual nanti)
       │   │   ├─> max_students: dari muallimah.preferred_max_thalibah atau 20
       │   │   ├─> waitlist_max: 5 (default)
       │   │   ├─> preferred_juz: dari muallimah.preferred_juz
       │   │   └─> status: 'active'
       │   │
       │   └─> Create entry di halaqah_mentors:
       │       ├─> halaqah_id: dari halaqah baru
       │       ├─> mentor_id: dari muallimah.user_id
       │       ├─> role: 'ustadzah'
       │       └─> is_primary: true
       │
       └─> Tampilkan hasil (success count, failed count, details)
```

## Role dan Akses

### Muallimah
- Dapat melihat halaqah yang mereka ampu
- Dapat melihat dan mengelola zoom link untuk halaqah mereka
- Dapat melihat daftar thalibah di halaqah mereka
- Tidak dapat membuat atau menghapus halaqah

### Musyrifah
- Dapat ditambahkan ke halaqah sebagai mentor dengan role 'musyrifah'
- Satu halaqah bisa memiliki lebih dari 1 musyrifah
- Dapat membantu muallimah dalam pengelolaan kelas
- Dapat melihat zoom link halaqah yang mereka bantu
- Dapat melihat daftar thalibah di halaqah tersebut

### Thalibah
- Memilih halaqah saat daftar ulang di menu "Perjalanan Saya"
- Jika kuota halaqah sudah penuh, tidak dapat memilih halaqah tersebut
- Dapat melihat zoom link halaqah yang mereka ikuti
- Status enrollment: 'active', 'waitlist', 'graduated', 'dropped'

### Admin
- Akses penuh untuk membuat, mengedit, dan menghapus halaqah
- Dapat menggunakan fitur "Auto Create Halaqah"
- Dapat mengelola assignment thalibah ke halaqah
- Dapat menambah/mengurangi musyrifah di halaqah

## Kuota dan Waitlist

### Kuota Halaqah
- `max_students`: Maksimal thalibah aktif dalam halaqah
- Diambil dari `preferred_max_thalibah` di muallimah registration (default: 20)
- Ketika kuota terpenuhi, halaqah terkunci untuk pendaftaran baru

### Waitlist
- `waitlist_max`: Maksimal thalibah dalam waitlist (default: 5)
- Thalibah bisa join waitlist jika halaqah penuh
- Status di `halaqah_students`: 'waitlist'
- Field tracking:
  - `joined_waitlist_at`: Timestamp saat join waitlist
  - `promoted_from_waitlist_at`: Timestamp saat dipromosikan ke active

## Zoom Link Management

### Akses Zoom Link
Zoom link dapat diakses oleh:
1. **Muallimah** yang mengampu halaqah
2. **Musyrifah** yang membantu di halaqah
3. **Thalibah** yang terdaftar aktif di halaqah
4. **Admin** (semua halaqah)

### Input Manual
- Saat ini zoom link diinput manual oleh muallimah atau admin
- Field: `halaqah.zoom_link` (text)
- Format bebas (bisa zoom meeting link, google meet, atau platform lain)

### Future Enhancement
- Auto-generate zoom meeting via Zoom API
- Recurring meeting schedule
- Calendar integration

## Re-enrollment

### Flow Re-enrollment
```
1. Thalibah yang sudah lulus batch sebelumnya dapat re-enroll
   │
   ├─> Status di pendaftaran: `re_enrollment_completed = true`
   │
   ├─> Saat memilih halaqah di daftar ulang:
   │   ├─> `enrollment_type` di-set 're_enrollment'
   │   ├─> `previous_halaqah_id` di-set ke halaqah batch sebelumnya
   │   └─> `re_enrollment_batch_id` di-set ke batch baru
   │
   └─> Dapat memilih muallimah yang sama atau berbeda
```

## RLS Policies

### Halaqah Table
```sql
-- Muallimah can see own halaqah
CREATE POLICY "Muallimah can see own halaqah"
ON halaqah FOR SELECT
USING (
  muallimah_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM halaqah_mentors
    WHERE halaqah_id = halaqah.id AND mentor_id = auth.uid()
  )
);

-- Students can see their halaqah
CREATE POLICY "Students can see their halaqah"
ON halaqah FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM halaqah_students
    WHERE halaqah_students.halaqah_id = halaqah.id
    AND halaqah_students.thalibah_id = auth.uid()
    AND halaqah_students.status = 'active'
  )
);

-- Admin can manage all halaqah
CREATE POLICY "Admin can manage all halaqah"
ON halaqah FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND 'admin' = ANY(users.roles)
  )
);
```

### Halaqah Students Table
```sql
-- Students can see own enrollment
CREATE POLICY "Students can see own enrollment"
ON halaqah_students FOR SELECT
USING (thalibah_id = auth.uid());

-- Muallimah can see students in their halaqah
CREATE POLICY "Muallimah can see students in their halaqah"
ON halaqah_students FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM halaqah
    WHERE halaqah.id = halaqah_students.halaqah_id
    AND halaqah.muallimah_id = auth.uid()
  )
);

-- Admin can manage all
CREATE POLICY "Admin can manage all halaqah_students"
ON halaqah_students FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND 'admin' = ANY(users.roles)
  )
);
```

## Komponen

### AutoCreateHalaqahModal
**Path**: `components/AutoCreateHalaqahModal.tsx`

**Props**:
- `onClose: () => void` - Callback saat modal ditutup
- `onSuccess: () => void` - Callback saat berhasil create halaqah

**Features**:
- Batch selection (filter hanya batch 'open')
- Program selection (filter hanya program 'open' atau 'ongoing')
- Auto create halaqah untuk semua muallimah approved
- Result summary (success count, failed count, details)

### HalaqahManagementTab
**Path**: `components/HalaqahManagementTab.tsx`

**Features**:
- List halaqah dengan filtering (batch, program, status)
- View halaqah details
- View students in halaqah
- Auto create halaqah button
- Delete halaqah
- Change halaqah status

## API Endpoints

Tidak ada API endpoint khusus untuk auto create halaqah. Semua operasi dilakukan melalui Supabase client di component dengan memanfaatkan RLS policies.

## Testing Checklist

- [ ] Auto create halaqah untuk batch dengan muallimah approved
- [ ] Skip halaqah yang sudah ada (tidak duplicate)
- [ ] Halaqah terbuat dengan data yang benar:
  - [ ] program_id sesuai
  - [ ] muallimah_id sesuai
  - [ ] jadwal dari muallimah_schedules
  - [ ] max_students dari preferred_max_thalibah
  - [ ] preferred_juz dari muallimah
- [ ] Entry di halaqah_mentors terbuat dengan role 'ustadzah'
- [ ] Result summary menampilkan success dan failed count
- [ ] Refresh halaqah list setelah auto create
- [ ] RLS policies berfungsi:
  - [ ] Muallimah hanya bisa lihat halaqah sendiri
  - [ ] Thalibah hanya bisa lihat halaqah yang diikuti
  - [ ] Admin bisa lihat semua halaqah
- [ ] Zoom link bisa diinput dan dilihat sesuai role

## Known Limitations

1. **Zoom Link Manual**: Saat ini zoom link harus diinput manual
2. **Schedule Conflict Detection**: Belum ada detection untuk konflik jadwal muallimah
3. **Auto Assignment**: Thalibah harus manual memilih halaqah saat re-enrollment
4. **Waitlist Promotion**: Belum ada auto-promote dari waitlist ke active

## Future Enhancements

1. **Zoom API Integration**: Auto-generate zoom meeting
2. **Smart Assignment**: Algorithm untuk auto-assign thalibah ke halaqah berdasarkan:
   - Preferred juz
   - Time preference
   - Previous muallimah (for re-enrollment)
3. **Schedule Conflict Detection**: Warning jika ada konflik jadwal
4. **Waitlist Auto-Promotion**: Auto-promote dari waitlist ketika ada slot kosong
5. **Notification System**: Notifikasi ke muallimah dan thalibah
6. **Analytics Dashboard**: Statistik halaqah, attendance, dll.

## Referensi

- Database Schema: `docs/database_schema.md`
- Arsitektur: `docs/arsitektur.md`
- Migration Files:
  - `supabase/migrations/20260102_add_halaqah_scheduling_system.sql`
  - `supabase/migrations/20260103_add_halaqah_zoom_link.sql`
  - `supabase/migrations/20260104_make_program_id_nullable.sql`

## Migration Required

Sebelum menggunakan fitur Auto Create Halaqah, jalankan migration berikut di Supabase SQL Editor:

```sql
-- Migration: Make halaqah.program_id nullable
-- Alasan: Halaqah dibuat terlebih dahulu tanpa program, kemudian program ditambahkan manual oleh admin

ALTER TABLE public.halaqah ALTER COLUMN program_id DROP NOT NULL;

-- Verify the change
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'halaqah'
  AND column_name = 'program_id';
```

Setelah migration berhasil, `is_nullable` untuk kolom `program_id` harus bernilai `YES`.

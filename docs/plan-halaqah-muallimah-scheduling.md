# Plan: Sistem Halaqah & Penjadwalan Muallimah

## Overview
Membuat sistem penjadwalan halaqah untuk muallimah yang sudah di-approve, dimana:
1. Admin bisa membuat halaqah (kelas) berdasarkan data muallimah yang sudah di-approve
2. Jadwal dan max thalibah mengikuti preferensi dari data `muallimah_registrations`
3. Thalibah yang sudah lulus bisa memilih kelas dan muallimah (re-enrollment)

## Gambaran Alur

### Alur 1: Pembuatan Halaqah oleh Admin (Scheduling)
```
Admin -> Daftar Muallimah Approved -> Buat Halaqah -> Assign Muallimah -> Buka untuk Thalibah
```

### Alur 2: Re-enrollment Thalibah yang Lulus
```
Thalibah Lulus -> Pilih Batch Baru -> Pilih Halaqah -> Join Kelas
```

---

## Database Schema Changes Needed

### 1. Update `halaqah` table
Kolom yang sudah ada:
- `id`, `program_id`, `name`, `description`
- `day_of_week`, `start_time`, `end_time`
- `location`, `max_students`, `status`

Perlu ditambahkan:
- `muallimah_id` (uuid) - Reference ke user (muallimah) utama
- `preferred_juz` (text) - Juz yang diajar di halaqah ini
- `max_thalibah_override` (integer) - Override max thalibah dari default muallimah

Catatan: `class_type` sudah ada di tabel `programs`, tidak perlu ditambahkan di sini.
Relasi ke `programs` sudah ada melalui `program_id`.

### 2. Update `halaqah_mentors` table
Sudah ada: `halaqah_id`, `mentor_id`, `role`, `is_primary`

Perlu ditambahkan:
- `teaching_role` (text) - Untuk membedakan muallimah utama vs pendamping

### 3. Update `halaqah_students` table
Sudah ada: `halaqah_id`, `thalibah_id`, `assigned_at`, `assigned_by`, `status`

Perlu ditambahkan:
- `enrollment_type` (text) - 'new' atau 're_enrollment'
- `previous_halaqah_id` (uuid) - Untuk tracking transfer
- `re_enrollment_batch_id` (uuid) - Batch saat re-enrollment

### 4. Buat table `halaqah_preferences` (opsional)
Untuk menyimpan preferensi thalibah saat memilih kelas:
- `id` (uuid)
- `thalibah_id` (uuid)
- `batch_id` (uuid)
- `preferred_halaqah_ids` (jsonb/array)
- `preferred_muallimah_ids` (jsonb/array)
- `preferred_schedule` (text)
- `created_at`, `updated_at`

---

## API Routes Needed

### 1. GET/POST `api/halaqah` (Update existing)
- GET: List halaqah dengan filter muallimah, batch, juz
- POST: Buat halaqah baru dari data muallimah

### 2. POST `api/halaqah/auto-create` (NEW)
- Auto-create semua halaqah dari muallimah approved untuk batch tertentu
- Body: `{ batch_id, program_id }`
- Response: `{ created: number, skipped: number, errors: array }`

### 3. POST `api/halaqah/[id]/assign-muallimah`
- Assign muallimah ke halaqah
- Body: `{ muallimah_id, role, is_primary }`

### 4. GET `api/halaqah/available-for-thalibah` (UPDATED)
- Untuk thalibah yang lulus, list halaqah yang available
- Filter: batch_id, juz, schedule, eligibility
- Eligibility check:
  ```typescript
  // Graduation criteria:
  const isGraduated =
    oral_assessment_status === 'pass' &&
    (exam_juz_number === 30 || exam_status === 'completed');

  // Program eligibility:
  let eligiblePrograms = ['tashih_ujian', 'tashih_only', 'ujian_only'];
  if (!isGraduated) {
    eligiblePrograms = ['pra_tahfidz'];
  }
  ```

### 5. POST `api/halaqah/[id]/join` (UPDATED)
- Thalibah join halaqah (re-enrollment)
- Body: `{ thalibah_id, enrollment_type }`
- Logic:
  - Cek capacity halaqah
  - Jika penuh, masukkan ke waitlist
  - Return status: `'joined'`, `'waitlisted'`, `'error'`

### 6. POST `api/halaqah/[id]/leave`
- Thalibah keluar dari halaqah
- Otomatis promote dari waitlist ke active jika ada slot kosong

### 7. POST `api/halaqah/[id]/promote-waitlist`
- Admin manual promote waitlist ke active
- Biasanya auto-trigger ketika thalibah lain leave

### 8. GET `api/halaqah/muallimah-schedule`
- Get schedule berdasarkan muallimah_id
- Untuk admin create halaqah from muallimah data
- Data dari `muallimah_schedules` table (normalized)

### 9. POST `api/muallimah-registrations/[id]/normalize-schedule` (NEW)
- Normalize schedule dari JSON string ke `muallimah_schedules` table
- Dipanggil saat registration dibuat/updated

---

## Frontend Components Needed

### 1. Admin: Halaqah Management (New Tab in Admin)

#### 1.1. `HalaqahManagementTab`
Location: `app/(protected)/admin/page.tsx` - Add new tab

Features:
- List halaqah dengan filter
- **[Auto-Create All]** button untuk batch operation
- Create halaqah from muallimah (single)
- Assign/remove muallimah
- View students & waitlist in halaqah
- Activate/deactivate halaqah
- Promote waitlist to active

#### 1.2. `AutoCreateHalaqahModal` (NEW)
Components:
- Select batch & program
- Preview: berapa halaqah yang akan dibuat
- List muallimah approved yang akan dibuatkan halaqah
- Checkbox untuk select/deselect specific muallimah
- Button: "Create X Halaqah"
- Progress indicator during creation
- Result summary: Created, Skipped, Errors

#### 1.3. `CreateHalaqahFromMuallimahModal`
Components:
- Select muallimah (approved only)
- Auto-fill form dari `muallimah_schedules` (normalized):
  - `day_of_week`, `start_time`, `end_time` → dari table muallimah_schedules
  - `preferred_juz` → `preferred_juz`
  - `preferred_max_thalibah` → `max_students`
  - `class_type` → filter `programs` yang sesuai
- Manual override jika diperlukan
- Select program & batch (program sudah mengandung class_type)

#### 1.4. `HalaqahStudentsList` (UPDATED)
Location: `components/admin/`

Features:
- List active students
- **List waitlist students** (NEW)
- Count: Active X/Y, Waitlist: Z
- Button: "Promote" untuk waitlist students
- Visual indicator untuk halaqah penuh

### 2. Admin: Muallimah Scheduling (New Section)

#### 2.1. `MuallimahSchedulingView`
Location: Could be in admin page or separate

Features:
- List muallimah approved
- Show normalized schedule preferences (dari muallimah_schedules table)
- Button "Create Halaqah" for each muallimah
- Show existing halaqah for each muallimah
- Indicator: halaqah created/pending

### 3. Thalibah: Class Selection (Re-enrollment)

#### 3.1. Update `perjalanan-saya` page
Add section for graduated thalibah:
- Check graduation status:
  - `oral_assessment_status === 'pass'`
  - `exam_status === 'completed'` (kecuali juz 30)
- Show eligibility status & available programs
- Jika lulus: Show "Re-enroll to Next Batch" button
- Jika tidak lulus: Show "Join Pra-Tahfidz Program" button
- Show available halaqah dengan filter
- Filter by: program, juz, schedule, muallimah preference

#### 3.2. `HalaqahSelectionModal` (UPDATED)
For thalibah to select halaqah:
- Show eligibility banner (Graduated / Need Pra-Tahfidz)
- Filter available halaqah berdasarkan eligibility
- Show details: program, juz, schedule, muallimah
- **Capacity indicator:**
  - "8/15 spots available" - bisa join
  - "15/15 full - 3 on waitlist" - join waitlist
- Join button dengan label dinamis:
  - "[Join Class →]" - jika ada slot
  - "[Join Waitlist →]" - jika penuh
- Show current waitlist position setelah join waitlist

---

## Pages/Routes Structure

### Admin Routes
```
/admin (existing)
  └── Add "Halaqah" tab
      ├── List all halaqah
      ├── Create from muallimah
      ├── Manage assignments
      └── View students
```

### Thalibah Routes (Update existing)
```
/perjalanan-saya (update)
  └── For graduated thalibah:
      ├── Show "Choose Class" CTA
      └── Modal: Select halaqah
```

### New Route (Optional)
```
/pilih-kelas (new)
  └── Dedicated page for class selection
```

---

## Implementation Steps

### Phase 1: Database & Backend
1. ✅ Review existing schema (halaqah, halaqah_mentors, halaqah_students)
2. **Create migration untuk:**
   - Tambah kolom di `halaqah`: muallimah_id, preferred_juz, max_thalibah_override, waitlist_max
   - Update status constraint di `halaqah_students`: add 'waitlist'
   - Tambah kolom di `halaqah_students`: enrollment_type, joined_waitlist_at, promoted_from_waitlist_at
   - **Buat table `muallimah_schedules`** untuk normalize schedule
3. Create/update RLS policies
4. Create API routes:
   - `/api/halaqah/auto-create`
   - `/api/halaqah/[id]/join` dengan waitlist logic
   - `/api/halaqah/[id]/promote-waitlist`
   - `/api/halaqah/available-for-thalibah` dengan eligibility check
   - `/api/muallimah-registrations/[id]/normalize-schedule`

### Phase 2: Admin Interface
1. Create `HalaqahManagementTab` component
2. Create `AutoCreateHalaqahModal` component
3. Create `CreateHalaqahFromMuallimahModal` component (pakai normalized schedule)
4. Create `HalaqahStudentsList` component (dengan waitlist section)
5. Add halaqah tab to admin page
6. Implement CRUD halaqah
7. Implement auto-create batch operation
8. Implement waitlist management

### Phase 3: Thalibah Interface
1. Update `perjalanan-saya` page dengan graduation check
2. Create `HalaqahSelectionModal` dengan eligibility logic
3. Implement join halaqah flow (dengan waitlist fallback)
4. Add confirmation/feedback
5. Show program options based on eligibility (Regular vs Pra-Tahfidz)

### Phase 4: Testing & Polish
1. Test complete flow: Admin auto-create → Thalibah join
2. Test waitlist flow: halaqah penuh → join waitlist → promote
3. Test graduation eligibility: lulus vs tidak lulus
4. Test pra-tahfidz program flow
5. Add validation & error handling
6. Add notifications/emails (optional)

---

## Data Flow Examples

### Flow 1: Admin Auto-creates Halaqah for Batch
```typescript
// 1. Admin clicks "Auto-Create All" button
POST /api/halaqah/auto-create
{
  batch_id: "batch-2-uuid",
  program_id: "program-tikrar-regular-uuid"
}

// 2. Backend fetches all approved muallimah for batch
GET /api/admin/muallimah?status=approved&batch_id=batch-2-uuid

// 3. For each muallimah, create halaqah using normalized schedule
// From muallimah_schedules table:
SELECT * FROM muallimah_schedules
WHERE muallimah_registration_id = 'xxx'
AND is_preferred = true

// 4. Create halaqah for each schedule
POST /api/halaqah
{
  program_id: "program-uuid",
  muallimah_id: "muallimah-uuid",
  name: "Halaqah Juz 30 - Ustadzah Fatimah",
  day_of_week: 1, // from muallimah_schedules
  start_time: "19:00", // from muallimah_schedules
  end_time: "21:00", // from muallimah_schedules
  preferred_juz: "30",
  max_students: 15, // from preferred_max_thalibah
  waitlist_max: 5
}

// 5. Response summary
{
  created: 12,
  skipped: 2,
  errors: []
}
```

### Flow 2: Thalibah Joins Halaqah (with Waitlist)
```typescript
// 1. Check thalibah eligibility
GET /api/thalibah/eligibility
// Response:
{
  is_graduated: true,
  oral_status: "pass",
  exam_status: "completed",
  exam_juz: 30,
  eligible_programs: ["tashih_ujian", "tashih_only", "ujian_only"]
}

// 2. Thalibah views available halaqah
GET /api/halaqah/available-for-thalibah?batch_id=xxx&eligible_programs=...

// 3. Thalibah joins halaqah
POST /api/halaqah/[id]/join
{
  thalibah_id: "thalibah-uuid",
  enrollment_type: "re_enrollment"
}

// 4a. If halaqah has capacity:
// Response: { status: "joined", position: null }
INSERT INTO halaqah_students (halaqah_id, thalibah_id, enrollment_type, status)
VALUES ('halaqah-uuid', 'thalibah-uuid', 're_enrollment', 'active')

// 4b. If halaqah is FULL:
// Response: { status: "waitlisted", position: 3 }
INSERT INTO halaqah_students (halaqah_id, thalibah_id, enrollment_type, status, joined_waitlist_at)
VALUES ('halaqah-uuid', 'thalibah-uuid', 're_enrollment', 'waitlist', now())
```

### Flow 3: Thalibah Tidak Lulus Exam → Pra-Tahfidz
```typescript
// 1. Check thalibah eligibility
GET /api/thalibah/eligibility
// Response:
{
  is_graduated: false,
  oral_status: "pass",
  exam_status: "failed", // atau "not_completed"
  eligible_programs: ["pra_tahfidz"] // HANYA pra-tahfidz
}

// 2. Show only Pra-Tahfidz halaqah
GET /api/halaqah/available-for-thalibah?program_type=pra_tahfidz

// 3. Thalibah joins Pra-Tahfidz halaqah
// Same flow as regular halaqah
```

### Flow 4: Promote from Waitlist
```typescript
// 1. Student leaves halaqah (or admin removes)
POST /api/halaqah/[id]/leave
{ thalibah_id: "student-uuid" }

// 2. Backend auto-promotes first waitlist student
GET /api/halaqah/[id]/waitlist?order=joined_waitlist_at&limit=1

// 3. Update waitlist student to active
UPDATE halaqah_students
SET status = 'active',
    promoted_from_waitlist_at = now()
WHERE id = 'waitlist-student-uuid'

// 4. Send notification to promoted student
// (optional - can be email/push notification)
```

---

## Rules Compliance (arsitektur.md)

### ✅ RLS as Source of Truth
- Semua data akses via RLS policies
- Server-side validation untuk semua operations

### ✅ Cookie-Based Session Only
- Tidak ada localStorage untuk token
- Session di HttpOnly cookie

### ✅ API Routes for Mutation Only
- POST/PUT/DELETE untuk create/update/delete
- GET untuk data fetching (server component)

### ✅ Server-Centric Security
- Validasi capacity halaqah (max_students) di server
- Validasi eligibility thalibah (graduated status) di server
- RLS memastikan hanya user yang berhak bisa akses

---

## Decisions & Requirements (Updated)

### 1. Thalibah Graduation Criteria
Thalibah dinyatakan "lulus" jika:
- ✅ `oral_assessment_status = 'pass'`
- ✅ `exam_status = 'completed'`
- ⚠️ **Exception**: Juz 30 tidak perlu exam
- ❌ Jika tidak lulus exam → bisa pilih program **Pra-Tahfidz**

### 2. Halaqah Capacity & Waiting List
- ✅ Ada waiting list jika halaqah penuh
- Status di `halaqah_students`: `'active'`, `'waitlist'`, `'graduated'`, `'dropped'`
- Ketika ada slot kosong, thalibah di waitlist bisa dipromosikan ke active

### 3. Schedule Normalization
- ✅ Normalize schedule di tabel `muallimah_registrations`
- Buat tabel baru `muallimah_schedules` untuk menyimpan schedule yang terstruktur

### 4. Auto-create Halaqah
- ✅ Feature "Auto-create halaqah" dari semua muallimah approved
- Batch operation: 1 klik create semua halaqah untuk batch tertentu

### 5. Program untuk Thalibah yang Tidak Lulus Exam
- Program **Pra-Tahfidz** untuk thalibah yang:
  - Lulus oral assessment
  - Tidak lulus/tidak ikut exam (kecuali juz 30)

---

## Database Schema Changes (Updated)

### 1. Update `halaqah` table
Kolom yang sudah ada:
- `id`, `program_id`, `name`, `description`
- `day_of_week`, `start_time`, `end_time`
- `location`, `max_students`, `status`

Perlu ditambahkan:
- `muallimah_id` (uuid) - Reference ke user (muallimah) utama
- `preferred_juz` (text) - Juz yang diajar di halaqah ini
- `max_thalibah_override` (integer) - Override max thalibah dari default muallimah
- `waitlist_max` (integer) - Max waitlist capacity (default: 5)

Catatan: `class_type` sudah ada di tabel `programs`, tidak perlu ditambahkan di sini.
Relasi ke `programs` sudah ada melalui `program_id`.

### 2. Update `halaqah_students` table
Sudah ada: `halaqah_id`, `thalibah_id`, `assigned_at`, `assigned_by`, `status`

Update status CHECK constraint:
- Status: `'active'`, `'waitlist'`, `'graduated'`, `'dropped'` (was: `'active'`, `'transferred'`, `'graduated'`, `'dropped'`)

Perlu ditambahkan:
- `enrollment_type` (text) - 'new' atau 're_enrollment'
- `previous_halaqah_id` (uuid) - Untuk tracking transfer
- `re_enrollment_batch_id` (uuid) - Batch saat re-enrollment
- `joined_waitlist_at` (timestamptz) - Timestamp saat masuk waitlist
- `promoted_from_waitlist_at` (timestamptz) - Timestamp saat dipromosikan ke active

### 3. Buat table `muallimah_schedules` (NEW)
Untuk normalize schedule dari `muallimah_registrations`:
```sql
CREATE TABLE muallimah_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  muallimah_registration_id uuid NOT NULL REFERENCES muallimah_registrations(id),
  day_of_week integer NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  start_time time NOT NULL,
  end_time time NOT NULL,
  timezone text DEFAULT 'WIB',
  is_preferred boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

### 4. Buat table `programs` (jika belum ada)
Untuk Pra-Tahfidz program:
```sql
INSERT INTO programs (id, batch_id, name, description, class_type, ...)
VALUES (
  'pra-tahfidz-uuid',
  'batch-uuid',
  'Pra-Tahfidz',
  'Program persiapan untuk thalibah yang belum lulus exam',
  'pra_tahfidz',
  ...
);
```

---

## File Structure (New Files)

```
app/
├── (protected)/
│   ├── admin/
│   │   └── page.tsx (UPDATE - add halaqah tab)
│   └── perjalanan-saya/
│       └── page.tsx (UPDATE - add class selection)
│
components/
├── admin/
│   ├── HalaqahManagementTab.tsx (NEW)
│   ├── AutoCreateHalaqahModal.tsx (NEW)
│   ├── CreateHalaqahModal.tsx (NEW)
│   └── HalaqahStudentsList.tsx (NEW)
└── thalibah/
    ├── HalaqahSelectionModal.tsx (NEW)
    └── HalaqahCard.tsx (NEW)

app/api/
├── halaqah/
│   ├── route.ts (UPDATE)
│   ├── auto-create/
│   │   └── route.ts (NEW)
│   ├── [id]/
│   │   ├── assign-muallimah/
│   │   │   └── route.ts (NEW)
│   │   ├── join/
│   │   │   └── route.ts (NEW)
│   │   ├── leave/
│   │   │   └── route.ts (NEW)
│   │   └── promote-waitlist/
│   │       └── route.ts (NEW)
│   └── available-for-thalibah/
│       └── route.ts (NEW)
├── muallimah-registrations/
│   └── [id]/
│       └── normalize-schedule/
│           └── route.ts (NEW)
└── thalibah/
    └── eligibility/
        └── route.ts (NEW)
```

---

## Migration SQL (Updated)

```sql
-- =====================================================
-- 1. Add columns to halaqah table
-- =====================================================
ALTER TABLE halaqah
ADD COLUMN IF NOT EXISTS muallimah_id uuid REFERENCES users(id),
ADD COLUMN IF NOT EXISTS preferred_juz text,
ADD COLUMN IF NOT EXISTS max_thalibah_override integer,
ADD COLUMN IF NOT EXISTS waitlist_max integer DEFAULT 5;
-- Catatan: class_type sudah ada di tabel programs

-- =====================================================
-- 2. Update halaqah_students status constraint
-- =====================================================
-- First, drop existing check constraint if exists
ALTER TABLE halaqah_students
DROP CONSTRAINT IF EXISTS halaqah_students_status_check;

-- Add new check constraint with waitlist status
ALTER TABLE halaqah_students
ADD CONSTRAINT halaqah_students_status_check
CHECK (status IN ('active', 'waitlist', 'graduated', 'dropped'));

-- Add new columns
ALTER TABLE halaqah_students
ADD COLUMN IF NOT EXISTS enrollment_type text DEFAULT 'new' CHECK (enrollment_type IN ('new', 're_enrollment')),
ADD COLUMN IF NOT EXISTS previous_halaqah_id uuid REFERENCES halaqah(id),
ADD COLUMN IF NOT EXISTS re_enrollment_batch_id uuid REFERENCES batches(id),
ADD COLUMN IF NOT EXISTS joined_waitlist_at timestamptz,
ADD COLUMN IF NOT EXISTS promoted_from_waitlist_at timestamptz;

-- =====================================================
-- 3. Create muallimah_schedules table (NEW)
-- =====================================================
CREATE TABLE IF NOT EXISTS muallimah_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  muallimah_registration_id uuid NOT NULL REFERENCES muallimah_registrations(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  start_time time NOT NULL,
  end_time time NOT NULL,
  timezone text DEFAULT 'WIB',
  is_preferred boolean DEFAULT true,
  is_backup boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_muallimah_schedules_registration_id
ON muallimah_schedules(muallimah_registration_id);

-- =====================================================
-- 4. Add Pra-Tahfidz program (if not exists)
-- =====================================================
INSERT INTO programs (id, batch_id, name, description, class_type, duration_weeks, max_thalibah, status)
SELECT
  gen_random_uuid(),
  b.id,
  'Pra-Tahfidz',
  'Program persiapan untuk thalibah yang lulus oral tapi belum lulus exam',
  'pra_tahfidz',
  8, -- 8 weeks
  20,
  'active'
FROM batches b
WHERE b.status = 'active'
AND NOT EXISTS (
  SELECT 1 FROM programs p
  WHERE p.class_type = 'pra_tahfidz'
  AND p.batch_id = b.id
);

-- =====================================================
-- 5. Create function to normalize schedule from muallimah_registrations
-- =====================================================
CREATE OR REPLACE FUNCTION normalize_muallimah_schedule(
  p_registration_id uuid,
  p_schedule_json jsonb
) RETURNS void AS $$
DECLARE
  schedule_item jsonb;
  day_num integer;
BEGIN
  -- Clear existing schedules
  DELETE FROM muallimah_schedules
  WHERE muallimah_registration_id = p_registration_id;

  -- Insert normalized preferred schedules
  IF p_schedule_json IS NOT NULL THEN
    FOR schedule_item IN SELECT * FROM jsonb_array_elements(p_schedule_json)
    LOOP
      -- Convert day name to number
      day_num := CASE LOWER(schedule_item->>'day')
        WHEN 'senin' THEN 1
        WHEN 'selasa' THEN 2
        WHEN 'rabu' THEN 3
        WHEN 'kamis' THEN 4
        WHEN 'jumat' THEN 5
        WHEN 'sabtu' THEN 6
        WHEN 'ahad' THEN 7
        WHEN 'minggu' THEN 7
        ELSE NULL
      END;

      IF day_num IS NOT NULL THEN
        INSERT INTO muallimah_schedules (
          muallimah_registration_id,
          day_of_week,
          start_time,
          end_time,
          is_preferred,
          is_backup
        ) VALUES (
          p_registration_id,
          day_num,
          (schedule_item->>'time_start')::time,
          (schedule_item->>'time_end')::time,
          true,
          false
        );
      END IF;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. RLS Policies
-- =====================================================
ALTER TABLE halaqah ENABLE ROW LEVEL SECURITY;
ALTER TABLE muallimah_schedules ENABLE ROW LEVEL SECURITY;

-- Policy: Muallimah can see own halaqah
CREATE POLICY "Muallimah can see own halaqah"
ON halaqah FOR SELECT
USING (
  muallimah_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM halaqah_mentors
    WHERE halaqah_id = halaqah.id AND mentor_id = auth.uid()
  )
);

-- Policy: Muallimah can see own schedules
CREATE POLICY "Muallimah can see own schedules"
ON muallimah_schedules FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM muallimah_registrations
    WHERE muallimah_registrations.id = muallimah_schedules.muallimah_registration_id
    AND muallimah_registrations.user_id = auth.uid()
  )
);

-- Policy: Admin can manage all halaqah
CREATE POLICY "Admin can manage halaqah"
ON halaqah FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

---

## Mock UI (Description)

### Admin: Halaqah Management Tab
```
┌─────────────────────────────────────────────────────────────┐
│ Halaqah Management                                          │
├─────────────────────────────────────────────────────────────┤
│ [All] [Active] [Inactive]    Search: [_______]             │
│                                                             │
│ [🚀 Auto-Create All]  [+ Create Single]  [Batch: ▼]        │
├─────────────────────────────────────────────────────────────┤
│ Name               │ Muallimah     │ Juz │ Students │ Actions│
├─────────────────────────────────────────────────────────────┤
│ Juz 30 - Mon      │ Ust. Fatimah  │ 30  │ 8/15    │ [View] │
│ 19:00-21:00       │               │     │         │ [Edit] │
├─────────────────────────────────────────────────────────────┤
│ Juz 29 - Tue      │ Ust. Aisyah   │ 29  │ 12/20   │ [View] │
│ 20:00-22:00       │               │     │         │ [Edit] │
└─────────────────────────────────────────────────────────────┘
```

### Modal: Create Halaqah from Muallimah
```
┌─────────────────────────────────────────────────────────────┐
│ Create Halaqah from Muallimah                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. Select Muallimah:                                       │
│ [Ustadzah Fatimah - Juz 30 - Mon 19:00-21:00 ▼]            │
│                                                             │
│ Data from muallimah_registrations (auto-filled):            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Schedule:     Monday, 19:00 - 21:00 WIB                │ │
│ │ Preferred Juz: 30                                       │ │
│ │ Max Thalibah:  15                                       │ │
│ │ Class Type:    Tashih + Ujian                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Override (optional):                                       │
│ ○ Use muallimah preferences                               │
│ ● Custom settings                                          │
│   Day: [Monday ▼]  Time: [19:00] - [21:00]                │
│   Max Students: [15]                                        │
│                                                             │
│ Select Program & Batch:                                    │
│   Batch: [Tikrar MTI Batch 2 ▼]                            │
│   Program: [Tikrar Tahfidz Regular ▼]                      │
│                                                             │
│ [Cancel]  [Create Halaqah]                                 │
└─────────────────────────────────────────────────────────────┘
```

### Thalibah: Class Selection (Re-enrollment)
```
┌─────────────────────────────────────────────────────────────┐
│ Choose Your Class - Batch 2                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Your Graduation Status: ✅ Graduated from Batch 1           │
│                                                             │
│ Filter by:                                                 │
│ [Juz 30 ▼] [Schedule: Evening ▼] [Muallimah: Any ▼]         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Juz 30 - Monday Evening                             │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ Muallimah: Ustadzah Fatimah                          │   │
│  │ Schedule: Monday, 19:00 - 21:00 WIB                 │   │
│  │ Students: 8/15 spots available                      │   │
│  │                                                      │   │
│  │ [View Details]  [Join Class →]                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Juz 29 - Tuesday Evening                            │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ Muallimah: Ustadzah Aisyah                           │   │
│  │ Schedule: Tuesday, 20:00 - 22:00 WIB                │   │
│  │ Students: 12/20 spots available                     │   │
│  │                                                      │   │
│  │ [View Details]  [Join Class →]                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

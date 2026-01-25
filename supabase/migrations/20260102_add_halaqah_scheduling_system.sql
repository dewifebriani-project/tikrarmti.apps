-- =====================================================
-- Migration: Halaqah Scheduling & Waitlist System
-- Date: 2026-01-02
-- Description: Add support for muallimah scheduling, waitlist, and re-enrollment
-- =====================================================

-- =====================================================
-- 1. Add columns to halaqah table
-- =====================================================
ALTER TABLE halaqah
ADD COLUMN IF NOT EXISTS muallimah_id uuid REFERENCES users(id),
ADD COLUMN IF NOT EXISTS preferred_juz text,
ADD COLUMN IF NOT EXISTS max_thalibah_override integer,
ADD COLUMN IF NOT EXISTS waitlist_max integer DEFAULT 5;

-- Note: class_type already exists in programs table, linked via program_id

-- =====================================================
-- 2. Update halaqah_students status constraint
-- =====================================================

-- Drop existing check constraint if exists
ALTER TABLE halaqah_students
DROP CONSTRAINT IF EXISTS halaqah_students_status_check;

-- Add new check constraint with waitlist status
ALTER TABLE halaqah_students
ADD CONSTRAINT halaqah_students_status_check
CHECK (status IN ('active', 'waitlist', 'graduated', 'dropped'));

-- Add new columns for enrollment tracking
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
-- 4. Add Pra-Tahfidz program if not exists
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
-- 6. Create trigger to auto-normalize schedule on insert/update
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_normalize_muallimah_schedule()
RETURNS trigger AS $$
BEGIN
  -- Normalize preferred_schedule
  IF NEW.preferred_schedule IS NOT NULL THEN
    PERFORM normalize_muallimah_schedule(NEW.id, NEW.preferred_schedule::jsonb);
  END IF;

  -- Normalize backup_schedule if exists
  IF NEW.backup_schedule IS NOT NULL THEN
    -- For backup, we insert with is_backup = true
    -- (You may want to modify the normalize function to handle this)
    NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_normalize_muallimah_schedule ON muallimah_registrations;
CREATE TRIGGER trigger_normalize_muallimah_schedule
AFTER INSERT OR UPDATE OF preferred_schedule ON muallimah_registrations
FOR EACH ROW
EXECUTE FUNCTION trigger_normalize_muallimah_schedule();

-- =====================================================
-- 7. Enable RLS and create policies for muallimah_schedules
-- =====================================================
ALTER TABLE muallimah_schedules ENABLE ROW LEVEL SECURITY;

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

-- Policy: Admin can see all schedules
CREATE POLICY "Admin can see all schedules"
ON muallimah_schedules FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND 'admin' = ANY(users.role)
  )
);

-- =====================================================
-- 8. Update RLS policies for halaqah
-- =====================================================

-- Ensure RLS is enabled
ALTER TABLE halaqah ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Muallimah can see own halaqah" ON halaqah;
DROP POLICY IF EXISTS "Admin can manage all halaqah" ON halaqah;

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

-- Policy: Students can see their halaqah
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

-- Policy: Admin can manage all halaqah
CREATE POLICY "Admin can manage all halaqah"
ON halaqah FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND 'admin' = ANY(users.role)
  )
);

-- =====================================================
-- 9. Update RLS policies for halaqah_students
-- =====================================================

-- Ensure RLS is enabled
ALTER TABLE halaqah_students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can see own enrollment" ON halaqah_students;
DROP POLICY IF EXISTS "Muallimah can see students in their halaqah" ON halaqah_students;
DROP POLICY IF EXISTS "Admin can manage all halaqah_students" ON halaqah_students;

-- Policy: Students can see their own enrollment
CREATE POLICY "Students can see own enrollment"
ON halaqah_students FOR SELECT
USING (thalibah_id = auth.uid());

-- Policy: Muallimah can see students in their halaqah
CREATE POLICY "Muallimah can see students in their halaqah"
ON halaqah_students FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM halaqah
    WHERE halaqah.id = halaqah_students.halaqah_id
    AND halaqah.muallimah_id = auth.uid()
  )
);

-- Policy: Admin can manage all halaqah_students
CREATE POLICY "Admin can manage all halaqah_students"
ON halaqah_students FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND 'admin' = ANY(users.role)
  )
);

-- =====================================================
-- 10. Normalize existing muallimah registration schedules
-- =====================================================
DO $$
DECLARE
  registration_record RECORD;
BEGIN
  -- Loop through all muallimah registrations
  FOR registration_record IN
    SELECT id, preferred_schedule
    FROM muallimah_registrations
    WHERE preferred_schedule IS NOT NULL
  LOOP
    -- Normalize each registration's schedule
    PERFORM normalize_muallimah_schedule(
      registration_record.id,
      registration_record.preferred_schedule::jsonb
    );
  END LOOP;
END $$;

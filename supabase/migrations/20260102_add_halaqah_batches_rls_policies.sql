-- ============================================================================
-- Migration: Add RLS Policies for Batches and Halaqah Tables
-- Date: 2026-01-02
-- Description: Enable RLS and create policies for batches and halaqah tables
-- ============================================================================

-- ============================================================================
-- BATCHES TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS on batches table
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated can view batches" ON batches;
DROP POLICY IF EXISTS "Admin can manage batches" ON batches;

-- Policy: All authenticated users can view batches
CREATE POLICY "Authenticated can view batches"
ON batches
FOR SELECT
TO authenticated
USING (true);

-- Policy: Admin can manage batches
CREATE POLICY "Admin can manage batches"
ON batches
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR 'admin' = ANY(users.roles))
  )
);

-- ============================================================================
-- HALAQAH TABLE - RLS POLICIES UPDATE
-- ============================================================================

-- Ensure RLS is enabled on halaqah table
ALTER TABLE halaqah ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated can view halaqah" ON halaqah;
DROP POLICY IF EXISTS "Muallimah can view own halaqah" ON halaqah;
DROP POLICY IF EXISTS "Students can view their halaqah" ON halaqah;
DROP POLICY IF EXISTS "Admin can manage all halaqah" ON halaqah;

-- Policy: All authenticated users can view halaqah
CREATE POLICY "Authenticated can view halaqah"
ON halaqah
FOR SELECT
TO authenticated
USING (true);

-- Policy: Admin can manage all halaqah
CREATE POLICY "Admin can manage all halaqah"
ON halaqah
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR 'admin' = ANY(users.roles))
  )
);

-- ============================================================================
-- HALAQAH_STUDENTS TABLE - RLS POLICIES UPDATE
-- ============================================================================

-- Ensure RLS is enabled on halaqah_students table
ALTER TABLE halaqah_students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Students can view own enrollment" ON halaqah_students;
DROP POLICY IF EXISTS "Muallimah can view students in their halaqah" ON halaqah_students;
DROP POLICY IF EXISTS "Admin can manage all halaqah_students" ON halaqah_students;

-- Policy: Students can view their own enrollment
CREATE POLICY "Students can view own enrollment"
ON halaqah_students
FOR SELECT
TO authenticated
USING (thalibah_id = auth.uid());

-- Policy: Muallimah can view students in their halaqah
CREATE POLICY "Muallimah can view students in their halaqah"
ON halaqah_students
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM halaqah
    WHERE halaqah.id = halaqah_students.halaqah_id
    AND halaqah.muallimah_id = auth.uid()
  )
);

-- Policy: Admin can manage all halaqah_students
CREATE POLICY "Admin can manage all halaqah_students"
ON halaqah_students
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR 'admin' = ANY(users.roles))
  )
);

-- ============================================================================
-- MUALLIMAH_SCHEDULES TABLE - RLS POLICIES UPDATE
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE muallimah_schedules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Muallimah can see own schedules" ON muallimah_schedules;
DROP POLICY IF EXISTS "Admin can see all schedules" ON muallimah_schedules;

-- Policy: Muallimah can see own schedules via their registration
CREATE POLICY "Muallimah can see own schedules"
ON muallimah_schedules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM muallimah_registrations
    WHERE muallimah_registrations.id = muallimah_schedules.muallimah_registration_id
    AND muallimah_registrations.user_id = auth.uid()
  )
);

-- Policy: Admin can see all schedules
CREATE POLICY "Admin can see all schedules"
ON muallimah_schedules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR 'admin' = ANY(users.roles))
  )
);

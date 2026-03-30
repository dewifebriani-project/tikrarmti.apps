-- ============================================================================
-- CONSOLIDATED RLS POLICIES FOR ROLES ARRAY (5-TIER SYSTEM)
-- ============================================================================
-- This migration consolidates and updates all RLS policies to use the
-- roles array instead of the deprecated 'role' field.
--
-- Role System (5 tiers as per arsitektur.md):
-- - admin (100): Full system access
-- - musyrifah (80): Discipline monitoring, SP management
-- - muallimah (60): Teaching, assessment, tashih records
-- - thalibah (40): Active students
-- - calon_thalibah (20): Prospective students in registration
--
-- Author: Generated as part of security audit fixes
-- Date: 2026-03-29
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Check if user has any of the specified roles
-- ============================================================================
CREATE OR REPLACE FUNCTION public.has_any_role(user_roles text[], required_roles text[])
RETURNS boolean AS $$
  SELECT user_roles && required_roles;
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- HELPER FUNCTION: Check if user has minimum rank
-- ============================================================================
CREATE OR REPLACE FUNCTION public.has_minimum_rank(user_roles text[], min_rank int)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM unnest(user_roles) AS role
    WHERE CASE role
      WHEN 'admin' THEN 100
      WHEN 'musyrifah' THEN 80
      WHEN 'muallimah' THEN 60
      WHEN 'thalibah' THEN 40
      WHEN 'calon_thalibah' THEN 20
      ELSE 0
    END >= min_rank
  );
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- USERS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Staff can view all users" ON users;

-- Self-access policies
CREATE POLICY "Users can view their own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin policies (full access)
CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
);

CREATE POLICY "Admins can manage all users"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
);

-- ============================================================================
-- PENDAFTARAN_TIKRAR_TAHFIDZ TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can create own registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can update own registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Staff can view all registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Admins can manage all registrations" ON pendaftaran_tikrar_tahfidz;

-- Self-access policies
CREATE POLICY "Users can view own registrations"
ON pendaftaran_tikrar_tahfidz
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own registrations"
ON pendaftaran_tikrar_tahfidz
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registrations"
ON pendaftaran_tikrar_tahfidz
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Staff policies (musyrifah, muallimah, admin)
CREATE POLICY "Staff can view all registrations"
ON pendaftaran_tikrar_tahfidz
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_minimum_rank(u.roles, 60)  -- muallimah and above
  )
);

-- Admin policies
CREATE POLICY "Admins can manage all registrations"
ON pendaftaran_tikrar_tahfidz
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
);

-- ============================================================================
-- JURNAL_RECORDS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own jurnal" ON jurnal_records;
DROP POLICY IF EXISTS "Users can create own jurnal" ON jurnal_records;
DROP POLICY IF EXISTS "Users can update own jurnal" ON jurnal_records;
DROP POLICY IF EXISTS "Musyrifah can view all jurnal" ON jurnal_records;
DROP POLICY IF EXISTS "Staff can view all jurnal" ON jurnal_records;

-- Self-access policies
CREATE POLICY "Users can view own jurnal"
ON jurnal_records
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own jurnal"
ON jurnal_records
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jurnal"
ON jurnal_records
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Musyrifah can view all jurnal (for monitoring)
CREATE POLICY "Musyrifah can view all jurnal"
ON jurnal_records
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['musyrifah', 'admin'])
  )
);

-- Staff policies (muallimah and above can view)
CREATE POLICY "Staff can view all jurnal"
ON jurnal_records
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_minimum_rank(u.roles, 60)  -- muallimah and above
  )
);

-- ============================================================================
-- TASHIH_RECORDS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own tashih" ON tashih_records;
DROP POLICY IF EXISTS "Muallimah can create tashih" ON tashih_records;
DROP POLICY IF EXISTS "Muallimah can update tashih" ON tashih_records;
DROP POLICY IF EXISTS "Staff can view all tashih" ON tashih_records;

-- Self-access policies
CREATE POLICY "Users can view own tashih"
ON tashih_records
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Muallimah can create and update tashih records
CREATE POLICY "Muallimah can create tashih"
ON tashih_records
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['muallimah', 'admin'])
  )
);

CREATE POLICY "Muallimah can update tashih"
ON tashih_records
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['muallimah', 'admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['muallimah', 'admin'])
  )
);

-- Staff policies (muallimah and above can view)
CREATE POLICY "Staff can view all tashih"
ON tashih_records
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_minimum_rank(u.roles, 60)  -- muallimah and above
  )
);

-- ============================================================================
-- DAFTAR_ULANG_SUBMISSIONS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own daftar_ulang" ON daftar_ulang_submissions;
DROP POLICY IF EXISTS "Users can create own daftar_ulang" ON daftar_ulang_submissions;
DROP POLICY IF EXISTS "Users can update own daftar_ulang" ON daftar_ulang_submissions;
DROP POLICY IF EXISTS "Staff can view all daftar_ulang" ON daftar_ulang_submissions;
DROP POLICY IF EXISTS "Admins can manage all daftar_ulang" ON daftar_ulang_submissions;

-- Self-access policies
CREATE POLICY "Users can view own daftar_ulang"
ON daftar_ulang_submissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own daftar_ulang"
ON daftar_ulang_submissions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daftar_ulang"
ON daftar_ulang_submissions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Staff policies (muallimah and above can view)
CREATE POLICY "Staff can view all daftar_ulang"
ON daftar_ulang_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_minimum_rank(u.roles, 60)  -- muallimah and above
  )
);

-- Admin policies
CREATE POLICY "Admins can manage all daftar_ulang"
ON daftar_ulang_submissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
);

-- ============================================================================
-- HALAQAH TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Muallimah can view assigned halaqah" ON halaqah;
DROP POLICY IF EXISTS "Admins can manage all halaqah" ON halaqah;
DROP POLICY IF EXISTS "Students can view their halaqah" ON halaqah;

-- Students can view their assigned halaqah
CREATE POLICY "Students can view their halaqah"
ON halaqah
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM halaqah_students AS hs
    WHERE hs.halaqah_id = halaqah.id
    AND hs.thalibah_id = auth.uid()
  )
);

-- Muallimah can view all halaqah
CREATE POLICY "Muallimah can view all halaqah"
ON halaqah
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['muallimah', 'admin'])
  )
);

-- Admin policies
CREATE POLICY "Admins can manage all halaqah"
ON halaqah
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
);

-- ============================================================================
-- BATCHES TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view batches" ON batches;
DROP POLICY IF EXISTS "Admins can manage batches" ON batches;

-- All authenticated users can view batches (read-only)
CREATE POLICY "Authenticated users can view batches"
ON batches
FOR SELECT
TO authenticated
USING (true);

-- Admin policies
CREATE POLICY "Admins can manage batches"
ON batches
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
);

-- ============================================================================
-- PROGRAMS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view programs" ON programs;
DROP POLICY IF EXISTS "Admins can manage programs" ON programs;

-- All authenticated users can view programs (read-only)
CREATE POLICY "Authenticated users can view programs"
ON programs
FOR SELECT
TO authenticated
USING (true);

-- Admin policies
CREATE POLICY "Admins can manage programs"
ON programs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
);

-- ============================================================================
-- MUALLIMAH_REGISTRATIONS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own muallimah_registration" ON muallimah_registrations;
DROP POLICY IF EXISTS "Admins can manage muallimah_registrations" ON muallimah_registrations;

-- Self-access policies
CREATE POLICY "Users can view own muallimah_registration"
ON muallimah_registrations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin and Muallimah can view all registrations
CREATE POLICY "Staff can view all muallimah_registrations"
ON muallimah_registrations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_minimum_rank(u.roles, 60)  -- muallimah and above
  )
);

-- Admin policies
CREATE POLICY "Admins can manage muallimah_registrations"
ON muallimah_registrations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
);

-- ============================================================================
-- MUSYRIFAH_REGISTRATIONS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own musyrifah_registration" ON musyrifah_registrations;
DROP POLICY IF EXISTS "Admins can manage musyrifah_registrations" ON musyrifah_registrations;

-- Self-access policies
CREATE POLICY "Users can view own musyrifah_registration"
ON musyrifah_registrations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin and Musyrifah can view all registrations
CREATE POLICY "Staff can view all musyrifah_registrations"
ON musyrifah_registrations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_minimum_rank(u.roles, 60)  -- muallimah and above
  )
);

-- Admin policies
CREATE POLICY "Admins can manage musyrifah_registrations"
ON musyrifah_registrations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
);

-- ============================================================================
-- SYSTEM_LOGS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view system_logs" ON system_logs;
DROP POLICY IF EXISTS "Admins can insert system_logs" ON system_logs;

-- Only admins can view system logs
CREATE POLICY "Admins can view system_logs"
ON system_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
);

-- System can insert logs (through server-side functions)
CREATE POLICY "System can insert system_logs"
ON system_logs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
);

-- ============================================================================
-- AUDIT_LOGS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit_logs" ON audit_logs;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit_logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
);

-- System can insert logs (through server-side functions)
CREATE POLICY "System can insert audit_logs"
ON audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON FUNCTION public.has_any_role IS 'Helper function to check if user has any of the specified roles from the roles array';
COMMENT ON FUNCTION public.has_minimum_rank IS 'Helper function to check if user has minimum rank based on roles array. Rank: admin=100, musyrifah=80, muallimah=60, thalibah=40, calon_thalibah=20';

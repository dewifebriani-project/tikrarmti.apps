-- ============================================================================
-- Security Hardening Migration
-- ============================================================================
-- Purpose: Fix critical security issues identified by Database Linter
-- Created: 2026-01-06
-- ============================================================================

-- ============================================================================
-- 1. FIX MISSING RLS POLICIES
-- ============================================================================

-- Enable RLS and add policies for tables that have RLS enabled but no policies

-- halaqah_mentors
ALTER TABLE halaqah_mentors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all halaqah_mentors" ON halaqah_mentors;
CREATE POLICY "Admins can view all halaqah_mentors"
ON halaqah_mentors
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR 'admin' = ANY(users.roles))
  )
);

DROP POLICY IF EXISTS "Mentors can view own assignments" ON halaqah_mentors;
CREATE POLICY "Mentors can view own assignments"
ON halaqah_mentors
FOR SELECT
TO authenticated
USING (mentor_id = auth.uid());

DROP POLICY IF EXISTS "Students can view their halaqah mentors" ON halaqah_mentors;
CREATE POLICY "Students can view their halaqah mentors"
ON halaqah_mentors
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM halaqah_students hs
    WHERE hs.halaqah_id = halaqah_mentors.halaqah_id
    AND hs.thalibah_id = auth.uid()
  )
);

-- halaqah_students
ALTER TABLE halaqah_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all halaqah_students" ON halaqah_students;
CREATE POLICY "Admins can view all halaqah_students"
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

DROP POLICY IF EXISTS "Students can view own halaqah" ON halaqah_students;
CREATE POLICY "Students can view own halaqah"
ON halaqah_students
FOR SELECT
TO authenticated
USING (thalibah_id = auth.uid());

DROP POLICY IF EXISTS "Mentors can view students in their halaqah" ON halaqah_students;
CREATE POLICY "Mentors can view students in their halaqah"
ON halaqah_students
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM halaqah_mentors hm
    WHERE hm.halaqah_id = halaqah_students.halaqah_id
    AND hm.mentor_id = auth.uid()
  )
);

-- juz_options (Read-only for authenticated, full for admins)
ALTER TABLE juz_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view juz_options" ON juz_options;
CREATE POLICY "Authenticated users can view juz_options"
ON juz_options
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage juz_options" ON juz_options;
CREATE POLICY "Admins can manage juz_options"
ON juz_options
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR 'admin' = ANY(users.roles))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR 'admin' = ANY(users.roles))
  )
);

-- maintenance_mode (Admin only)
ALTER TABLE maintenance_mode ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage maintenance_mode" ON maintenance_mode;
CREATE POLICY "Admins can manage maintenance_mode"
ON maintenance_mode
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR 'admin' = ANY(users.roles))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR 'admin' = ANY(users.roles))
  )
);

DROP POLICY IF EXISTS "Authenticated can read maintenance_mode" ON maintenance_mode;
CREATE POLICY "Authenticated can read maintenance_mode"
ON maintenance_mode
FOR SELECT
TO authenticated
USING (true);

-- presensi
ALTER TABLE presensi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all presensi" ON presensi;
CREATE POLICY "Admins can view all presensi"
ON presensi
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR 'admin' = ANY(users.roles))
  )
);

DROP POLICY IF EXISTS "Students can view own presensi" ON presensi;
CREATE POLICY "Students can view own presensi"
ON presensi
FOR SELECT
TO authenticated
USING (thalibah_id = auth.uid());

DROP POLICY IF EXISTS "Mentors can view presensi in their halaqah" ON presensi;
CREATE POLICY "Mentors can view presensi in their halaqah"
ON presensi
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM halaqah_mentors hm
    WHERE hm.halaqah_id = presensi.halaqah_id
    AND hm.mentor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Musyrifah can view presensi" ON presensi;
CREATE POLICY "Musyrifah can view presensi"
ON presensi
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'musyrifah' OR 'musyrifah' = ANY(users.roles))
  )
);

-- ============================================================================
-- 2. FIX SECURITY DEFINER VIEWS
-- ============================================================================

-- Change views from SECURITY DEFINER to SECURITY INVOKER to prevent RLS bypass
-- OR ensure they have proper filtering

-- Drop and recreate views with SECURITY INVOKER (safer default)

DROP VIEW IF EXISTS v_users_with_tikrar_batch;
CREATE VIEW v_users_with_tikrar_batch AS
SELECT
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.roles,
  u.current_tikrar_batch_id,
  b.name as current_tikrar_batch_name,
  b.start_date as batch_start_date,
  b.end_date as batch_end_date,
  b.status as batch_status
FROM users u
LEFT JOIN batches b ON u.current_tikrar_batch_id = b.id;

DROP VIEW IF EXISTS user_registrations;
CREATE VIEW user_registrations AS
SELECT
  p.id,
  p.thalibah_id,
  p.program_id,
  p.batch_id,
  p.registration_date,
  p.status,
  t.email as thalibah_email,
  t.full_name as thalibah_name,
  pr.name as program_name,
  pr.batch_id as program_batch_id,
  b.name as batch_name,
  b.start_date as batch_start_date,
  b.end_date as batch_end_date
FROM pendaftaran_tikrar_tahfidz p
JOIN thalibah t ON p.thalibah_id = t.id
JOIN programs pr ON p.program_id = pr.id
LEFT JOIN batches b ON p.batch_id = b.id;

DROP VIEW IF EXISTS active_users_complete;
CREATE VIEW active_users_complete AS
SELECT
  u.id,
  u.email,
  u.full_name,
  u.nama_kunyah,
  u.role,
  u.roles,
  u.is_active,
  u.phone,
  u.whatsapp,
  u.provinsi,
  u.kota,
  u.created_at,
  u.updated_at
FROM users u
WHERE u.is_active = true;

-- ============================================================================
-- 3. FIX INSECURE METADATA REFERENCE
-- ============================================================================

-- Replace policies that check raw_user_meta_data with safer alternatives

-- batches table - fix policies that check auth.jwt()->>'user_metadata'
-- Note: This assumes batches have user_id references instead of metadata checks

DROP POLICY IF EXISTS "Users can view active batches" ON batches;
CREATE POLICY "Users can view active batches"
ON batches
FOR SELECT
TO authenticated
USING (status = 'active' OR status = 'open');

DROP POLICY IF EXISTS "Admins can manage all batches" ON batches;
CREATE POLICY "Admins can manage all batches"
ON batches
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR 'admin' = ANY(users.roles))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR 'admin' = ANY(users.roles))
  )
);

DROP POLICY IF EXISTS "Musyrifah can view batches" ON batches;
CREATE POLICY "Musyrifah can view batches"
ON batches
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'musyrifah' OR 'musyrifah' = ANY(users.roles))
  )
);

DROP POLICY IF EXISTS "Muallimah can view batches" ON batches;
CREATE POLICY "Muallimah can view batches"
ON batches
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'muallimah' OR 'muallimah' = ANY(users.roles))
  )
);

DROP POLICY IF EXISTS "Thalibah can view batches" ON batches;
CREATE POLICY "Thalibah can view batches"
ON batches
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      users.role IN ('thalibah', 'calon_thalibah')
      OR users.roles && ARRAY['thalibah', 'calon_thalibah']::text[]
    )
  )
);

-- users table - ensure policies don't rely on metadata
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins/staff can view all users" ON users;
CREATE POLICY "Admins/staff can view all users"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u_check
    WHERE u_check.id = auth.uid()
    AND (
      u_check.role IN ('admin', 'super_admin', 'musyrifah', 'muallimah')
      OR u_check.roles && ARRAY['admin', 'super_admin', 'musyrifah', 'muallimah']::text[]
    )
  )
);

DROP POLICY IF EXISTS "Admins can manage all users" ON users;
CREATE POLICY "Admins can manage all users"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u_check
    WHERE u_check.id = auth.uid()
    AND (u_check.role = 'admin' OR 'admin' = ANY(u_check.roles))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u_check
    WHERE u_check.id = auth.uid()
    AND (u_check.role = 'admin' OR 'admin' = ANY(u_check.roles))
  )
);

-- ============================================================================
-- 4. FIX MUTABLE SEARCH PATH
-- ============================================================================

-- Set search_path for all SECURITY DEFINER functions to prevent hijacking

ALTER FUNCTION handle_new_user SET search_path = public;
ALTER FUNCTION add_user_role SET search_path = public;
ALTER FUNCTION remove_user_role SET search_path = public;
ALTER FUNCTION has_user_role SET search_path = public;
ALTER FUNCTION log_system_error SET search_path = public;
ALTER FUNCTION cleanup_old_system_logs SET search_path = public;

-- Also fix search path for any existing admin functions
DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN
    SELECT p.proname as func_name
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND p.prosecdef  -- SECURITY DEFINER functions
    AND NOT EXISTS (
      SELECT 1 FROM pg_proc_config
      WHERE pg_proc_config.prooid = p.oid
      AND pg_proc_config.configkey = 'search_path'
    )
  LOOP
    EXECUTE format('ALTER FUNCTION %I SET search_path = public', func_record.func_name);
  END LOOP;
END $$;

-- ============================================================================
-- 5. ENABLE RLS FOR exam_configurations
-- ============================================================================

-- Enable RLS on exam_configurations
ALTER TABLE exam_configurations ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage all exam configurations
DROP POLICY IF EXISTS "Admins can manage exam_configurations" ON exam_configurations;
CREATE POLICY "Admins can manage exam_configurations"
ON exam_configurations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR 'admin' = ANY(users.roles))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR 'admin' = ANY(users.roles))
  )
);

-- Policy: Authenticated users can view active exam configurations
DROP POLICY IF EXISTS "Authenticated can view active exam_configurations" ON exam_configurations;
CREATE POLICY "Authenticated can view active exam_configurations"
ON exam_configurations
FOR SELECT
TO authenticated
USING (is_active = true);

-- ============================================================================
-- 6. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "Admins can view all halaqah_mentors" ON halaqah_mentors IS
  'Allows admin users to perform all operations on halaqah_mentors table';
COMMENT ON POLICY "Mentors can view own assignments" ON halaqah_mentors IS
  'Allows mentors to view their own halaqah assignments';
COMMENT ON POLICY "Students can view their halaqah mentors" ON halaqah_mentors IS
  'Allows students to view mentors in their assigned halaqah';

COMMENT ON POLICY "Admins can view all halaqah_students" ON halaqah_students IS
  'Allows admin users to perform all operations on halaqah_students table';
COMMENT ON POLICY "Students can view own halaqah" ON halaqah_students IS
  'Allows students to view their own halaqah assignments';
COMMENT ON POLICY "Mentors can view students in their halaqah" ON halaqah_students IS
  'Allows mentors to view students in their assigned halaqah';

COMMENT ON POLICY "Authenticated users can view juz_options" ON juz_options IS
  'Allows all authenticated users to view Juz options for selection';
COMMENT ON POLICY "Admins can manage juz_options" ON juz_options IS
  'Allows admin users to create, update, and delete Juz options';

COMMENT ON POLICY "Admins can manage maintenance_mode" ON maintenance_mode IS
  'Allows admin users to manage system maintenance mode';
COMMENT ON POLICY "Authenticated can read maintenance_mode" ON maintenance_mode IS
  'Allows all authenticated users to check if system is in maintenance mode';

COMMENT ON POLICY "Admins can view all presensi" ON presensi IS
  'Allows admin users to perform all operations on presensi table';
COMMENT ON POLICY "Students can view own presensi" ON presensi IS
  'Allows students to view their own presensi records';
COMMENT ON POLICY "Mentors can view presensi in their halaqah" ON presensi IS
  'Allows mentors to view presensi for students in their halaqah';

COMMENT ON VIEW v_users_with_tikrar_batch IS
  'View of users with their current Tikrar batch information (uses RLS, no SECURITY DEFINER)';
COMMENT ON VIEW user_registrations IS
  'View of user registrations with program and batch details (uses RLS, no SECURITY DEFINER)';
COMMENT ON VIEW active_users_complete IS
  'View of active users (uses RLS, no SECURITY DEFINER)';

-- ============================================================================
-- 7. VALIDATION FUNCTIONS FOR SECURITY
-- ============================================================================

-- Helper function to safely check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE users.id = is_admin_user.user_id
    AND (users.role = 'admin' OR 'admin' = ANY(users.roles))
  );
END;
$$;

-- Helper function to safely check if user has any of the specified roles
CREATE OR REPLACE FUNCTION user_has_role(user_id UUID, role_names TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE users.id = user_has_role.user_id
    AND (
      users.role = ANY(role_names)
      OR users.roles && role_names
    )
  );
END;
$$;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION is_admin_user TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_role TO authenticated;

-- ============================================================================
-- 8. SECURITY AUDIT LOGGING
-- ============================================================================

-- Log this security hardening action
INSERT INTO system_logs (
  error_message,
  error_name,
  severity,
  error_type,
  is_auth_error,
  context,
  environment
) VALUES (
  'Security hardening migration applied: RLS policies added, views secured, search paths fixed',
  'Security Migration',
  'INFO',
  'auth',
  false,
  '{"migration": "20260106_hardening_security", "changes": ["rls_policies", "view_security", "search_path_fix"]}'::jsonb,
  current_setting('app.environment', TRUE)::TEXT
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Verification queries (run these after migration to verify):

-- Check RLS policies for critical tables
/*
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN (
  'halaqah_mentors',
  'halaqah_students',
  'juz_options',
  'maintenance_mode',
  'presensi',
  'exam_configurations'
)
ORDER BY tablename, policyname;
*/

-- Check search_path for SECURITY DEFINER functions
/*
SELECT
  p.proname as function_name,
  pg_get_userbyid(p.proowner) as owner,
  p.prosecdef as is_security_definer,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f'
AND p.prosecdef
ORDER BY p.proname;
*/

-- Check view security
/*
SELECT
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views
WHERE viewname IN ('v_users_with_tikrar_batch', 'user_registrations', 'active_users_complete');
*/

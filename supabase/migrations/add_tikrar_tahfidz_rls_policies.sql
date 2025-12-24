-- Enable RLS on programs table (needed for fetching program_id)
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on pendaftaran_tikrar_tahfidz table
ALTER TABLE pendaftaran_tikrar_tahfidz ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can view all programs" ON programs;
DROP POLICY IF EXISTS "Authenticated users can view open programs" ON programs;
DROP POLICY IF EXISTS "Admins can manage programs" ON programs;
DROP POLICY IF EXISTS "Users can view their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can insert their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can update their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Admins can view all tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Admins can update all tikrar registrations" ON pendaftaran_tikrar_tahfidz;

-- ============================================================================
-- PROGRAMS TABLE POLICIES
-- ============================================================================

-- Policy: Authenticated users can view all programs (needed for registration)
CREATE POLICY "Authenticated users can view all programs"
ON programs
FOR SELECT
TO authenticated
USING (true);

-- Policy: Admins can manage all programs
CREATE POLICY "Admins can manage programs"
ON programs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- ============================================================================
-- PENDAFTARAN TIKRAR TAHFIDZ POLICIES
-- ============================================================================

-- Policy: Users can view their own registrations
CREATE POLICY "Users can view their own tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own registrations
CREATE POLICY "Users can insert their own tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own registrations (only if status is pending)
CREATE POLICY "Users can update their own tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all registrations
CREATE POLICY "Admins can view all tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Policy: Admins can update all registrations
CREATE POLICY "Admins can update all tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

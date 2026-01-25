-- ============================================================================
-- Migration: Allow viewing user profiles through foreign key relationships
-- Date: 2026-01-10
-- Description: Fix halaqah_students query by allowing users to view basic
--              profile information when referenced via foreign keys
-- ============================================================================

-- ============================================================================
-- PROBLEM
-- ============================================================================
-- When querying halaqah_students with a relation to users table:
--   supabase.from('halaqah_students').select('*, thalibah:users!...(*)')
--
-- The RLS policy on users table blocks the join because:
-- 1. Non-admin users can only view their own profile
-- 2. Muallimah needs to view thalibah profiles in their halaqah
-- 3. The relation join requires permission to read the referenced user rows
--
-- SOLUTION: Allow authenticated users to view public profile information
-- when the user is referenced through certain foreign key relationships.

-- ============================================================================
-- 1. Add policy for viewing public profiles through FK relationships
-- ============================================================================

-- Policy: Allow viewing limited user profile data when user is referenced
-- through halaqah_students, halaqah_mentors, study_partners, etc.
DROP POLICY IF EXISTS "Authenticated users can view public profiles via FK" ON users;

CREATE POLICY "Authenticated users can view public profiles via FK"
ON users
FOR SELECT
TO authenticated
USING (
  -- User can always view their own profile
  id = auth.uid()
  OR
  -- Allow viewing users who are:
  EXISTS (
    SELECT 1 FROM (
      -- Thalibah in halaqah_students (if viewer is muallimah of that halaqah or thalibah themselves)
      SELECT 1
      FROM halaqah_students hs
      INNER JOIN halaqah h ON h.id = hs.halaqah_id
      WHERE hs.thalibah_id = users.id
        AND (
          h.muallimah_id = auth.uid()
          OR hs.thalibah_id = auth.uid()
        )

      UNION

      -- Muallimah (if viewer is admin or thalibah in their halaqah)
      SELECT 1
      FROM halaqah h
      WHERE h.muallimah_id = users.id
        AND (
          EXISTS (
            SELECT 1 FROM users u WHERE u.id = auth.uid() AND 'admin' = ANY(u.roles)
          )
          OR EXISTS (
            SELECT 1 FROM halaqah_students hs
            WHERE hs.halaqah_id = h.id AND hs.thalibah_id = auth.uid()
          )
        )

      UNION

      -- Study partners (if viewer is one of the partners)
      SELECT 1
      FROM study_partners sp
      WHERE (sp.user_1_id = users.id OR sp.user_2_id = users.id)
        AND (sp.user_1_id = auth.uid() OR sp.user_2_id = auth.uid())

      UNION

      -- Mentors in halaqah_mentors (if viewer is muallimah/admin of that halaqah)
      SELECT 1
      FROM halaqah_mentors hm
      INNER JOIN halaqah h ON h.id = hm.halaqah_id
      WHERE hm.mentor_id = users.id
        AND (
          h.muallimah_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM users u WHERE u.id = auth.uid() AND 'admin' = ANY(u.roles)
          )
        )

      UNION

      -- Daftar ulang partners (if viewer is the submitter or the partner)
      SELECT 1
      FROM daftar_ulang_submissions dus
      WHERE (dus.user_id = users.id OR dus.partner_user_id = users.id)
        AND (dus.user_id = auth.uid() OR dus.partner_user_id = auth.uid())
    ) AS allowed_users
  )
);

-- ============================================================================
-- 2. Alternative: Allow muallimah to view thalibah in their halaqah
-- ============================================================================

-- This is a more targeted policy for the specific use case
DROP POLICY IF EXISTS "Muallimah can view thalibah in their halaqah" ON users;

CREATE POLICY "Muallimah can view thalibah in their halaqah"
ON users
FOR SELECT
TO authenticated
USING (
  -- User can view their own profile
  id = auth.uid()
  OR
  -- Muallimah can view thalibah enrolled in their halaqah
  EXISTS (
    SELECT 1
    FROM halaqah_students hs
    INNER JOIN halaqah h ON h.id = hs.halaqah_id
    WHERE hs.thalibah_id = users.id
      AND h.muallimah_id = auth.uid()
  )
);

-- ============================================================================
-- 3. Also add policy for muallimah to be viewable by their thalibah
-- ============================================================================

DROP POLICY IF EXISTS "Thalibah can view their muallimah" ON users;

CREATE POLICY "Thalibah can view their muallimah"
ON users
FOR SELECT
TO authenticated
USING (
  -- User can view their own profile
  id = auth.uid()
  OR
  -- Thalibah can view muallimah of their halaqah
  EXISTS (
    SELECT 1
    FROM halaqah_students hs
    INNER JOIN halaqah h ON h.id = hs.halaqah_id
    WHERE h.muallimah_id = users.id
      AND hs.thalibah_id = auth.uid()
  )
);

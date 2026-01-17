-- =====================================================
-- FIX DAFTAR ULANG SUBMISSIONS RLS FOR ROLES ARRAY
-- =====================================================
-- Update RLS policies to work with users.roles array instead of users.role
-- =====================================================

-- Drop existing admin policies that use old role column
DROP POLICY IF EXISTS "Admins can view all daftar ulang submissions" ON public.daftar_ulang_submissions;
DROP POLICY IF EXISTS "Admins can update all daftar ulang submissions" ON public.daftar_ulang_submissions;

-- Recreate admin policies using roles array
CREATE POLICY "Admins can view all daftar ulang submissions"
  ON public.daftar_ulang_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND 'admin' = ANY(users.roles)
    )
  );

CREATE POLICY "Admins can update all daftar ulang submissions"
  ON public.daftar_ulang_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND 'admin' = ANY(users.roles)
    )
  );

-- Ensure user can always view their own submissions (first priority)
-- This should work, but let's make it more explicit
DROP POLICY IF EXISTS "Users can view batch daftar ulang submissions" ON public.daftar_ulang_submissions;

CREATE POLICY "Users can view own daftar ulang submissions"
  ON public.daftar_ulang_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view batch daftar ulang submissions"
  ON public.daftar_ulang_submissions FOR SELECT
  TO authenticated
  USING (
    -- User can view submissions in the same batch (for pairing/ustadzah selection)
    -- Only if they have their own submission in that batch
    EXISTS (
      SELECT 1 FROM public.daftar_ulang_submissions AS own_sub
      WHERE own_sub.user_id = auth.uid()
        AND own_sub.batch_id = daftar_ulang_submissions.batch_id
    )
    AND auth.uid() != daftar_ulang_submissions.user_id -- Not their own (already covered)
  );

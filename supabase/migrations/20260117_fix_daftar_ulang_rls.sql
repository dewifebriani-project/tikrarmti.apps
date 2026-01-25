-- =====================================================
-- FIX DAFTAR ULANG SUBMISSIONS RLS POLICIES
-- =====================================================
-- Enable RLS but allow users to view submissions in the same batch
-- This is needed for pairing and ustadzah selection features
-- =====================================================

-- Enable RLS on daftar_ulang_submissions
ALTER TABLE public.daftar_ulang_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can update all daftar ulang" ON public.daftar_ulang_submissions;
DROP POLICY IF EXISTS "Admins can view all daftar ulang" ON public.daftar_ulang_submissions;
DROP POLICY IF EXISTS "Service role bypass on submissions" ON public.daftar_ulang_submissions;
DROP POLICY IF EXISTS "Users can insert own daftar ulang" ON public.daftar_ulang_submissions;
DROP POLICY IF EXISTS "Users can update own daftar ulang" ON public.daftar_ulang_submissions;
DROP POLICY IF EXISTS "Users can update own draft daftar ulang" ON public.daftar_ulang_submissions;
DROP POLICY IF EXISTS "Users can view own daftar ulang" ON public.daftar_ulang_submissions;
DROP POLICY IF EXISTS "Users can delete own daftar ulang submissions" ON public.daftar_ulang_submissions;

-- Policy: Users can view submissions in the same batch (for pairing & ustadzah selection)
CREATE POLICY "Users can view batch daftar ulang submissions"
  ON public.daftar_ulang_submissions FOR SELECT
  TO authenticated
  USING (
    -- User can view their own submissions
    auth.uid() = user_id
    OR
    -- User can view submissions in the same batch (for pairing/ustadzah selection)
    EXISTS (
      -- Check if there's a submission from this user in the same batch
      SELECT 1 FROM public.daftar_ulang_submissions AS own_sub
      WHERE own_sub.user_id = auth.uid()
        AND own_sub.batch_id = daftar_ulang_submissions.batch_id
    )
  );

-- Policy: Users can insert their own submissions
CREATE POLICY "Users can insert own daftar ulang submissions"
  ON public.daftar_ulang_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own submissions
CREATE POLICY "Users can update own daftar ulang submissions"
  ON public.daftar_ulang_submissions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own submissions
CREATE POLICY "Users can delete own daftar ulang submissions"
  ON public.daftar_ulang_submissions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all daftar ulang submissions"
  ON public.daftar_ulang_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all daftar ulang submissions"
  ON public.daftar_ulang_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

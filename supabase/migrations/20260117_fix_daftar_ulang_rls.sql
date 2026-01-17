-- =====================================================
-- FIX DAFTAR ULANG SUBMISSIONS RLS POLICIES
-- =====================================================
-- Enable proper RLS so users can view their own submissions
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

-- Create proper policies using auth.uid()
CREATE POLICY "Users can view own daftar ulang submissions"
  ON public.daftar_ulang_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daftar ulang submissions"
  ON public.daftar_ulang_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daftar ulang submissions"
  ON public.daftar_ulang_submissions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

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

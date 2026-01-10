-- Migration: Fix daftar_ulang_submissions UPDATE policy to allow draft->submitted transition
-- This fixes the infinite recursion issue with the previous policy

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Users can update own draft daftar ulang" ON public.daftar_ulang_submissions;

-- Create a simpler UPDATE policy without self-reference
-- This allows users to update their own submissions
-- Users can change status from draft -> submitted without restriction
CREATE POLICY "Users can update own daftar ulang"
  ON public.daftar_ulang_submissions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

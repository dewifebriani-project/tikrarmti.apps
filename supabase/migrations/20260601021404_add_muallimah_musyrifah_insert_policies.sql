-- =====================================================
-- FIX: Add missing INSERT and UPDATE policies for registrations
-- =====================================================

-- 1. muallimah_registrations
DROP POLICY IF EXISTS muallimah_insert_own ON public.muallimah_registrations;
CREATE POLICY muallimah_insert_own ON public.muallimah_registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS muallimah_update_own ON public.muallimah_registrations;
CREATE POLICY muallimah_update_own ON public.muallimah_registrations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. musyrifah_registrations
DROP POLICY IF EXISTS musyrifah_insert_own ON public.musyrifah_registrations;
CREATE POLICY musyrifah_insert_own ON public.musyrifah_registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS musyrifah_update_own ON public.musyrifah_registrations;
CREATE POLICY musyrifah_update_own ON public.musyrifah_registrations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

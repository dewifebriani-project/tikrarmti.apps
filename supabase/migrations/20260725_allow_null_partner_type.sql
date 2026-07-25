-- ============================================================================
-- ALLOW NULL partner_type ON daftar_ulang_submissions
-- ============================================================================
-- The daftar-ulang flow calls submitDaftarUlang() progressively across the
-- 'akad', 'halaqah', and 'partner' steps, upserting the same row each time
-- (see app/(protected)/daftar-ulang/actions.ts and page.tsx handleSubmit).
--
-- At the FIRST call (from the 'akad' step, right after uploading the akad
-- file) the user has not reached the 'partner' step yet, so partner_type is
-- still unset. Because the column was NOT NULL with a CHECK restricting it
-- to ('self_match','system_match','family','tarteel'), every very first
-- akad submission failed with:
--   new row for relation "daftar_ulang_submissions" violates check
--   constraint "daftar_ulang_submissions_partner_type_check"
--
-- Pra-Tikrar (waitlist) users skip the 'partner' step entirely, so their
-- row is expected to keep partner_type = NULL permanently.
--
-- Author: Bug fix for live production error
-- Date: 2026-07-25
-- ============================================================================

ALTER TABLE public.daftar_ulang_submissions
  ALTER COLUMN partner_type DROP NOT NULL;

ALTER TABLE public.daftar_ulang_submissions
  DROP CONSTRAINT IF EXISTS daftar_ulang_submissions_partner_type_check;

ALTER TABLE public.daftar_ulang_submissions
  ADD CONSTRAINT daftar_ulang_submissions_partner_type_check CHECK (
    partner_type IS NULL
    OR (partner_type)::text = ANY (
      ARRAY['self_match'::character varying, 'system_match'::character varying, 'family'::character varying, 'tarteel'::character varying]::text[]
    )
  );

COMMENT ON COLUMN public.daftar_ulang_submissions.partner_type IS 'Partner type: self_match, system_match, family, tarteel. NULL until the user reaches the partner-selection step (or permanently NULL for Pra-Tikrar/waitlist users, who skip that step).';

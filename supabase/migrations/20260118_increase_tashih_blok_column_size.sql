-- =====================================================
-- INCREASE TASHIH BLOK COLUMN SIZE
-- =====================================================
-- Increase blok column from VARCHAR(10) to VARCHAR(100)
-- to support multiple blocks stored as comma-separated values
-- Example: "H11A,H11B,H11C,H11D" (15 chars)
-- =====================================================

ALTER TABLE public.tashih_records
  ALTER COLUMN blok TYPE VARCHAR(100);

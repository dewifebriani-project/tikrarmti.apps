-- Add oral assessment columns to pendaftaran_tikrar_tahfidz
-- This allows admin to score oral submissions based on tajweed criteria

-- Add assessment columns
ALTER TABLE public.pendaftaran_tikrar_tahfidz
ADD COLUMN IF NOT EXISTS oral_makhraj_errors INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS oral_sifat_errors INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS oral_mad_errors INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS oral_ghunnah_errors INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS oral_harakat_errors INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS oral_total_score DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS oral_assessment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS oral_assessed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS oral_assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS oral_assessment_notes TEXT DEFAULT NULL;

-- Add constraint for assessment status
ALTER TABLE public.pendaftaran_tikrar_tahfidz
DROP CONSTRAINT IF EXISTS oral_assessment_status_check;

ALTER TABLE public.pendaftaran_tikrar_tahfidz
ADD CONSTRAINT oral_assessment_status_check CHECK (
  oral_assessment_status IN ('pending', 'pass', 'fail', 'not_submitted')
);

-- Create index for oral assessment queries
CREATE INDEX IF NOT EXISTS idx_oral_assessment_status
ON public.pendaftaran_tikrar_tahfidz(oral_assessment_status);

CREATE INDEX IF NOT EXISTS idx_oral_submitted_pending
ON public.pendaftaran_tikrar_tahfidz(oral_submitted_at, oral_assessment_status)
WHERE oral_submitted_at IS NOT NULL AND oral_assessment_status = 'pending';

-- Add comment
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.oral_makhraj_errors IS 'Number of makhraj errors in oral submission';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.oral_sifat_errors IS 'Number of sifatul huruf errors in oral submission';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.oral_mad_errors IS 'Number of mad errors in oral submission';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.oral_ghunnah_errors IS 'Number of ghunnah errors in oral submission';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.oral_harakat_errors IS 'Number of harakat errors in oral submission';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.oral_total_score IS 'Calculated total score (0-100). Pass if >= 70';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.oral_assessment_status IS 'Status: pending, pass, fail, not_submitted';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Oral assessment columns added successfully';
  RAISE NOTICE 'Columns: oral_makhraj_errors, oral_sifat_errors, oral_mad_errors, oral_ghunnah_errors, oral_harakat_errors';
  RAISE NOTICE 'Columns: oral_total_score, oral_assessment_status, oral_assessed_by, oral_assessed_at, oral_assessment_notes';
END $$;

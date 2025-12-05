-- Complete fix for batch functionality
-- Run this in Supabase SQL Editor

-- 1. Add duration_weeks column
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS duration_weeks INTEGER DEFAULT 0;

-- 2. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own batches" ON public.batches;
DROP POLICY IF EXISTS "Users can insert own batches" ON public.batches;
DROP POLICY IF EXISTS "Users can update own batches" ON public.batches;
DROP POLICY IF EXISTS "Users can delete own batches" ON public.batches;

-- 3. Create new policies that allow admin users full access
CREATE POLICY "Admins can view all batches" ON public.batches
    FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

CREATE POLICY "Admins can insert batches" ON public.batches
    FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

CREATE POLICY "Admins can update batches" ON public.batches
    FOR UPDATE
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    )
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

CREATE POLICY "Admins can delete batches" ON public.batches
    FOR DELETE
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

-- 4. Make sure RLS is enabled
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- 5. Grant necessary permissions
GRANT ALL ON public.batches TO authenticated;

-- 6. Create function to calculate duration
CREATE OR REPLACE FUNCTION calculate_batch_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate duration in weeks when both dates are available
  IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL AND NEW.duration_weeks = 0 THEN
    -- Calculate the difference in days and convert to weeks
    NEW.duration_weeks = CEIL(
      (EXTRACT(EPOCH FROM (NEW.end_date::date - NEW.start_date::date)) / 86400 + 1) / 7
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for automatic calculation
DROP TRIGGER IF EXISTS on_batch_insert_update ON public.batches;
CREATE TRIGGER on_batch_insert_update
  BEFORE INSERT OR UPDATE ON public.batches
  FOR EACH ROW
  EXECUTE FUNCTION calculate_batch_duration();

-- 8. Update existing batches to calculate duration
UPDATE public.batches
SET duration_weeks = CEIL(
  (EXTRACT(EPOCH FROM (end_date::date - start_date::date)) / 86400 + 1) / 7
)
WHERE duration_weeks = 0 AND start_date IS NOT NULL AND end_date IS NOT NULL;
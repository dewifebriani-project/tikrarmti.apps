-- =====================================================
-- STANDARDIZE RLS ROLE CHECKS TO ARRAY OPERATORS
-- =====================================================
-- This migration updates RLS policies to use the 'roles' array
-- instead of the single 'role' varchar column.
-- =====================================================

-- 1. TASHIH RECORDS
-- Already handled in tashih_records_update.sql, but we can re-apply here for consistency
DROP POLICY IF EXISTS "Admins can view all tashih records" ON public.tashih_records;
CREATE POLICY "Admins can view all tashih records"
  ON public.tashih_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND (users.roles @> ARRAY['admin']::text[])
    )
  );

-- 2. PAIRING RECORDS (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'study_partners') THEN
        DROP POLICY IF EXISTS "Admins can manage all pairings" ON public.study_partners;
        CREATE POLICY "Admins can manage all pairings"
          ON public.study_partners FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM public.users
              WHERE users.id = auth.uid() AND (users.roles @> ARRAY['admin']::text[])
            )
          );
    END IF;
END $$;

-- 3. BATCHES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'batches') THEN
        DROP POLICY IF EXISTS "Admins can manage batches" ON public.batches;
        CREATE POLICY "Admins can manage batches"
          ON public.batches FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM public.users
              WHERE users.id = auth.uid() AND (users.roles @> ARRAY['admin']::text[])
            )
          );
    END IF;
END $$;

-- 4. PROGRAMS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'programs') THEN
        DROP POLICY IF EXISTS "Admins can manage programs" ON public.programs;
        CREATE POLICY "Admins can manage programs"
          ON public.programs FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM public.users
              WHERE users.id = auth.uid() AND (users.roles @> ARRAY['admin']::text[])
            )
          );
    END IF;
END $$;

-- 5. HALAQAH
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'halaqah') THEN
        DROP POLICY IF EXISTS "Admins can manage halaqah" ON public.halaqah;
        CREATE POLICY "Admins can manage halaqah"
          ON public.halaqah FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM public.users
              WHERE users.id = auth.uid() AND (users.roles @> ARRAY['admin']::text[])
            )
          );
    END IF;
END $$;

-- 6. PENDAFTARAN
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'pendaftaran') THEN
        DROP POLICY IF EXISTS "Admins can view all registrations" ON public.pendaftaran;
        CREATE POLICY "Admins can view all registrations"
          ON public.pendaftaran FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM public.users
              WHERE users.id = auth.uid() AND (users.roles @> ARRAY['admin']::text[])
            )
          );
    END IF;
END $$;

-- =====================================================
-- TRIGGER TO SYNC ROLE COLUMNS (Permanent Fix)
-- =====================================================
-- This ensures that any update to 'roles' array automatically 
-- updates 'role' varchar for backward compatibility, and vice versa.

CREATE OR REPLACE FUNCTION sync_role_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- When 'role' is updated, update 'roles' array to match if it's currently empty or different
  IF (TG_OP = 'INSERT' OR NEW.role IS DISTINCT FROM OLD.role) THEN
    IF NEW.roles IS NULL OR array_length(NEW.roles, 1) IS NULL THEN
        IF NEW.role IS NOT NULL THEN
            NEW.roles := ARRAY[NEW.role]::text[];
        END IF;
    END IF;
  END IF;

  -- When 'roles' array is updated, update 'role' varchar to match (first role for legacy)
  IF (TG_OP = 'INSERT' OR NEW.roles IS DISTINCT FROM OLD.roles) THEN
    IF NEW.roles @> ARRAY['admin']::text[] THEN
      NEW.role := 'admin';
    ELSIF NEW.roles @> ARRAY['muallimah']::text[] THEN
      NEW.role := 'muallimah';
    ELSIF NEW.roles @> ARRAY['musyrifah']::text[] THEN
      NEW.role := 'musyrifah';
    ELSIF NEW.roles @> ARRAY['thalibah']::text[] THEN
      NEW.role := 'thalibah';
    ELSIF NEW.roles @> ARRAY['pengurus']::text[] THEN
      NEW.role := 'pengurus';
    ELSIF array_length(NEW.roles, 1) > 0 THEN
      NEW.role := NEW.roles[1];
    ELSE
      NEW.role := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_role_columns_trigger ON public.users;
CREATE TRIGGER sync_role_columns_trigger
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_role_columns();

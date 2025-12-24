-- ============================================================================
-- SQL UPDATE SCRIPT FOR MUALLIMAH_REGISTRATIONS TABLE
-- ============================================================================
-- Purpose: Add missing fields to match MuallimahFormData interface
-- Execute with: psql -U postgres -d your_database -f muallimah_registrations_update.sql
-- ============================================================================

-- Add class_type field if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'muallimah_registrations'
        AND column_name = 'class_type'
    ) THEN
        ALTER TABLE public.muallimah_registrations
        ADD COLUMN class_type text;

        -- Add CHECK constraint for class_type
        ALTER TABLE public.muallimah_registrations
        ADD CONSTRAINT muallimah_registrations_class_type_check
        CHECK (class_type = ANY (ARRAY['tashih_ujian'::text, 'tashih_only'::text, 'ujian_only'::text]));

        -- Set default value for existing records
        UPDATE public.muallimah_registrations
        SET class_type = 'tashih_ujian'
        WHERE class_type IS NULL;

        RAISE NOTICE 'Added column: class_type';
    ELSE
        RAISE NOTICE 'Column class_type already exists, skipping...';
    END IF;
END $$;

-- Add preferred_max_thalibah field if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'muallimah_registrations'
        AND column_name = 'preferred_max_thalibah'
    ) THEN
        ALTER TABLE public.muallimah_registrations
        ADD COLUMN preferred_max_thalibah integer;

        RAISE NOTICE 'Added column: preferred_max_thalibah';
    ELSE
        RAISE NOTICE 'Column preferred_max_thalibah already exists, skipping...';
    END IF;
END $$;

-- ============================================================================
-- VERIFY CHANGES
-- ============================================================================

-- Check the updated table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'muallimah_registrations'
AND column_name IN ('class_type', 'preferred_max_thalibah')
ORDER BY column_name;

-- ============================================================================
-- INDEXES (Optional but recommended for performance)
-- ============================================================================

-- Create index on class_type if not exists
CREATE INDEX IF NOT EXISTS idx_muallimah_registrations_class_type
ON public.muallimah_registrations USING btree (class_type);

-- Create index on preferred_max_thalibah if not exists
CREATE INDEX IF NOT EXISTS idx_muallimah_registrations_preferred_max_thalibah
ON public.muallimah_registrations USING btree (preferred_max_thalibah);

-- ============================================================================
-- DONE
-- ============================================================================
-- Expected final schema should match:
--
-- class_type text CHECK (class_type IN ('tashih_ujian', 'tashih_only', 'ujian_only'))
-- preferred_max_thalibah integer
-- ============================================================================

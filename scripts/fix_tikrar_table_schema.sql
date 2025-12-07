-- =====================================================
-- Schema Updates for Tikrar Tahfidz Registration
-- =====================================================

-- 1. Check if table pendaftaran_tikrar_tahfidz exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'pendaftaran_tikrar_tahfidz'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Table pendaftaran_tikrar_tahfidz already exists';
    ELSE
        RAISE NOTICE 'Table pendaftaran_tikrar_tahfidz does not exist';
    END IF;
END
$$;

-- 2. If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS public.pendaftaran_tikrar_tahfidz (
    id UUID NOT NULL DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL,
    batch_id UUID NOT NULL,
    program_id UUID NOT NULL,
    understands_commitment BOOLEAN NOT NULL DEFAULT false,
    tried_simulation BOOLEAN NOT NULL DEFAULT false,
    no_negotiation BOOLEAN NOT NULL DEFAULT false,
    has_telegram BOOLEAN NOT NULL DEFAULT false,
    saved_contact BOOLEAN NOT NULL DEFAULT false,
    has_permission BOOLEAN NOT NULL DEFAULT false,
    permission_name TEXT NULL,
    permission_phone TEXT NULL,
    chosen_juz TEXT NULL,
    no_travel_plans BOOLEAN NOT NULL DEFAULT false,
    motivation TEXT NULL,
    ready_for_team TEXT NULL,
    full_name TEXT NULL,
    address TEXT NULL,
    wa_phone TEXT NULL,
    telegram_phone TEXT NULL,
    birth_date DATE NULL,
    age INTEGER NULL,
    domicile TEXT NULL,
    timezone TEXT NULL,
    main_time_slot TEXT NULL,
    backup_time_slot TEXT NULL,
    time_commitment BOOLEAN NOT NULL DEFAULT false,
    understands_program BOOLEAN NOT NULL DEFAULT false,
    questions TEXT NULL,
    batch_name TEXT NULL,
    submission_date TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
    status TEXT NULL DEFAULT 'pending'::text,
    selection_status TEXT NULL DEFAULT 'pending'::text,
    approved_by UUID NULL,
    approved_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
    CONSTRAINT pendaftaran_tikrar_tahfidz_pkey PRIMARY KEY (id),
    CONSTRAINT pendaftaran_tikrar_tahfidz_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES batches (id) ON DELETE CASCADE,
    CONSTRAINT pendaftaran_tikrar_tahfidz_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES users (id),
    CONSTRAINT pendaftaran_tikrar_tahfidz_program_id_fkey FOREIGN KEY (program_id) REFERENCES programs (id) ON DELETE CASCADE,
    CONSTRAINT pendaftaran_tikrar_tahfidz_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 3. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_pendaftaran_tikrar_tahfidz_user_id ON public.pendaftaran_tikrar_tahfidz USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_pendaftaran_tikrar_tahfidz_batch_id ON public.pendaftaran_tikrar_tahfidz USING btree (batch_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_pendaftaran_tikrar_tahfidz_status ON public.pendaftaran_tikrar_tahfidz USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_pendaftaran_tikrar_tahfidz_selection_status ON public.pendaftaran_tikrar_tahfidz USING btree (selection_status) TABLESPACE pg_default;

-- 4. Add check constraints if they don't exist
DO $$
BEGIN
    -- Add status check constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pendaftaran_tikrar_tahfidz_status_check'
    ) THEN
        ALTER TABLE public.pendaftaran_tikrar_tahfidz
        ADD CONSTRAINT pendaftaran_tikrar_tahfidz_status_check CHECK (
            status = ANY (
                ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'withdrawn'::text, 'completed'::text]
            )
        );
    END IF;

    -- Add selection_status check constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pendaftaran_tikrar_tahfidz_selection_status_check'
    ) THEN
        ALTER TABLE public.pendaftaran_tikrar_tahfidz
        ADD CONSTRAINT pendaftaran_tikrar_tahfidz_selection_status_check CHECK (
            selection_status = ANY (
                ARRAY['pending'::text, 'approved'::text, 'rejected'::text]
            )
        );
    END IF;
END
$$;

-- 5. Create trigger for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION handle_pendaftaran_tikrar_tahfidz_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS handle_pendaftaran_tikrar_tahfidz_updated_at ON public.pendaftaran_tikrar_tahfidz;
CREATE TRIGGER handle_pendaftaran_tikrar_tahfidz_updated_at
BEFORE UPDATE ON public.pendaftaran_tikrar_tahfidz
FOR EACH ROW EXECUTE FUNCTION handle_pendaftaran_tikrar_tahfidz_updated_at();

-- 6. Create view for backward compatibility (optional)
-- This allows the old code to work while we transition
DROP VIEW IF EXISTS tikrar_tahfidz CASCADE;
CREATE OR REPLACE VIEW tikrar_tahfidz AS
SELECT * FROM public.pendaftaran_tikrar_tahfidz;

-- 7. Grant permissions
GRANT ALL ON public.pendaftaran_tikrar_tahfidz TO authenticated;
GRANT ALL ON public.pendaftaran_tikrar_tahfidz TO service_role;

-- 8. Verify table creation
SELECT
    table_name,
    table_type,
    table_schema
FROM information_schema.tables
WHERE table_name IN ('pendaftaran_tikrar_tahfidz', 'tikrar_tahfidz')
AND table_schema = 'public';
-- Migration: Fix SP tables relationships naming for Supabase type generation
-- Created: 2026-02-02
-- Issue: Supabase finds multiple relationships between surat_peringatan and users
-- Solution: Rename foreign key constraints to be more descriptive

-- =====================================================
-- Fix surat_peringatan foreign key constraint names
-- =====================================================

-- Drop existing constraints with generic names
ALTER TABLE surat_peringatan DROP CONSTRAINT IF EXISTS sp_thalibah_fkey RESTRICT;
ALTER TABLE surat_peringatan DROP CONSTRAINT IF EXISTS sp_issued_by_fkey RESTRICT;
ALTER TABLE surat_peringatan DROP CONSTRAINT IF EXISTS sp_reviewed_by_fkey RESTRICT;

-- Recreate with descriptive names that Supabase will use for relationship types
-- Note: We also drop any auth.users references that might still exist
ALTER TABLE surat_peringatan DROP CONSTRAINT IF EXISTS surat_peringatan_thalibah_id_fkey RESTRICT;
ALTER TABLE surat_peringatan DROP CONSTRAINT IF EXISTS surat_peringatan_issued_by_fkey RESTRICT;
ALTER TABLE surat_peringatan DROP CONSTRAINT IF EXISTS surat_peringatan_reviewed_by_fkey RESTRICT;

-- Create foreign keys with specific, descriptive names
ALTER TABLE surat_peringatan
    ADD CONSTRAINT surat_peringatan_thalibah_id_fkey
    FOREIGN KEY (thalibah_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE surat_peringatan
    ADD CONSTRAINT surat_peringatan_issued_by_fkey
    FOREIGN KEY (issued_by) REFERENCES public.users(id);

ALTER TABLE surat_peringatan
    ADD CONSTRAINT surat_peringatan_reviewed_by_fkey
    FOREIGN KEY (reviewed_by) REFERENCES public.users(id);

-- =====================================================
-- Fix sp_history foreign key constraint names
-- =====================================================

-- Drop existing constraints
ALTER TABLE sp_history DROP CONSTRAINT IF EXISTS sp_history_thalibah_fkey RESTRICT;
ALTER TABLE sp_history DROP CONSTRAINT IF EXISTS sp_history_action_taken_by_fkey RESTRICT;

-- Also drop any auth.users references
ALTER TABLE sp_history DROP CONSTRAINT IF EXISTS sp_history_thalibah_id_fkey RESTRICT;
ALTER TABLE sp_history DROP CONSTRAINT IF EXISTS sp_history_action_taken_by_fkey RESTRICT;

-- Create foreign keys with specific, descriptive names
ALTER TABLE sp_history
    ADD CONSTRAINT sp_history_thalibah_id_fkey
    FOREIGN KEY (thalibah_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE sp_history
    ADD CONSTRAINT sp_history_action_taken_by_fkey
    FOREIGN KEY (action_taken_by) REFERENCES public.users(id);

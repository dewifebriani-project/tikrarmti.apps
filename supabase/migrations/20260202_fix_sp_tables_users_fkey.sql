-- Migration: Fix SP tables foreign keys to reference public.users
-- Created: 2026-02-02
-- Issue: surat_peringatan and sp_history tables have foreign keys pointing to auth.users
-- instead of public.users, causing schema cache issues
-- Fix: Drop and recreate foreign keys to reference public.users

-- =====================================================
-- Fix surat_peringatan table foreign keys
-- =====================================================

-- Drop existing foreign keys that reference auth.users
ALTER TABLE surat_peringatan DROP CONSTRAINT IF EXISTS surat_peringatan_thalibah_id_fkey;
ALTER TABLE surat_peringatan DROP CONSTRAINT IF EXISTS surat_peringatan_issued_by_fkey;
ALTER TABLE surat_peringatan DROP CONSTRAINT IF EXISTS surat_peringatan_reviewed_by_fkey;
ALTER TABLE surat_peringatan DROP CONSTRAINT IF EXISTS sp_thalibah_fkey;
ALTER TABLE surat_peringatan DROP CONSTRAINT IF EXISTS sp_issued_by_fkey;
ALTER TABLE surat_peringatan DROP CONSTRAINT IF EXISTS sp_reviewed_by_fkey;

-- Recreate foreign keys to reference public.users
ALTER TABLE surat_peringatan
    ADD CONSTRAINT sp_thalibah_fkey
    FOREIGN KEY (thalibah_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE surat_peringatan
    ADD CONSTRAINT sp_issued_by_fkey
    FOREIGN KEY (issued_by) REFERENCES public.users(id);

ALTER TABLE surat_peringatan
    ADD CONSTRAINT sp_reviewed_by_fkey
    FOREIGN KEY (reviewed_by) REFERENCES public.users(id);

-- =====================================================
-- Fix sp_history table foreign keys
-- =====================================================

-- Drop existing foreign keys that reference auth.users
ALTER TABLE sp_history DROP CONSTRAINT IF EXISTS sp_history_thalibah_id_fkey;
ALTER TABLE sp_history DROP CONSTRAINT IF EXISTS sp_history_action_taken_by_fkey;
ALTER TABLE sp_history DROP CONSTRAINT IF EXISTS sp_history_thalibah_fkey;
ALTER TABLE sp_history DROP CONSTRAINT IF EXISTS sp_history_action_taken_by_fkey;

-- Recreate foreign keys to reference public.users
ALTER TABLE sp_history
    ADD CONSTRAINT sp_history_thalibah_fkey
    FOREIGN KEY (thalibah_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE sp_history
    ADD CONSTRAINT sp_history_action_taken_by_fkey
    FOREIGN KEY (action_taken_by) REFERENCES public.users(id);

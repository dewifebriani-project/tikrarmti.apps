-- Migration: Disabling legacy role upgrade trigger
-- Date: 2026-03-29
-- Description: This trigger is no longer needed in the binary role architecture.

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_daftar_ulang_approval_role ON public.daftar_ulang_submissions;
DROP FUNCTION IF EXISTS handle_daftar_ulang_approval();

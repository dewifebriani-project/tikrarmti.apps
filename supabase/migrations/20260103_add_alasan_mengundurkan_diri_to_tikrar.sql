-- Add alasan_mengundurkan_diri column to pendaftaran_tikrar_tahfidz table
-- This column will store the reason why a participant withdrew from the program

-- Add the column
ALTER TABLE public.pendaftaran_tikrar_tahfidz
ADD COLUMN alasan_mengundurkan_diri text;

-- Add comment
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.alasan_mengundurkan_diri IS 'Alasan mengundurkan diri dari program Tikrar Tahfidz';

-- Add final_juz to pendaftaran_tikrar_tahfidz
ALTER TABLE public.pendaftaran_tikrar_tahfidz
ADD COLUMN IF NOT EXISTS final_juz character varying;

COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.final_juz IS 'Juz final yang ditetapkan jika gagal ujian prasyarat 3x';

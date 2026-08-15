-- Menambahkan kolom registration_start_date dan registration_end_date ke tabel programs
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS registration_start_date timestamp with time zone;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS registration_end_date timestamp with time zone;

ALTER TABLE public.daftar_ulang_submissions 
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS muallimah_registration_start_date timestamp with time zone;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS muallimah_registration_end_date timestamp with time zone;

-- Add final_assigned_juz to muallimah_akads
ALTER TABLE public.muallimah_akads ADD COLUMN IF NOT EXISTS final_assigned_juz TEXT;

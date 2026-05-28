-- Add paid_class_scheme to muallimah_akads to separate it from class_type
ALTER TABLE public.muallimah_akads ADD COLUMN IF NOT EXISTS paid_class_scheme VARCHAR(50) DEFAULT 'none';
